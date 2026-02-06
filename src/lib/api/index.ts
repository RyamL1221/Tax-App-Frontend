/**
 * Frontend API Client - Main Entry Point
 * 
 * This module provides a centralized, type-safe interface for communicating
 * with the Tax App Backend API. It exports singleton instances of all services
 * with pre-configured interceptors for authentication and error handling.
 * 
 * Usage:
 * ```typescript
 * import { authService, documentService, apiClient } from '@/lib/api';
 * 
 * // Login
 * const response = await authService.login({ email, password });
 * 
 * // Generate document
 * const result = await documentService.generateDocument({
 *   documentType: '1099-DIV',
 *   formData: { ... }
 * });
 * 
 * // Health check
 * const health = await apiClient.healthCheck();
 * ```
 * 
 * Requirements: 1.1, 1.2
 */

// ============================================================================
// Core Components
// ============================================================================

import { ApiClient } from './apiClient';
import { TokenManager } from './tokenManager';
import { AuthService } from './authService';
import { DocumentService } from './documentService';
import { authRequestInterceptor, authResponseInterceptor } from './interceptors';

// ============================================================================
// Singleton Instances
// ============================================================================

/**
 * Singleton TokenManager instance for JWT token storage and retrieval
 * 
 * This instance is shared across all services to ensure consistent
 * token management throughout the application.
 */
export const tokenManager = new TokenManager();

/**
 * Singleton ApiClient instance with default configuration
 * 
 * Configuration:
 * - baseURL: http://localhost:3000 (development)
 * - timeout: 30000ms (30 seconds)
 * - CORS mode: 'cors' with credentials
 * - Content-Type: 'application/json'
 * 
 * Interceptors:
 * - Request: Automatically adds JWT token to Authorization header
 * - Response: Handles 401 errors by clearing tokens and redirecting to login
 */
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 30000
});

// Register request interceptor for automatic JWT token injection
apiClient.addRequestInterceptor(authRequestInterceptor);

// Register response interceptor for automatic 401 handling
apiClient.addResponseInterceptor(authResponseInterceptor);

/**
 * Singleton AuthService instance for authentication operations
 * 
 * Provides methods for:
 * - User registration
 * - User login with automatic token storage
 * - Password reset flow (forgot password and reset password)
 * - Logout with automatic token clearing
 */
export const authService = new AuthService(apiClient, tokenManager);

/**
 * Singleton DocumentService instance for document generation
 * 
 * Provides methods for:
 * - 1099-DIV form generation with comprehensive validation
 * - Future document types (1099-INT, W-2, etc.)
 */
export const documentService = new DocumentService(apiClient);

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Authentication types
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  
  // Document generation types
  Form1099DivData,
  GenerateDocumentRequest,
  GenerateDocumentResponse,
  
  // Error types
  ApiError,
  ValidationError,
  
  // Configuration types
  ApiClientConfig,
  RequestConfig,
  
  // Health check types
  HealthCheckResponse
} from './types';

// ============================================================================
// Validator Exports
// ============================================================================

export { Validators } from './validators';
export type { ValidationResult } from './validators';

// ============================================================================
// Error Handler Exports
// ============================================================================

export { ErrorHandler } from './errorHandler';
