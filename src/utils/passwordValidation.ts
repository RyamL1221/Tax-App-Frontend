/**
 * Password validation utilities for the registration system
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export enum PasswordStrength {
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong'
}

/**
 * Validates a password against all security requirements
 * Requirements: 3.1, 3.2
 * 
 * @param password - The password string to validate
 * @returns PasswordValidationResult with isValid flag and array of error messages
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculates the strength of a password based on various factors
 * Requirements: 3.3, 3.4
 * 
 * @param password - The password string to evaluate
 * @returns PasswordStrength enum value (WEAK, FAIR, GOOD, or STRONG)
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) return PasswordStrength.WEAK;

  let score = 0;

  // Length scoring
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character variety scoring
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Pattern penalties (reduce score for common weak patterns)
  if (/(.)\1{2,}/.test(password)) score--; // Repeated characters (e.g., "aaa")
  if (/^[0-9]+$/.test(password)) score--; // Only numbers
  if (/^[a-zA-Z]+$/.test(password)) score--; // Only letters

  // Map score to strength levels
  if (score <= 2) return PasswordStrength.WEAK;
  if (score <= 4) return PasswordStrength.FAIR;
  if (score <= 6) return PasswordStrength.GOOD;
  return PasswordStrength.STRONG;
}

/**
 * Validates an email address format
 * Requirements: 2.1
 * 
 * @param email - The email string to validate
 * @returns true if email format is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  // Basic email regex pattern
  // Must have: local part, @, domain, and TLD
  // Cannot have: spaces, consecutive dots, leading/trailing dots
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Additional validation for edge cases
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Check for consecutive dots
  if (email.includes('..')) {
    return false;
  }
  
  // Check for dots at start or end of local/domain parts
  const [local, domain] = email.split('@');
  if (local.startsWith('.') || local.endsWith('.') || 
      domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }
  
  return true;
}
