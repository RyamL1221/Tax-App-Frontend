/**
 * Unit tests for API client index module
 * Tests the isApiError type guard and singleton exports
 */

import { isApiError, apiClient, tokenManager, authService, documentService } from '../index';
import type { ApiError } from '../types';

describe('API Client Index Module', () => {
  describe('isApiError type guard', () => {
    it('should return true for valid ApiError objects', () => {
      const apiError: ApiError = {
        status: 400,
        message: 'Bad request'
      };

      expect(isApiError(apiError)).toBe(true);
    });

    it('should return true for ApiError with optional fields', () => {
      const apiError: ApiError = {
        status: 400,
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Invalid email format' }
        ],
        retryAfter: 60
      };

      expect(isApiError(apiError)).toBe(true);
    });

    it('should return false for objects missing status', () => {
      const error = {
        message: 'Error message'
      };

      expect(isApiError(error)).toBe(false);
    });

    it('should return false for objects missing message', () => {
      const error = {
        status: 400
      };

      expect(isApiError(error)).toBe(false);
    });

    it('should return false for objects with wrong status type', () => {
      const error = {
        status: '400',
        message: 'Error message'
      };

      expect(isApiError(error)).toBe(false);
    });

    it('should return false for objects with wrong message type', () => {
      const error = {
        status: 400,
        message: 123
      };

      expect(isApiError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isApiError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isApiError(undefined)).toBe(false);
    });

    it('should return false for strings', () => {
      expect(isApiError('error message')).toBe(false);
    });

    it('should return false for numbers', () => {
      expect(isApiError(404)).toBe(false);
    });

    it('should return false for Error objects', () => {
      const error = new Error('Network error');
      expect(isApiError(error)).toBe(false);
    });

    it('should return false for empty objects', () => {
      expect(isApiError({})).toBe(false);
    });

    it('should handle ApiError with status 0 (network errors)', () => {
      const apiError: ApiError = {
        status: 0,
        message: 'Network error'
      };

      expect(isApiError(apiError)).toBe(true);
    });

    it('should handle ApiError with various status codes', () => {
      const statusCodes = [200, 201, 400, 401, 403, 404, 409, 429, 500, 503];

      statusCodes.forEach(status => {
        const apiError: ApiError = {
          status,
          message: `Error with status ${status}`
        };

        expect(isApiError(apiError)).toBe(true);
      });
    });
  });

  describe('Singleton exports', () => {
    it('should export apiClient instance', () => {
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
    });

    it('should export tokenManager instance', () => {
      expect(tokenManager).toBeDefined();
      expect(typeof tokenManager.setToken).toBe('function');
      expect(typeof tokenManager.getToken).toBe('function');
      expect(typeof tokenManager.clearToken).toBe('function');
      expect(typeof tokenManager.hasToken).toBe('function');
    });

    it('should export authService instance', () => {
      expect(authService).toBeDefined();
      expect(typeof authService.login).toBe('function');
      expect(typeof authService.register).toBe('function');
      expect(typeof authService.logout).toBe('function');
      expect(typeof authService.forgotPassword).toBe('function');
      expect(typeof authService.resetPassword).toBe('function');
    });

    it('should export documentService instance', () => {
      expect(documentService).toBeDefined();
      expect(typeof documentService.generateDocument).toBe('function');
    });
  });

  describe('Type guard usage in error handling', () => {
    it('should correctly narrow type in catch blocks', async () => {
      const mockError: ApiError = {
        status: 401,
        message: 'Unauthorized'
      };

      try {
        throw mockError;
      } catch (error) {
        if (isApiError(error)) {
          // TypeScript should recognize error as ApiError here
          expect(error.status).toBe(401);
          expect(error.message).toBe('Unauthorized');
        } else {
          fail('Should have been recognized as ApiError');
        }
      }
    });

    it('should handle non-ApiError in catch blocks', async () => {
      const networkError = new Error('Network failure');

      try {
        throw networkError;
      } catch (error) {
        if (isApiError(error)) {
          fail('Should not be recognized as ApiError');
        } else {
          // TypeScript should recognize this as unknown
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });
});
