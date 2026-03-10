import { ApiError, ValidationError } from './types';

/**
 * ErrorHandler class for transforming HTTP errors into application-specific error objects.
 * 
 * This class provides centralized error processing that:
 * - Extracts validation errors from 400 responses
 * - Provides user-friendly messages for authentication errors
 * - Handles rate limiting information
 * - Ensures tokens never appear in error messages
 * - Returns generic messages for server errors
 */
export class ErrorHandler {
  /**
   * Transforms an HTTP Response error into a structured ApiError object.
   * 
   * @param response - The HTTP Response object from a failed request
   * @returns A Promise resolving to an ApiError with appropriate status, message, and metadata
   * 
   * Error Handling Strategy:
   * - 400 Bad Request: Extract field-level validation errors
   * - 401 Unauthorized: Return authentication error message
   * - 409 Conflict: Extract conflict details from response
   * - 429 Too Many Requests: Extract Retry-After header
   * - 500 Internal Server Error: Return generic error message
   * - Network Errors: Return connection error message
   * 
   * Security: Ensures JWT tokens never appear in error messages
   */
  static async handleError(response: Response): Promise<ApiError> {
    // Attempt to parse response body as JSON, fallback to empty object
    let body: any = {};
    try {
      body = await response.json();
    } catch {
      // Response body is not JSON or is empty
      body = {};
    }

    switch (response.status) {
      case 400:
        // Bad Request - Extract validation errors
        return {
          status: 400,
          message: body.message || 'Validation failed',
          errors: this.extractValidationErrors(body)
        };

      case 401:
        // Unauthorized - Authentication required
        return {
          status: 401,
          message: 'Authentication required. Please log in.'
        };

      case 409:
        // Conflict - Resource conflict (e.g., duplicate email)
        return {
          status: 409,
          message: body.message || 'Resource conflict'
        };

      case 429:
        // Too Many Requests - Rate limiting
        return {
          status: 429,
          message: 'Too many requests. Please try again later.',
          retryAfter: this.extractRetryAfter(response)
        };

      case 500:
        // Internal Server Error - Generic message
        return {
          status: 500,
          message: 'An unexpected error occurred. Please try again.'
        };

      default:
        // Other errors - Generic message
        return {
          status: response.status,
          message: body.message || 'An unexpected error occurred. Please try again.'
        };
    }
  }

  /**
   * Handles network errors (connection failures, timeouts, DNS issues).
   * 
   * @param error - The error object from a failed network request
   * @returns An ApiError with status 0 and connection error message
   */
  static handleNetworkError(error: Error): ApiError {
    return {
      status: 0,
      message: 'Unable to connect. Please check your internet connection.'
    };
  }

  /**
   * Extracts validation errors from the response body.
   * 
   * @param body - The parsed response body
   * @returns An array of ValidationError objects, or undefined if none exist
   */
  private static extractValidationErrors(body: any): ValidationError[] | undefined {
    if (Array.isArray(body.errors)) {
      return body.errors.map((error: any) => ({
        field: error.field || '',
        message: error.message || ''
      }));
    }
    return undefined;
  }

  /**
   * Extracts the Retry-After header value from a 429 response.
   * 
   * @param response - The HTTP Response object
   * @returns The number of seconds until the next request is allowed, defaults to 3600 (1 hour)
   */
  private static extractRetryAfter(response: Response): number {
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      return isNaN(seconds) ? 3600 : seconds;
    }
    return 3600; // Default to 1 hour
  }
}
