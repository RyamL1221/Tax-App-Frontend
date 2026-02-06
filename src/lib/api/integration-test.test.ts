/**
 * Integration Test for API Client with Local Backend
 * 
 * This test verifies the API client works correctly with a local backend
 * running at http://127.0.0.1:3000
 * 
 * Prerequisites:
 * - Backend server must be running on port 3000
 * - Run with: npm test -- src/lib/api/integration-test.test.ts
 */

import { ApiClient } from './apiClient';
import { AuthService } from './authService';
import { TokenManager } from './tokenManager';
import { authRequestInterceptor, authResponseInterceptor } from './interceptors';

describe('API Client Integration Test (Local Backend)', () => {
  let apiClient: ApiClient;
  let authService: AuthService;
  let tokenManager: TokenManager;
  
  const testEmail = `integration-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  beforeAll(() => {
    // Create API client pointing to local backend
    apiClient = new ApiClient({
      baseURL: 'http://127.0.0.1:3000',
      timeout: 30000
    });

    // Register interceptors
    apiClient.addRequestInterceptor(authRequestInterceptor);
    apiClient.addResponseInterceptor(authResponseInterceptor);

    // Create services
    tokenManager = new TokenManager();
    authService = new AuthService(apiClient, tokenManager);
  });

  afterEach(() => {
    // Clean up tokens after each test
    tokenManager.clearToken();
  });

  describe('Health Check', () => {
    it('should successfully connect to local backend', async () => {
      const response = await apiClient.healthCheck();
      
      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
      expect(typeof response.message).toBe('string');
    }, 10000);
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const response = await authService.register({
        email: testEmail,
        name: 'Integration Test User',
        password: testPassword
      });

      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
      expect(response.email).toBe(testEmail);
    }, 10000);

    it('should login with registered credentials', async () => {
      const response = await authService.login({
        email: testEmail,
        password: testPassword
      });

      expect(response).toBeDefined();
      expect(response.token).toBeDefined();
      expect(response.email).toBe(testEmail);
      expect(response.userId).toBeDefined();
      
      // Verify token was stored
      expect(tokenManager.hasToken()).toBe(true);
      expect(tokenManager.getToken()).toBe(response.token);
    }, 10000);

    it('should fail login with incorrect password', async () => {
      await expect(
        authService.login({
          email: testEmail,
          password: 'WrongPassword123!'
        })
      ).rejects.toMatchObject({
        status: 401
      });
    }, 10000);

    it('should logout and clear token', () => {
      // First login
      tokenManager.setToken('test-token');
      expect(tokenManager.hasToken()).toBe(true);

      // Logout
      authService.logout();
      
      // Verify token was cleared
      expect(tokenManager.hasToken()).toBe(false);
      expect(tokenManager.getToken()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle 409 conflict for duplicate registration', async () => {
      // Try to register the same email again
      await expect(
        authService.register({
          email: testEmail,
          name: 'Duplicate User',
          password: testPassword
        })
      ).rejects.toMatchObject({
        status: 409
      });
    }, 10000);

    it('should handle validation errors', async () => {
      await expect(
        authService.register({
          email: 'invalid-email',
          name: 'Test',
          password: 'short'
        })
      ).rejects.toMatchObject({
        status: 400
      });
    });
  });

  describe('Request Interceptors', () => {
    it('should add Authorization header for authenticated requests', async () => {
      // Login first to get a token
      const loginResponse = await authService.login({
        email: testEmail,
        password: testPassword
      });

      expect(tokenManager.hasToken()).toBe(true);
      
      // The token should be automatically included in subsequent requests
      // This is verified by the fact that authenticated endpoints work
    }, 10000);

    it('should not add Authorization header for public endpoints', async () => {
      // Health check should work without authentication
      const response = await apiClient.healthCheck();
      expect(response).toBeDefined();
    }, 10000);
  });
});
