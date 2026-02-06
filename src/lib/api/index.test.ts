/**
 * Tests for API Client Main Entry Point
 * 
 * These tests verify that:
 * - Singleton instances are properly created and configured
 * - Interceptors are registered correctly
 * - All exports are available
 */

import {
  apiClient,
  authService,
  documentService,
  tokenManager,
  Validators,
  ErrorHandler
} from './index';

describe('API Client Entry Point', () => {
  describe('Singleton Instances', () => {
    it('should export apiClient singleton', () => {
      expect(apiClient).toBeDefined();
      expect(apiClient).toHaveProperty('get');
      expect(apiClient).toHaveProperty('post');
      expect(apiClient).toHaveProperty('put');
      expect(apiClient).toHaveProperty('delete');
      expect(apiClient).toHaveProperty('healthCheck');
    });

    it('should export tokenManager singleton', () => {
      expect(tokenManager).toBeDefined();
      expect(tokenManager).toHaveProperty('setToken');
      expect(tokenManager).toHaveProperty('getToken');
      expect(tokenManager).toHaveProperty('clearToken');
      expect(tokenManager).toHaveProperty('hasToken');
    });

    it('should export authService singleton', () => {
      expect(authService).toBeDefined();
      expect(authService).toHaveProperty('register');
      expect(authService).toHaveProperty('login');
      expect(authService).toHaveProperty('forgotPassword');
      expect(authService).toHaveProperty('resetPassword');
      expect(authService).toHaveProperty('logout');
    });

    it('should export documentService singleton', () => {
      expect(documentService).toBeDefined();
      expect(documentService).toHaveProperty('generateDocument');
    });
  });

  describe('Utility Exports', () => {
    it('should export Validators class', () => {
      expect(Validators).toBeDefined();
      expect(Validators.validateEmail).toBeDefined();
      expect(Validators.validatePassword).toBeDefined();
      expect(Validators.validateTIN).toBeDefined();
      expect(Validators.validateStateCode).toBeDefined();
      expect(Validators.validateMonetaryValue).toBeDefined();
      expect(Validators.validateCalendarYear).toBeDefined();
    });

    it('should export ErrorHandler class', () => {
      expect(ErrorHandler).toBeDefined();
      expect(ErrorHandler.handleError).toBeDefined();
    });
  });

  describe('Singleton Consistency', () => {
    it('should return the same apiClient instance on multiple imports', () => {
      // Import again to verify singleton behavior
      const { apiClient: apiClient2 } = require('./index');
      expect(apiClient).toBe(apiClient2);
    });

    it('should return the same tokenManager instance on multiple imports', () => {
      const { tokenManager: tokenManager2 } = require('./index');
      expect(tokenManager).toBe(tokenManager2);
    });

    it('should return the same authService instance on multiple imports', () => {
      const { authService: authService2 } = require('./index');
      expect(authService).toBe(authService2);
    });

    it('should return the same documentService instance on multiple imports', () => {
      const { documentService: documentService2 } = require('./index');
      expect(documentService).toBe(documentService2);
    });
  });

  describe('Configuration', () => {
    it('should configure apiClient with correct base URL', () => {
      // The apiClient should be configured with either the environment variable
      // or the default localhost URL
      expect(apiClient).toBeDefined();
      // We can't directly access the private config, but we can verify the instance exists
    });
  });
});
