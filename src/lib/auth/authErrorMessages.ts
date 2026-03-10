/**
 * Authentication Error Messages
 * 
 * Centralized error messages for authentication-related errors.
 * Provides consistent, user-friendly messages across the application.
 * 
 * Requirements:
 * - 9.1: Clear messages for missing JWT tokens
 * - 9.2: Clear messages for token expiration
 * - 9.3: Distinguish between client-side and server-side issues
 * - 9.4: Context-specific messages for redirects
 * - 9.5: Messages about form data preservation
 */

/**
 * JWT Token Error Messages
 * Messages related to JWT token issues
 */
export const jwtErrorMessages = {
  /**
   * JWT token is missing from localStorage
   * Requirement 9.1
   */
  missing: 'Your session needs to be refreshed. Please log in again.',
  
  /**
   * JWT token has expired
   * Requirement 9.2
   */
  expired: 'Your session has expired. Please log in again.',
  
  /**
   * JWT token is invalid or malformed
   * Requirement 9.3
   */
  invalid: 'Authentication error. Please log in again.',
  
  /**
   * JWT token validation failed
   * Requirement 9.3
   */
  validationFailed: 'Unable to verify your session. Please log in again.',
  
  /**
   * JWT token recovery from session failed
   * Requirement 9.3
   */
  recoveryFailed: 'Unable to restore your session. Please log in again.',
} as const;

/**
 * Session Error Messages
 * Messages related to server-side session issues
 */
export const sessionErrorMessages = {
  /**
   * Session cookie is missing
   * Requirement 9.1
   */
  missing: 'Please log in to continue.',
  
  /**
   * Session has expired
   * Requirement 9.2
   */
  expired: 'Your session has expired. Please log in again.',
  
  /**
   * Session is invalid
   * Requirement 9.3
   */
  invalid: 'Invalid session. Please log in again.',
  
  /**
   * Session validation failed
   * Requirement 9.3
   */
  validationFailed: 'Unable to verify your session. Please log in again.',
} as const;

/**
 * Authentication Synchronization Error Messages
 * Messages when session and JWT are out of sync
 */
export const syncErrorMessages = {
  /**
   * JWT exists but session is missing/invalid
   * Requirement 9.3
   */
  sessionMissing: 'Your session has ended. Please log in again.',
  
  /**
   * Session exists but JWT is missing/invalid
   * Requirement 9.3
   */
  jwtMissing: 'Your session needs to be refreshed. Please log in again.',
  
  /**
   * Both session and JWT are invalid
   * Requirement 9.3
   */
  bothInvalid: 'Authentication error. Please log in again.',
  
  /**
   * Failed to synchronize session and JWT
   * Requirement 9.3
   */
  syncFailed: 'Authentication error. Please log in again.',
} as const;

/**
 * API Authentication Error Messages
 * Messages for API request authentication failures
 */
export const apiAuthErrorMessages = {
  /**
   * 401 Unauthorized response from API
   * Requirement 9.2, 9.3
   */
  unauthorized: 'Your session has expired. Please log in again.',
  
  /**
   * Authentication header missing from request
   * Requirement 9.3
   */
  headerMissing: 'Authentication error. Please log in again.',
  
  /**
   * Token refresh required before API call
   * Requirement 9.2
   */
  refreshRequired: 'Your session needs to be refreshed. Please log in again.',
  
  /**
   * Multiple concurrent authentication failures
   * Requirement 9.3
   */
  concurrentFailures: 'Authentication error. Please log in again.',
} as const;

/**
 * Form Data Preservation Messages
 * Messages about form data being saved/restored
 */
export const formDataMessages = {
  /**
   * Form data has been preserved before redirect
   * Requirement 9.5
   */
  preserved: 'Your form data has been saved and will be restored after you log in.',
  
  /**
   * Form data is being restored after login
   * Requirement 9.5
   */
  restored: 'Your previous work has been restored.',
  
  /**
   * Form data was too old and discarded
   * Requirement 9.5
   */
  expired: 'Your saved form data has expired and could not be restored.',
  
  /**
   * Form data preservation failed
   * Requirement 9.5
   */
  preservationFailed: 'Unable to save your form data. Please note your entries before logging in.',
  
  /**
   * Form data restoration failed
   * Requirement 9.5
   */
  restorationFailed: 'Unable to restore your saved form data.',
} as const;

/**
 * Redirect Reason Messages
 * Messages explaining why user is being redirected to login
 */
export const redirectReasonMessages = {
  /**
   * Missing JWT token on form page load
   * Requirement 9.1, 9.4
   */
  missingJwt: 'Authentication required to access this form.',
  
  /**
   * Expired JWT token during form interaction
   * Requirement 9.2, 9.4
   */
  expiredJwt: 'Your session expired while filling out the form.',
  
  /**
   * Invalid JWT token detected
   * Requirement 9.3, 9.4
   */
  invalidJwt: 'Authentication error detected.',
  
  /**
   * Missing or invalid session
   * Requirement 9.1, 9.4
   */
  invalidSession: 'Your session has ended.',
  
  /**
   * API request failed with 401
   * Requirement 9.2, 9.4
   */
  apiUnauthorized: 'Your session expired during the request.',
  
  /**
   * JWT recovery failed
   * Requirement 9.3, 9.4
   */
  recoveryFailed: 'Unable to restore your session.',
  
  /**
   * Authentication synchronization failed
   * Requirement 9.3, 9.4
   */
  syncFailed: 'Authentication error occurred.',
} as const;

/**
 * Client vs Server Error Messages
 * Messages that distinguish between client and server issues
 */
export const errorSourceMessages = {
  /**
   * Client-side authentication error (missing/invalid token)
   * Requirement 9.3
   */
  client: {
    title: 'Session Error',
    description: 'There was an issue with your session. Please log in again.',
  },
  
  /**
   * Server-side authentication error (API returned 401)
   * Requirement 9.3
   */
  server: {
    title: 'Authentication Failed',
    description: 'The server could not verify your session. Please log in again.',
  },
  
  /**
   * Network error (connection failed)
   * Requirement 9.3
   */
  network: {
    title: 'Connection Error',
    description: 'Unable to connect to the server. Please check your internet connection and try again.',
  },
  
  /**
   * Storage error (localStorage/sessionStorage unavailable)
   * Requirement 9.3
   */
  storage: {
    title: 'Storage Error',
    description: 'Unable to access browser storage. Please check your browser settings and try again.',
  },
} as const;

/**
 * Form-Specific Error Messages
 * Messages specific to form authentication scenarios
 */
export const formAuthErrorMessages = {
  /**
   * Form page load with missing JWT
   * Requirement 9.1
   */
  loadMissingJwt: 'Authentication required. Please log in to access this form.',
  
  /**
   * Form page load with expired JWT
   * Requirement 9.2
   */
  loadExpiredJwt: 'Your session has expired. Please log in to access this form.',
  
  /**
   * Form submission with missing JWT
   * Requirement 9.1
   */
  submitMissingJwt: 'Your session has ended. Please log in to submit this form.',
  
  /**
   * Form submission with expired JWT
   * Requirement 9.2
   */
  submitExpiredJwt: 'Your session expired. Please log in to submit this form.',
  
  /**
   * Form submission failed due to authentication
   * Requirement 9.3
   */
  submitAuthFailed: 'Authentication error. Your form data has been saved. Please log in to continue.',
  
  /**
   * Form validation before submission
   * Requirement 9.3
   */
  validationRequired: 'Verifying your session...',
  
  /**
   * Form JWT recovery in progress
   * Requirement 9.3
   */
  recoveryInProgress: 'Restoring your session...',
} as const;

/**
 * Development/Debug Error Messages
 * Detailed messages for development mode
 */
export const debugErrorMessages = {
  /**
   * JWT token details for debugging
   */
  jwtDetails: (hasToken: boolean, isValid: boolean, isExpired: boolean) =>
    `JWT: ${hasToken ? 'present' : 'missing'}, valid: ${isValid}, expired: ${isExpired}`,
  
  /**
   * Session details for debugging
   */
  sessionDetails: (hasSession: boolean, isValid: boolean) =>
    `Session: ${hasSession ? 'present' : 'missing'}, valid: ${isValid}`,
  
  /**
   * Auth state details for debugging
   */
  authStateDetails: (hasSession: boolean, hasJwt: boolean, isAuthenticated: boolean) =>
    `Auth State: session=${hasSession}, jwt=${hasJwt}, authenticated=${isAuthenticated}`,
  
  /**
   * Token operation details for debugging
   */
  tokenOperation: (operation: string, success: boolean, reason?: string) =>
    `Token ${operation}: ${success ? 'success' : 'failed'}${reason ? ` - ${reason}` : ''}`,
  
  /**
   * Redirect details for debugging
   */
  redirectDetails: (from: string, to: string, reason: string) =>
    `Redirect: ${from} → ${to} (${reason})`,
} as const;

/**
 * Helper function to get error message with context
 * Supports message parameterization
 */
export function getAuthErrorMessage(
  category: 'jwt' | 'session' | 'sync' | 'api' | 'form',
  errorType: string,
  context?: Record<string, any>
): string {
  switch (category) {
    case 'jwt':
      return jwtErrorMessages[errorType as keyof typeof jwtErrorMessages] || jwtErrorMessages.invalid;
    case 'session':
      return sessionErrorMessages[errorType as keyof typeof sessionErrorMessages] || sessionErrorMessages.invalid;
    case 'sync':
      return syncErrorMessages[errorType as keyof typeof syncErrorMessages] || syncErrorMessages.syncFailed;
    case 'api':
      return apiAuthErrorMessages[errorType as keyof typeof apiAuthErrorMessages] || apiAuthErrorMessages.unauthorized;
    case 'form':
      return formAuthErrorMessages[errorType as keyof typeof formAuthErrorMessages] || formAuthErrorMessages.submitAuthFailed;
    default:
      return 'Authentication error. Please log in again.';
  }
}

/**
 * Helper function to get redirect message with form data preservation info
 * Requirement 9.4, 9.5
 */
export function getRedirectMessage(
  reason: keyof typeof redirectReasonMessages,
  formDataPreserved: boolean
): string {
  const reasonMessage = redirectReasonMessages[reason];
  if (formDataPreserved) {
    return `${reasonMessage} ${formDataMessages.preserved}`;
  }
  return reasonMessage;
}

/**
 * Helper function to get error source message
 * Requirement 9.3
 */
export function getErrorSourceMessage(
  source: 'client' | 'server' | 'network' | 'storage'
): { title: string; description: string } {
  return errorSourceMessages[source];
}

/**
 * Type exports for TypeScript support
 */
export type JwtErrorType = keyof typeof jwtErrorMessages;
export type SessionErrorType = keyof typeof sessionErrorMessages;
export type SyncErrorType = keyof typeof syncErrorMessages;
export type ApiAuthErrorType = keyof typeof apiAuthErrorMessages;
export type FormAuthErrorType = keyof typeof formAuthErrorMessages;
export type RedirectReasonType = keyof typeof redirectReasonMessages;
export type ErrorSourceType = keyof typeof errorSourceMessages;
