/**
 * FormDataPreserver - Preserves form data during re-authentication
 * 
 * Handles preservation and restoration of form data when users need to
 * re-authenticate while filling out forms. This prevents data loss and
 * improves user experience during authentication failures.
 * 
 * Features:
 * - Saves form data to sessionStorage with metadata
 * - Automatic expiration after 1 hour
 * - Secure handling of sensitive data
 * - Comprehensive logging of operations
 * 
 * Security Considerations:
 * - Uses sessionStorage (cleared when tab closes)
 * - Automatic expiration prevents stale data
 * - Validates data integrity on restoration
 * - Logs all operations for audit trail
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.5
 */

import { logAuthEvent } from './AuthLogger';

/**
 * Metadata about saved form data
 */
export interface FormDataMetadata {
  /** Timestamp when data was saved (milliseconds since epoch) */
  savedAt: number;
  /** Type of form (e.g., '1099-DIV', 'W-2') */
  formType: string;
  /** Size of serialized data in bytes */
  dataSize: number;
  /** Timestamp when data expires (milliseconds since epoch) */
  expiresAt: number;
  /** URL to return to after re-authentication */
  returnUrl?: string;
  /** User ID who saved the data */
  userId?: string;
}

/**
 * Stored form data structure
 */
interface StoredFormData {
  /** The actual form data */
  data: unknown;
  /** Metadata about the saved data */
  metadata: FormDataMetadata;
}

/**
 * Storage key prefix for form data
 */
const STORAGE_KEY_PREFIX = 'form_data_';

/**
 * Default expiration time: 1 hour in milliseconds
 */
const DEFAULT_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Maximum data size: 1MB (to prevent storage quota issues)
 */
const MAX_DATA_SIZE = 1024 * 1024; // 1MB

/**
 * FormDataPreserver class
 * 
 * Provides methods to save, restore, and manage form data during
 * re-authentication flows.
 */
export class FormDataPreserver {
  /**
   * Save form data to session storage
   * 
   * @param formType - Type of form (e.g., '1099-DIV')
   * @param data - Form data to save
   * @param options - Optional configuration
   * @param options.returnUrl - URL to return to after re-authentication
   * @param options.userId - User ID who is saving the data
   * @param options.expirationMs - Custom expiration time in milliseconds
   * 
   * @throws Error if data is too large or storage fails
   * 
   * Requirements: 8.1
   */
  saveFormData(
    formType: string,
    data: unknown,
    options?: {
      returnUrl?: string;
      userId?: string;
      expirationMs?: number;
    }
  ): void {
    try {
      // Validate inputs
      if (!formType || typeof formType !== 'string') {
        throw new Error('Form type must be a non-empty string');
      }

      if (data === null || data === undefined) {
        throw new Error('Form data cannot be null or undefined');
      }

      // Serialize data
      const serializedData = JSON.stringify(data);
      const dataSize = new Blob([serializedData]).size;

      // Check size limit
      if (dataSize > MAX_DATA_SIZE) {
        throw new Error(
          `Form data too large: ${dataSize} bytes (max: ${MAX_DATA_SIZE} bytes)`
        );
      }

      // Create metadata
      const now = Date.now();
      const expirationMs = options?.expirationMs ?? DEFAULT_EXPIRATION_MS;
      const metadata: FormDataMetadata = {
        savedAt: now,
        formType,
        dataSize,
        expiresAt: now + expirationMs,
        returnUrl: options?.returnUrl,
        userId: options?.userId,
      };

      // Create stored data structure
      const storedData: StoredFormData = {
        data,
        metadata,
      };

      // Save to sessionStorage
      const storageKey = this.getStorageKey(formType);
      sessionStorage.setItem(storageKey, JSON.stringify(storedData));

      // Log success
      logAuthEvent(
        `Form data saved: ${formType}`,
        'info',
        undefined,
        {
          formType,
          dataSize,
          expiresAt: new Date(metadata.expiresAt).toISOString(),
          returnUrl: options?.returnUrl,
        }
      );
    } catch (error) {
      // Log failure
      logAuthEvent(
        `Failed to save form data: ${formType}`,
        'error',
        undefined,
        {
          formType,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      throw error;
    }
  }

  /**
   * Restore form data from session storage
   * 
   * @param formType - Type of form to restore
   * @returns Form data if found and not expired, null otherwise
   * 
   * Requirements: 8.2, 8.5
   */
  restoreFormData(formType: string): unknown | null {
    try {
      // Validate input
      if (!formType || typeof formType !== 'string') {
        throw new Error('Form type must be a non-empty string');
      }

      // Get from sessionStorage
      const storageKey = this.getStorageKey(formType);
      const storedJson = sessionStorage.getItem(storageKey);

      if (!storedJson) {
        logAuthEvent(
          `No saved form data found: ${formType}`,
          'debug',
          undefined,
          { formType }
        );
        return null;
      }

      // Parse stored data
      const storedData = JSON.parse(storedJson) as StoredFormData;

      // Validate structure
      if (!storedData.data || !storedData.metadata) {
        logAuthEvent(
          `Invalid stored form data structure: ${formType}`,
          'warn',
          undefined,
          { formType }
        );
        this.clearFormData(formType);
        return null;
      }

      // Check expiration
      const now = Date.now();
      if (now > storedData.metadata.expiresAt) {
        logAuthEvent(
          `Form data expired: ${formType}`,
          'info',
          undefined,
          {
            formType,
            savedAt: new Date(storedData.metadata.savedAt).toISOString(),
            expiresAt: new Date(storedData.metadata.expiresAt).toISOString(),
            ageMinutes: Math.round((now - storedData.metadata.savedAt) / 60000),
          }
        );
        this.clearFormData(formType);
        return null;
      }

      // Log success
      logAuthEvent(
        `Form data restored: ${formType}`,
        'info',
        undefined,
        {
          formType,
          dataSize: storedData.metadata.dataSize,
          ageMinutes: Math.round((now - storedData.metadata.savedAt) / 60000),
        }
      );

      return storedData.data;
    } catch (error) {
      // Log failure
      logAuthEvent(
        `Failed to restore form data: ${formType}`,
        'error',
        undefined,
        {
          formType,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      // Clear corrupted data
      this.clearFormData(formType);
      return null;
    }
  }

  /**
   * Clear saved form data from session storage
   * 
   * @param formType - Type of form to clear
   * 
   * Requirements: 8.3
   */
  clearFormData(formType: string): void {
    try {
      // Validate input
      if (!formType || typeof formType !== 'string') {
        throw new Error('Form type must be a non-empty string');
      }

      const storageKey = this.getStorageKey(formType);
      sessionStorage.removeItem(storageKey);

      logAuthEvent(
        `Form data cleared: ${formType}`,
        'info',
        undefined,
        { formType }
      );
    } catch (error) {
      logAuthEvent(
        `Failed to clear form data: ${formType}`,
        'error',
        undefined,
        {
          formType,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  /**
   * Check if saved form data exists
   * 
   * @param formType - Type of form to check
   * @returns True if non-expired data exists, false otherwise
   * 
   * Requirements: 8.2
   */
  hasSavedFormData(formType: string): boolean {
    try {
      // Validate input
      if (!formType || typeof formType !== 'string') {
        return false;
      }

      const storageKey = this.getStorageKey(formType);
      const storedJson = sessionStorage.getItem(storageKey);

      if (!storedJson) {
        return false;
      }

      // Parse and check expiration
      const storedData = JSON.parse(storedJson) as StoredFormData;
      
      if (!storedData.metadata) {
        return false;
      }

      const now = Date.now();
      const isExpired = now > storedData.metadata.expiresAt;

      if (isExpired) {
        // Clean up expired data
        this.clearFormData(formType);
        return false;
      }

      return true;
    } catch (error) {
      // If there's any error, assume no valid data exists
      logAuthEvent(
        `Error checking for saved form data: ${formType}`,
        'warn',
        undefined,
        {
          formType,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return false;
    }
  }

  /**
   * Get metadata about saved form data
   * 
   * @param formType - Type of form to get metadata for
   * @returns Metadata if data exists and is not expired, null otherwise
   * 
   * Requirements: 8.2
   */
  getFormDataMetadata(formType: string): FormDataMetadata | null {
    try {
      // Validate input
      if (!formType || typeof formType !== 'string') {
        return null;
      }

      const storageKey = this.getStorageKey(formType);
      const storedJson = sessionStorage.getItem(storageKey);

      if (!storedJson) {
        return null;
      }

      // Parse stored data
      const storedData = JSON.parse(storedJson) as StoredFormData;

      if (!storedData.metadata) {
        return null;
      }

      // Check expiration
      const now = Date.now();
      if (now > storedData.metadata.expiresAt) {
        this.clearFormData(formType);
        return null;
      }

      return storedData.metadata;
    } catch (error) {
      logAuthEvent(
        `Error getting form data metadata: ${formType}`,
        'warn',
        undefined,
        {
          formType,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return null;
    }
  }

  /**
   * Clear all expired form data from session storage
   * 
   * This is a maintenance method that can be called periodically
   * to clean up expired data.
   */
  clearExpiredFormData(): void {
    try {
      const now = Date.now();
      let clearedCount = 0;

      // Iterate through all sessionStorage keys
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        
        if (!key || !key.startsWith(STORAGE_KEY_PREFIX)) {
          continue;
        }

        const storedJson = sessionStorage.getItem(key);
        if (!storedJson) {
          continue;
        }

        try {
          const storedData = JSON.parse(storedJson) as StoredFormData;
          
          if (storedData.metadata && now > storedData.metadata.expiresAt) {
            sessionStorage.removeItem(key);
            clearedCount++;
          }
        } catch {
          // If we can't parse it, remove it
          sessionStorage.removeItem(key);
          clearedCount++;
        }
      }

      if (clearedCount > 0) {
        logAuthEvent(
          `Cleared ${clearedCount} expired form data entries`,
          'info',
          undefined,
          { clearedCount }
        );
      }
    } catch (error) {
      logAuthEvent(
        'Error clearing expired form data',
        'error',
        undefined,
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  /**
   * Get storage key for a form type
   * 
   * @param formType - Type of form
   * @returns Storage key
   */
  private getStorageKey(formType: string): string {
    return `${STORAGE_KEY_PREFIX}${formType}`;
  }
}

/**
 * Singleton instance for convenience
 */
export const formDataPreserver = new FormDataPreserver();

/**
 * Export individual methods for functional usage
 */
export const saveFormData = formDataPreserver.saveFormData.bind(formDataPreserver);
export const restoreFormData = formDataPreserver.restoreFormData.bind(formDataPreserver);
export const clearFormData = formDataPreserver.clearFormData.bind(formDataPreserver);
export const hasSavedFormData = formDataPreserver.hasSavedFormData.bind(formDataPreserver);
export const getFormDataMetadata = formDataPreserver.getFormDataMetadata.bind(formDataPreserver);
export const clearExpiredFormData = formDataPreserver.clearExpiredFormData.bind(formDataPreserver);
