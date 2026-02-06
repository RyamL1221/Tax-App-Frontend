/**
 * Request and Response Interceptors
 * 
 * This module provides interceptor functions for processing HTTP requests
 * and responses. The interceptors handle authentication token injection
 * and automatic token clearing on authentication failures.
 * 
 * Requirements: 2.2, 6.2, 6.3
 */

import { RequestConfig } from './types';
import { tokenManager } from './tokenManager';

/**
 * Request interceptor that adds JWT authentication to requests
 * 
 * This interceptor automatically adds the Authorization header with a Bearer
 * token for all requests that require authentication. Requests can opt out
 * by setting requiresAuth: false in the request config.
 * 
 * @param config - The request configuration
 * @returns The modified request configuration with Authorization header
 * 
 * Requirements: 2.2
 */
export function authRequestInterceptor(config: RequestConfig): RequestConfig {
  // Skip authentication for requests that explicitly don't require it
  if (config.requiresAuth === false) {
    return config;
  }

  // Get the stored JWT token
  const token = tokenManager.getToken();
  
  // If a token exists, add it to the Authorization header
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
  }

  return config;
}

/**
 * Response interceptor that handles authentication failures
 * 
 * This interceptor detects 401 Unauthorized responses and automatically
 * clears stored tokens and redirects to the login page (in browser environments).
 * This ensures that expired or invalid tokens are removed and users are
 * prompted to re-authenticate.
 * 
 * @param response - The HTTP response
 * @returns The unmodified response (after handling 401 errors)
 * 
 * Requirements: 6.2, 6.3
 */
export async function authResponseInterceptor(response: Response): Promise<Response> {
  // Handle 401 Unauthorized responses
  if (response.status === 401) {
    // Clear the stored token immediately
    tokenManager.clearToken();
    
    // Redirect to login page (only in browser environment)
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Return the response unchanged (error handling happens elsewhere)
  return response;
}
