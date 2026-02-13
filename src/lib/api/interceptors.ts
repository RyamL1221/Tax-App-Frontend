/**
 * Request and Response Interceptors
 * 
 * This module provides interceptor functions for processing HTTP requests
 * and responses. The interceptors handle authentication token injection
 * and automatic token clearing on authentication failures.
 * 
 * Enhanced with comprehensive logging to track authentication state changes,
 * 401 responses, and redirect decisions.
 * 
 * Enhanced with form data preservation to prevent data loss during
 * re-authentication flows.
 * 
 * Requirements: 2.2, 2.4, 2.6, 5.2, 6.2, 6.3
 */

import { RequestConfig } from './types';
import { tokenManager } from './tokenManager';
import { logAuthFailure, logRedirect, createAuthState } from '../auth/AuthLogger';
import { saveFormData } from '../auth/FormDataPreserver';

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
 * Attempt to extract form data from the current page context
 * 
 * This is a best-effort approach to preserve form data when a 401 occurs.
 * It looks for common form data patterns in the DOM and window object.
 * 
 * Note: This is a secondary safety net. The primary preservation happens
 * in form components (e.g., useForm1099Div) which have direct access to
 * form state.
 * 
 * @returns Object with formType and formData if found, null otherwise
 */
function extractFormDataFromPage(): { formType: string; formData: unknown } | null {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  try {
    // Check if we're on a form page by examining the pathname
    const pathname = window.location.pathname;
    
    // Detect 1099-DIV form page
    if (pathname.includes('/forms/1099-div')) {
      // Try to find form inputs in the DOM
      const formElement = document.querySelector('form');
      if (formElement) {
        const formData: Record<string, string> = {};
        const inputs = formElement.querySelectorAll('input, select, textarea');
        
        inputs.forEach((input) => {
          const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
          const name = element.name || element.id;
          
          if (name && element.value) {
            // Only capture non-empty values
            if (element.type === 'checkbox') {
              formData[name] = (element as HTMLInputElement).checked ? 'true' : 'false';
            } else {
              formData[name] = element.value;
            }
          }
        });
        
        // Only return if we found some data
        if (Object.keys(formData).length > 0) {
          return {
            formType: '1099-DIV',
            formData,
          };
        }
      }
    }
    
    // Could add detection for other form types here in the future
    
    return null;
  } catch (error) {
    // Silently fail - this is best-effort
    console.warn('Failed to extract form data from page:', error);
    return null;
  }
}

/**
 * Response interceptor that handles authentication failures
 * 
 * This interceptor detects 401 Unauthorized responses and automatically
 * clears stored tokens and redirects to the login page with an expiration
 * message (in browser environments). This ensures that expired or invalid
 * tokens are removed and users are prompted to re-authenticate.
 * 
 * Enhanced with comprehensive logging to track:
 * - Request URL and response status
 * - Authentication state before and after 401 handling
 * - Redirect decisions and destinations
 * 
 * Enhanced with form data preservation to prevent data loss:
 * - Attempts to extract form data from current page context
 * - Saves form data before redirecting to login
 * - Includes return URL in metadata for post-login redirect
 * 
 * @param response - The HTTP response
 * @returns The unmodified response (after handling 401 errors)
 * 
 * Requirements: 2.4, 2.6, 5.1, 5.2, 5.3, 5.5
 */
export async function authResponseInterceptor(response: Response): Promise<Response> {
  // Handle 401 Unauthorized responses
  if (response.status === 401) {
    // Don't clear tokens for auth endpoints (login, register, forgot-password, reset-password)
    // A 401 on these endpoints is expected (e.g., wrong credentials) and should NOT
    // clear an existing JWT token or trigger a redirect.
    const url = new URL(response.url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
    const isAuthEndpoint = authEndpoints.some(ep => url.pathname.endsWith(ep));
    
    if (isAuthEndpoint) {
      console.log(`[AuthInterceptor] 401 on auth endpoint ${url.pathname} — not clearing token`);
      return response;
    }
    
    // For protected endpoints, clear token and redirect
    // Capture auth state BEFORE clearing tokens
    const hadToken = tokenManager.hasToken('auth-interceptor');
    const authStateBefore = createAuthState(
      hadToken,
      null,
      null
    );
    
    // Log the authentication failure with context
    logAuthFailure(
      response.url,
      response.status,
      authStateBefore,
      false, // willRetry - currently we don't retry
      {
        requestMethod: 'unknown', // Response object doesn't include request method
        hadTokenBeforeClearing: hadToken,
      }
    );
    
    // Attempt to preserve form data BEFORE clearing tokens and redirecting
    if (typeof window !== 'undefined') {
      const extractedData = extractFormDataFromPage();
      
      if (extractedData) {
        try {
          saveFormData(
            extractedData.formType,
            extractedData.formData,
            {
              returnUrl: window.location.pathname,
            }
          );
        } catch (error) {
          // Log but don't fail - form preservation is best-effort
          console.warn('Failed to preserve form data in interceptor:', error);
        }
      }
    }
    
    // Clear the stored token immediately
    tokenManager.clearToken('401_unauthorized', 'auth-interceptor');
    
    // Capture auth state AFTER clearing tokens
    const authStateAfter = createAuthState(
      false,
      null,
      null
    );
    
    // Redirect to login page with expired parameter (only in browser environment)
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const redirectTo = '/login?expired=true';
      
      // Log the redirect decision
      logRedirect(
        currentPath,
        redirectTo,
        '401 Unauthorized - Token cleared',
        authStateAfter,
        {
          responseUrl: response.url,
          responseStatus: response.status,
        }
      );
      
      window.location.href = redirectTo;
    }
  }

  // Return the response unchanged (error handling happens elsewhere)
  return response;
}
