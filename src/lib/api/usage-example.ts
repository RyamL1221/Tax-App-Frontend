/**
 * Usage Examples for Frontend API Client
 * 
 * This file demonstrates how to use the API client in your application.
 * These examples show the recommended patterns for authentication,
 * document generation, and error handling.
 */

import {
  authService,
  documentService,
  apiClient,
  tokenManager,
  Validators,
  type LoginRequest,
  type RegisterRequest,
  type GenerateDocumentRequest,
  type ApiError
} from './index';

// ============================================================================
// Authentication Examples
// ============================================================================

/**
 * Example: User Registration
 */
export async function registerUser(email: string, name: string, password: string) {
  try {
    const request: RegisterRequest = { email, name, password };
    const response = await authService.register(request);
    console.log('Registration successful:', response.message);
    return response;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Registration failed:', apiError.message);
    if (apiError.errors) {
      apiError.errors.forEach(err => {
        console.error(`  ${err.field}: ${err.message}`);
      });
    }
    throw error;
  }
}

/**
 * Example: User Login
 */
export async function loginUser(email: string, password: string) {
  try {
    const request: LoginRequest = { email, password };
    const response = await authService.login(request);
    console.log('Login successful:', response.email);
    // Token is automatically stored by authService
    return response;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Login failed:', apiError.message);
    throw error;
  }
}

/**
 * Example: User Logout
 */
export function logoutUser() {
  authService.logout();
  console.log('Logged out successfully');
}

/**
 * Example: Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return tokenManager.hasToken();
}

// ============================================================================
// Document Generation Examples
// ============================================================================

/**
 * Example: Generate 1099-DIV Document
 */
export async function generate1099Div() {
  try {
    const request: GenerateDocumentRequest = {
      documentType: '1099-DIV',
      formData: {
        calendarYear: '2023',
        payerName: 'Acme Investment Corp',
        payerTIN: '12-3456789',
        payerAddress: '123 Wall Street',
        payerCity: 'New York',
        payerState: 'NY',
        payerZip: '10005',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        recipientAddress: '456 Main Street',
        recipientCity: 'Boston',
        recipientState: 'MA',
        recipientZip: '02101',
        totalOrdinaryDividends: '1500.00',
        qualifiedDividends: '1200.00',
        federalIncomeTaxWithheld: '150.00'
      }
    };

    const response = await documentService.generateDocument(request);
    console.log('Document generation started:', response.jobId);
    return response;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Document generation failed:', apiError.message);
    
    if (apiError.status === 401) {
      console.error('Authentication required. Please log in.');
    } else if (apiError.errors) {
      apiError.errors.forEach(err => {
        console.error(`  ${err.field}: ${err.message}`);
      });
    }
    throw error;
  }
}

// ============================================================================
// Validation Examples
// ============================================================================

/**
 * Example: Validate form data before submission
 */
export function validateFormData(email: string, password: string, tin: string, state: string) {
  const errors: string[] = [];

  // Validate email
  const emailValidation = Validators.validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push(emailValidation.error || 'Invalid email');
  }

  // Validate password
  const passwordValidation = Validators.validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.error || 'Invalid password');
  }

  // Validate TIN (try both formats)
  const einValidation = Validators.validateTIN(tin, 'EIN');
  const ssnValidation = Validators.validateTIN(tin, 'SSN');
  if (!einValidation.isValid && !ssnValidation.isValid) {
    errors.push('Invalid TIN format');
  }

  // Validate state code
  const stateValidation = Validators.validateStateCode(state);
  if (!stateValidation.isValid) {
    errors.push(stateValidation.error || 'Invalid state code');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Health Check Example
// ============================================================================

/**
 * Example: Check backend connectivity
 */
export async function checkBackendHealth() {
  try {
    const response = await apiClient.healthCheck();
    console.log('Backend is healthy:', response.message);
    return true;
  } catch (error) {
    console.error('Backend health check failed');
    return false;
  }
}

// ============================================================================
// Error Handling Example
// ============================================================================

/**
 * Example: Comprehensive error handling
 */
export async function handleApiCall<T>(apiCall: () => Promise<T>): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    const apiError = error as ApiError;

    switch (apiError.status) {
      case 400:
        console.error('Validation error:', apiError.message);
        if (apiError.errors) {
          apiError.errors.forEach(err => {
            console.error(`  ${err.field}: ${err.message}`);
          });
        }
        break;

      case 401:
        console.error('Authentication required. Redirecting to login...');
        // Token is automatically cleared by response interceptor
        break;

      case 409:
        console.error('Conflict:', apiError.message);
        break;

      case 429:
        console.error('Rate limit exceeded. Retry after:', apiError.retryAfter, 'seconds');
        break;

      case 500:
        console.error('Server error:', apiError.message);
        break;

      case 0:
        console.error('Network error. Please check your connection.');
        break;

      default:
        console.error('Unexpected error:', apiError.message);
    }

    return null;
  }
}
