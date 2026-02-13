/**
 * useForm1099Div Hook - Form Workflow State Management
 * 
 * This custom hook encapsulates the complete workflow logic for the 1099-DIV
 * form submission feature. It manages the state machine for input → preview → approve
 * workflow, handles API integration, and provides error handling with authentication.
 * 
 * Workflow States:
 * - 'input': User is entering/editing form data
 * - 'preview': User is viewing generated document and can approve or edit
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 8.3, 8.4, 9.1, 9.2, 9.3
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { documentService } from '@/lib/api';
import type { Form1099DivData, GenerateDocumentResponse } from '@/lib/api';
import { logAuthEvent, createAuthState } from '@/lib/auth/AuthLogger';
import { saveFormData, restoreFormData, clearFormData, hasSavedFormData } from '@/lib/auth/FormDataPreserver';
import { hasToken } from '@/lib/api/tokenManager';

/**
 * Return type for useForm1099Div hook
 */
export interface UseForm1099DivReturn {
  /** Current workflow mode: 'input' for form entry, 'preview' for document review */
  mode: 'input' | 'preview';
  
  /** The form data that was submitted (preserved for editing) */
  formData: Form1099DivData | null;
  
  /** The generated document response from the API */
  generatedDocument: GenerateDocumentResponse | null;
  
  /** Current error message, if any */
  error: string | null;
  
  /** Whether an API request is currently in progress */
  isSubmitting: boolean;
  
  /** Handler for generating document preview from form data */
  handleGeneratePreview: (data: Form1099DivData) => Promise<void>;
  
  /** Handler for returning to edit mode from preview */
  handleEdit: () => void;
  
  /** Handler for approving the document and resetting the form */
  handleApprove: () => void;
  
  /** Handler for retrying a failed request */
  handleRetry: () => Promise<void>;
  
  /** Whether the last error was a network error (allows retry) */
  canRetry: boolean;
  
  /** Whether to show the form data restoration notification */
  showRestorationNotification: boolean;
}

/**
 * Custom hook for managing 1099-DIV form workflow
 * 
 * This hook manages the complete lifecycle of form submission:
 * 1. User enters data in input mode
 * 2. User submits → API call → transition to preview mode
 * 3. User can edit (return to input with preserved data) or approve (reset form)
 * 
 * Authentication:
 * - Requires a valid JWT token for API calls
 * - Redirects to login if token is missing or API returns 401
 * 
 * Error Handling:
 * - 401 Unauthorized: Redirect to login
 * - 400 Bad Request: Display validation error message
 * - 500 Server Error: Display generic error message
 * - Network errors: Display network error message
 * 
 * @param token - JWT authentication token (null if not authenticated)
 * @returns Object containing state and handlers for form workflow
 * 
 * @example
 * ```typescript
 * const {
 *   mode,
 *   formData,
 *   generatedDocument,
 *   error,
 *   isSubmitting,
 *   handleGeneratePreview,
 *   handleEdit,
 *   handleApprove
 * } = useForm1099Div(token);
 * 
 * // In input mode
 * if (mode === 'input') {
 *   return <Form1099DivInput 
 *     onSubmit={handleGeneratePreview}
 *     defaultValues={formData}
 *     error={error}
 *   />;
 * }
 * 
 * // In preview mode
 * if (mode === 'preview' && generatedDocument) {
 *   return <Form1099DivPreview
 *     document={generatedDocument}
 *     onEdit={handleEdit}
 *     onApprove={handleApprove}
 *   />;
 * }
 * ```
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 9.1, 9.2, 9.3
 */
export function useForm1099Div(token: string | null): UseForm1099DivReturn {
  const router = useRouter();
  const pathname = usePathname();
  
  // Workflow state
  const [mode, setMode] = useState<'input' | 'preview'>('input');
  
  // Data state
  const [formData, setFormData] = useState<Form1099DivData | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<GenerateDocumentResponse | null>(null);
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canRetry, setCanRetry] = useState(false);
  
  // Store the last submitted data for retry functionality
  const [lastSubmittedData, setLastSubmittedData] = useState<Form1099DivData | null>(null);
  
  // Track if we've shown the restoration notification
  const [showRestorationNotification, setShowRestorationNotification] = useState(false);
  
  /**
   * Check for and restore saved form data on mount
   * Requirement 8.3: Restore form data after successful login
   * Requirement 8.4: Display notification if form data exists
   */
  useEffect(() => {
    const formType = '1099-DIV';
    
    // Check if there's saved form data
    if (hasSavedFormData(formType)) {
      console.log('[Form1099Div] Found saved form data, attempting restoration...');
      
      // Restore the form data
      const restoredData = restoreFormData(formType);
      
      if (restoredData) {
        // Validate that the restored data is the correct type
        if (typeof restoredData === 'object' && restoredData !== null) {
          setFormData(restoredData as Form1099DivData);
          setShowRestorationNotification(true);
          
          console.log('[Form1099Div] Form data restored successfully');
          
          // Clear the saved data after successful restoration
          clearFormData(formType);
          
          // Hide the notification after 5 seconds
          setTimeout(() => {
            setShowRestorationNotification(false);
          }, 5000);
        } else {
          console.warn('[Form1099Div] Restored data is not a valid object, clearing...');
          clearFormData(formType);
        }
      } else {
        console.log('[Form1099Div] No valid form data to restore (may have expired)');
      }
    }
  }, []); // Run only on mount
  
  /**
   * Handles form submission and document generation
   * 
   * This function:
   * 1. Validates JWT token before making API call
   * 2. Validates authentication (redirects to login if no token)
   * 3. Sets loading state
   * 4. Calls the document generation API
   * 5. On success: stores data and document, transitions to preview mode
   * 6. On error: displays appropriate error message or redirects to login
   * 
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.4, 4.5, 10.1, 10.2, 10.4, 10.5
   */
  const handleGeneratePreview = async (data: Form1099DivData): Promise<void> => {
    // Validate JWT token before proceeding (Requirement 4.4)
    const hasValidToken = hasToken('Form1099Div');
    
    logAuthEvent(
      'Form submission JWT validation',
      hasValidToken ? 'info' : 'warn',
      createAuthState(hasValidToken, null, null),
      {
        operation: 'form-submission-validation',
        valid: hasValidToken,
        reason: hasValidToken ? 'JWT token present' : 'No JWT token found',
      }
    );
    
    if (!hasValidToken) {
      const errorMsg = 'Authentication required. Please log in again.';
      console.error('[Form1099Div] JWT validation failed:', errorMsg);
      
      // Store form data for potential recovery (Requirement 4.5)
      setFormData(data);
      setLastSubmittedData(data);
      
      // Preserve form data before redirecting (Requirement 5.2, 8.1)
      try {
        saveFormData('1099-DIV', data, {
          returnUrl: pathname || '/forms/1099-div',
        });
        console.log('[Form1099Div] Form data preserved for recovery');
      } catch (preserveError) {
        console.error('[Form1099Div] Failed to preserve form data:', preserveError);
      }
      
      // Set error message
      setError('Your session has expired. Please log in again to submit the form.');
      setCanRetry(false);
      
      // Redirect to login after a brief delay to show the error message
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      return;
    }
    
    // Check authentication token parameter (legacy check)
    if (!token) {
      const errorMsg = 'No authentication token available';
      console.error('[Form1099Div] Error:', errorMsg);
      
      // Store form data for potential recovery
      setFormData(data);
      setLastSubmittedData(data);
      
      // Preserve form data before redirecting (Requirement 5.2, 8.1)
      try {
        saveFormData('1099-DIV', data, {
          returnUrl: pathname || '/forms/1099-div',
        });
        console.log('[Form1099Div] Form data preserved for recovery');
      } catch (preserveError) {
        console.error('[Form1099Div] Failed to preserve form data:', preserveError);
      }
      
      setError('Your session has expired. Please log in again to submit the form.');
      setCanRetry(false);
      
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      return;
    }
    
    // Store data for retry functionality
    setLastSubmittedData(data);
    
    // Set loading state
    setIsSubmitting(true);
    setError(null);
    setCanRetry(false);
    
    try {
      console.log('[Form1099Div] Generating document preview...');
      
      // Call document generation API
      // The documentService will automatically include the token via interceptors
      const response = await documentService.generateDocument({
        documentType: '1099-DIV',
        formData: data,
      });
      
      // Store form data for potential editing
      setFormData(data);
      
      // Store generated document response
      setGeneratedDocument(response);
      
      // Transition to preview mode
      setMode('preview');
      
      console.log('[Form1099Div] Document generated successfully:', {
        jobId: response.jobId,
        status: response.status,
        documentType: response.documentType
      });
    } catch (err) {
      // Log all errors to console for debugging (Requirement 10.5)
      console.error('[Form1099Div] Error generating document:', err);
      
      // Preserve form data on error (Requirement 4.5)
      setFormData(data);
      
      // Handle different error types with user-friendly messages
      if (err && typeof err === 'object' && 'status' in err) {
        const apiError = err as { status: number; message: string };
        
        console.error('[Form1099Div] API Error:', {
          status: apiError.status,
          message: apiError.message
        });
        
        // Handle authentication errors (401) - Requirement 3.5, 10.4
        if (apiError.status === 401) {
          console.error('[Form1099Div] Authentication failed, redirecting to login');
          
          // Preserve form data before redirecting (Requirement 5.2, 8.1)
          try {
            saveFormData('1099-DIV', data, {
              returnUrl: pathname || '/forms/1099-div',
            });
            console.log('[Form1099Div] Form data preserved for recovery');
          } catch (preserveError) {
            console.error('[Form1099Div] Failed to preserve form data:', preserveError);
          }
          
          setError('Your session has expired. Please log in again.');
          setCanRetry(false);
          // Redirect after a brief delay to show the error message
          setTimeout(() => {
            router.push('/login');
          }, 1500);
          return;
        }
        
        // Handle validation errors (400) - Requirement 3.6, 10.1
        if (apiError.status === 400) {
          const errorMsg = apiError.message || 'Validation error. Please check your inputs and try again.';
          console.error('[Form1099Div] Validation error:', errorMsg);
          setError(errorMsg);
          setCanRetry(false); // Validation errors shouldn't be retried
        }
        // Handle server errors (500) - Requirement 3.7, 10.1
        else if (apiError.status === 500) {
          const errorMsg = 'Server error. Please try again later.';
          console.error('[Form1099Div] Server error:', apiError.message);
          setError(errorMsg);
          setCanRetry(true); // Server errors can be retried
        }
        // Handle network errors (status 0) - Requirement 3.8, 10.2
        else if (apiError.status === 0) {
          const errorMsg = 'Unable to connect to the server. Please check your internet connection and try again.';
          console.error('[Form1099Div] Network error:', apiError.message);
          setError(errorMsg);
          setCanRetry(true); // Network errors can be retried
        }
        // Handle other API errors
        else {
          const errorMsg = apiError.message || 'An error occurred while generating the document. Please try again.';
          console.error('[Form1099Div] API error:', errorMsg);
          setError(errorMsg);
          setCanRetry(true); // Other errors can be retried
        }
      } else if (err instanceof Error) {
        // Handle JavaScript errors
        console.error('[Form1099Div] JavaScript error:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        
        // Check for authentication-related errors
        if (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized')) {
          console.error('[Form1099Div] Authentication error detected, redirecting to login');
          
          // Preserve form data before redirecting (Requirement 5.2, 8.1)
          try {
            saveFormData('1099-DIV', data, {
              returnUrl: pathname || '/forms/1099-div',
            });
            console.log('[Form1099Div] Form data preserved for recovery');
          } catch (preserveError) {
            console.error('[Form1099Div] Failed to preserve form data:', preserveError);
          }
          
          setError('Your session has expired. Please log in again.');
          setCanRetry(false);
          setTimeout(() => {
            router.push('/login');
          }, 1500);
          return;
        }
        
        // Check for network-related errors
        if (err.message.toLowerCase().includes('network') || 
            err.message.toLowerCase().includes('fetch') ||
            err.message.toLowerCase().includes('connection')) {
          setError('Unable to connect to the server. Please check your internet connection and try again.');
          setCanRetry(true);
        } else {
          setError(err.message || 'An unexpected error occurred. Please try again.');
          setCanRetry(true);
        }
      } else {
        // Handle unknown errors
        console.error('[Form1099Div] Unknown error type:', err);
        setError('An unexpected error occurred. Please try again.');
        setCanRetry(true);
      }
    } finally {
      // Always clear loading state
      setIsSubmitting(false);
    }
  };
  
  /**
   * Handles returning to edit mode from preview
   * 
   * This function:
   * 1. Transitions back to input mode
   * 2. Preserves the form data for editing
   * 3. Clears any error messages
   * 
   * The form data is maintained so the user can see and modify their previous inputs.
   * 
   * Requirements: 6.3, 6.4, 9.2
   */
  const handleEdit = (): void => {
    setMode('input');
    setError(null);
    setCanRetry(false);
    console.log('[Form1099Div] Returning to edit mode with preserved form data');
  };
  
  /**
   * Handles final approval of the document
   * 
   * This function:
   * 1. Clears all form data
   * 2. Clears the generated document
   * 3. Returns to input mode
   * 4. Clears any error messages
   * 
   * This resets the form to its initial state, ready for a new submission.
   * 
   * Requirements: 6.1, 6.2, 9.3
   */
  const handleApprove = (): void => {
    setFormData(null);
    setGeneratedDocument(null);
    setLastSubmittedData(null);
    setMode('input');
    setError(null);
    setCanRetry(false);
    console.log('[Form1099Div] Document approved, form reset to initial state');
  };
  
  /**
   * Handles retrying a failed request
   * 
   * This function:
   * 1. Checks if there's data to retry with
   * 2. Calls handleGeneratePreview with the last submitted data
   * 
   * This allows users to retry network errors or server errors without
   * re-entering their form data.
   * 
   * Requirements: 10.2
   */
  const handleRetry = async (): Promise<void> => {
    if (!lastSubmittedData) {
      console.error('[Form1099Div] No data available to retry');
      setError('No data available to retry. Please submit the form again.');
      return;
    }
    
    console.log('[Form1099Div] Retrying document generation...');
    await handleGeneratePreview(lastSubmittedData);
  };
  
  return {
    mode,
    formData,
    generatedDocument,
    error,
    isSubmitting,
    handleGeneratePreview,
    handleEdit,
    handleApprove,
    handleRetry,
    canRetry,
    showRestorationNotification,
  };
}
