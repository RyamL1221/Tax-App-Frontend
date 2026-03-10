/**
 * Validation Layer for Frontend API Client
 * 
 * Provides client-side validation for all data types before API calls.
 * All validators return a ValidationResult with isValid flag and optional error message.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validators class provides static methods for validating various data types
 * used in API requests.
 */
export class Validators {
  /**
   * Validates email format using standard email pattern
   * Pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   * 
   * @param email - The email string to validate
   * @returns ValidationResult with isValid=true if email matches pattern
   * 
   * Requirements: 8.1
   */
  static validateEmail(email: string): ValidationResult {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailPattern.test(email)) {
      return { isValid: true };
    }
    
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }

  /**
   * Validates password length (minimum 8 characters)
   * 
   * @param password - The password string to validate
   * @returns ValidationResult with isValid=true if password is at least 8 characters
   * 
   * Requirements: 8.2
   */
  static validatePassword(password: string): ValidationResult {
    if (password.length >= 8) {
      return { isValid: true };
    }
    
    return {
      isValid: false,
      error: 'Password must be at least 8 characters'
    };
  }

  /**
   * Validates TIN (Tax Identification Number) format
   * Supports both EIN (XX-XXXXXXX) and SSN (XXX-XX-XXXX) formats
   * 
   * @param tin - The TIN string to validate
   * @param type - The type of TIN: 'EIN' or 'SSN'
   * @returns ValidationResult with isValid=true if TIN matches the specified format
   * 
   * Requirements: 8.3, 8.4
   */
  static validateTIN(tin: string, type: 'EIN' | 'SSN'): ValidationResult {
    if (type === 'EIN') {
      const einPattern = /^\d{2}-\d{7}$/;
      if (einPattern.test(tin)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        error: 'Invalid EIN format. Expected format: XX-XXXXXXX'
      };
    } else {
      const ssnPattern = /^\d{3}-\d{2}-\d{4}$/;
      if (ssnPattern.test(tin)) {
        return { isValid: true };
      }
      return {
        isValid: false,
        error: 'Invalid SSN format. Expected format: XXX-XX-XXXX'
      };
    }
  }

  /**
   * Validates state code (2 uppercase letters)
   * Pattern: /^[A-Z]{2}$/
   * 
   * @param code - The state code string to validate
   * @returns ValidationResult with isValid=true if code is exactly 2 uppercase letters
   * 
   * Requirements: 8.5
   */
  static validateStateCode(code: string): ValidationResult {
    const statePattern = /^[A-Z]{2}$/;
    
    if (statePattern.test(code)) {
      return { isValid: true };
    }
    
    return {
      isValid: false,
      error: 'State code must be 2 uppercase letters'
    };
  }

  /**
   * Validates monetary value format (string with exactly 2 decimal places)
   * Pattern: /^\d+\.\d{2}$/
   * 
   * @param value - The monetary value string to validate
   * @returns ValidationResult with isValid=true if value has exactly 2 decimal places
   * 
   * Requirements: 8.6
   */
  static validateMonetaryValue(value: string): ValidationResult {
    const monetaryPattern = /^\d+\.\d{2}$/;
    
    if (monetaryPattern.test(value)) {
      return { isValid: true };
    }
    
    return {
      isValid: false,
      error: 'Monetary value must have exactly 2 decimal places'
    };
  }

  /**
   * Validates calendar year (4-digit string between 1900 and 2100)
   * Pattern: /^\d{4}$/
   * Range: 1900-2100
   * 
   * @param year - The calendar year string to validate
   * @returns ValidationResult with isValid=true if year is a 4-digit number in valid range
   * 
   * Requirements: 8.7
   */
  static validateCalendarYear(year: string): ValidationResult {
    const yearPattern = /^\d{4}$/;
    
    if (!yearPattern.test(year)) {
      return {
        isValid: false,
        error: 'Invalid calendar year format. Expected 4 digits'
      };
    }
    
    const yearNum = parseInt(year, 10);
    if (yearNum >= 1900 && yearNum <= 2100) {
      return { isValid: true };
    }
    
    return {
      isValid: false,
      error: 'Calendar year must be between 1900 and 2100'
    };
  }
}
