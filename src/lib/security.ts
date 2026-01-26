/**
 * Security utilities for the login page
 * 
 * This module provides security-related utilities to ensure
 * best practices are followed, particularly around password handling.
 */

/**
 * Validates that no password data is stored in browser storage
 * 
 * This function checks localStorage and sessionStorage to ensure
 * no password-related data has been inadvertently stored.
 * 
 * Requirement 7.2: The Login_Page SHALL NOT store passwords in 
 * browser local storage or session storage
 * 
 * @returns true if no password data is found in storage, false otherwise
 */
export function validateNoPasswordInStorage(): boolean {
  try {
    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value && isPasswordData(key, value)) {
          console.error('Security violation: Password data found in localStorage');
          return false;
        }
      }
    }
    
    // Check sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key);
        if (value && isPasswordData(key, value)) {
          console.error('Security violation: Password data found in sessionStorage');
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    // If storage is not available (e.g., in some browsers with strict privacy settings),
    // we consider this as passing the check since no data can be stored
    return true;
  }
}

/**
 * Checks if a storage key or value might contain password data
 * 
 * @param key - The storage key
 * @param value - The storage value
 * @returns true if the key or value suggests password data
 */
function isPasswordData(key: string, value: string): boolean {
  const lowerKey = key.toLowerCase();
  const lowerValue = value.toLowerCase();
  
  // Check for password-related keys
  const passwordKeywords = ['password', 'passwd', 'pwd', 'pass'];
  
  for (const keyword of passwordKeywords) {
    if (lowerKey.includes(keyword)) {
      return true;
    }
  }
  
  // Check if value looks like it might contain password data
  // by looking for password-related fields in JSON
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      if (containsPasswordField(parsed)) {
        return true;
      }
    } catch {
      // Not valid JSON, continue checking
    }
  }
  
  return false;
}

/**
 * Recursively checks if an object contains password-related fields
 * 
 * @param obj - The object to check
 * @returns true if password-related fields are found
 */
function containsPasswordField(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const passwordKeywords = ['password', 'passwd', 'pwd', 'pass'];
  
  for (const key in obj) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains password keywords
    for (const keyword of passwordKeywords) {
      if (lowerKey.includes(keyword)) {
        return true;
      }
    }
    
    // Recursively check nested objects
    if (typeof obj[key] === 'object') {
      if (containsPasswordField(obj[key])) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Sanitizes form data to ensure passwords are not logged or stored
 * 
 * @param data - The form data to sanitize
 * @returns Sanitized data with password fields redacted
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('password') || lowerKey.includes('passwd') || lowerKey.includes('pwd')) {
      sanitized[key] = '[REDACTED]' as any;
    }
  }
  
  return sanitized;
}
