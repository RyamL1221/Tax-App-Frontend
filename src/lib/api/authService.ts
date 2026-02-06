/**
 * AuthService - Authentication API methods
 * 
 * This service provides type-safe methods for authentication operations including:
 * - User registration
 * - User login with token storage
 * - Password reset flow (forgot password and reset password)
 * - Logout with token clearing
 * 
 * All methods perform client-side validation before making API calls.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

import { ApiClient } from './apiClient';
import { TokenManager } from './tokenManager';
import { Validators } from './validators';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse
} from './types';

/**
 * AuthService class provides authentication-related API methods
 */
export class AuthService {
  private apiClient: ApiClient;
  private tokenManager: TokenManager;

  /**
   * Creates a new AuthService instance
   * 
   * @param apiClient - The API client instance for making HTTP requests
   * @param tokenManager - The token manager instance for storing/retrieving JWT tokens
   */
  constructor(apiClient: ApiClient, tokenManager: TokenManager) {
    this.apiClient = apiClient;
    this.tokenManager = tokenManager;
  }

  /**
   * Register a new user account
   * 
   * Validates email format and password length before making the API call.
   * Does not store the token - user must log in after registration.
   * 
   * @param data - Registration data containing email, name, and password
   * @returns Promise resolving to RegisterResponse with success message and email
   * @throws ApiError if validation fails or API request fails
   * 
   * Requirements: 3.1, 3.2
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    // Validate email format
    const emailValidation = Validators.validateEmail(data.email);
    if (!emailValidation.isValid) {
      throw {
        status: 400,
        message: emailValidation.error || 'Invalid email format'
      };
    }

    // Validate password length
    const passwordValidation = Validators.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw {
        status: 400,
        message: passwordValidation.error || 'Invalid password'
      };
    }

    // Make API request
    return this.apiClient.post<RegisterResponse>('/auth/register', data);
  }

  /**
   * Log in an existing user
   * 
   * Validates email format and password length before making the API call.
   * On success, stores the returned JWT token via TokenManager.
   * 
   * @param data - Login credentials containing email and password
   * @returns Promise resolving to LoginResponse with token, email, and userId
   * @throws ApiError if validation fails or API request fails
   * 
   * Requirements: 3.3, 3.4, 3.5
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    // Validate email format
    const emailValidation = Validators.validateEmail(data.email);
    if (!emailValidation.isValid) {
      throw {
        status: 400,
        message: emailValidation.error || 'Invalid email format'
      };
    }

    // Validate password length
    const passwordValidation = Validators.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      throw {
        status: 400,
        message: passwordValidation.error || 'Invalid password'
      };
    }

    // Make API request
    const response = await this.apiClient.post<LoginResponse>('/auth/login', data);

    // Store the JWT token
    this.tokenManager.setToken(response.token);

    return response;
  }

  /**
   * Request a password reset email
   * 
   * Validates email format before making the API call.
   * This endpoint is rate limited: 5 requests per hour.
   * 
   * @param data - Forgot password data containing email
   * @returns Promise resolving to ForgotPasswordResponse with success message
   * @throws ApiError if validation fails or API request fails (including 429 rate limit)
   * 
   * Requirements: 3.6
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    // Validate email format
    const emailValidation = Validators.validateEmail(data.email);
    if (!emailValidation.isValid) {
      throw {
        status: 400,
        message: emailValidation.error || 'Invalid email format'
      };
    }

    // Make API request
    return this.apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data);
  }

  /**
   * Reset user password with a reset token
   * 
   * Validates password length before making the API call.
   * On success, clears any existing JWT tokens to invalidate all sessions.
   * 
   * @param data - Reset password data containing token and newPassword
   * @returns Promise resolving to ResetPasswordResponse with success message
   * @throws ApiError if validation fails or API request fails
   * 
   * Requirements: 3.7, 3.8
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    // Validate password length
    const passwordValidation = Validators.validatePassword(data.newPassword);
    if (!passwordValidation.isValid) {
      throw {
        status: 400,
        message: passwordValidation.error || 'Invalid password'
      };
    }

    // Make API request
    const response = await this.apiClient.post<ResetPasswordResponse>('/auth/reset-password', data);

    // Clear existing tokens to invalidate sessions
    this.tokenManager.clearToken();

    return response;
  }

  /**
   * Log out the current user
   * 
   * Clears the stored JWT token. No API call is required since JWT tokens
   * are stateless and expire automatically after 24 hours.
   * 
   * Requirements: 3.8
   */
  logout(): void {
    this.tokenManager.clearToken();
  }
}
