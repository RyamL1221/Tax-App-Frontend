/**
 * Authentication types and interfaces for the login page
 */

/**
 * Form data structure for login credentials
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Authentication error types
 */
export interface AuthError {
  type: 'validation' | 'authentication' | 'network' | 'rate_limit';
  message: string;
  field?: 'email' | 'password';
}

/**
 * Response structure from authentication API
 */
export interface AuthResponse {
  success: boolean;
  redirectUrl?: string;
  error?: AuthError;
}

/**
 * Rate limiting state management
 */
export interface RateLimitState {
  attempts: number;
  windowStart: number;
  isLocked: boolean;
  unlockTime?: number;
}
