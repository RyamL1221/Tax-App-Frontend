import { ApiClient } from '../apiClient';
import { HealthCheckResponse } from '../types';
import * as tokenManager from '../tokenManager';

// Mock fetch globally
global.fetch = jest.fn();

// Mock tokenManager
jest.mock('./tokenManager');

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient({
      baseURL: 'http://localhost:3000',
      timeout: 30000
    });
    jest.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('should make GET request to /hello endpoint', async () => {
      const mockResponse: HealthCheckResponse = {
        message: 'Hello from Tax App Backend!'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await apiClient.healthCheck();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/hello',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          mode: 'cors'
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should not include Authorization header (requiresAuth: false)', async () => {
      const mockResponse: HealthCheckResponse = {
        message: 'Hello from Tax App Backend!'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      await apiClient.healthCheck();

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;
      
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should return status message from backend', async () => {
      const mockResponse: HealthCheckResponse = {
        message: 'Backend is healthy'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await apiClient.healthCheck();

      expect(result.message).toBe('Backend is healthy');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(apiClient.healthCheck()).rejects.toMatchObject({
        status: 0,
        message: 'Unable to connect. Please check your internet connection.'
      });
    });

    it('should handle timeout errors', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

      await expect(apiClient.healthCheck()).rejects.toMatchObject({
        status: 0,
        message: 'Request timeout. Please try again.'
      });
    });

    it('should handle 500 server errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' })
      });

      await expect(apiClient.healthCheck()).rejects.toMatchObject({
        status: 500,
        message: 'An unexpected error occurred. Please try again.'
      });
    });
  });

  describe('Request Interceptor - Token Injection', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should add Authorization header when token exists', async () => {
      const mockToken = 'test-jwt-token-123';
      (tokenManager.getToken as jest.Mock).mockReturnValue(mockToken);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'success' })
      });

      await apiClient.get('/test-endpoint');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;
      
      expect(headers['Authorization']).toBe(`Bearer ${mockToken}`);
    });

    it('should trim whitespace from token before adding to header', async () => {
      const mockToken = '  test-jwt-token-with-spaces  ';
      (tokenManager.getToken as jest.Mock).mockReturnValue(mockToken);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'success' })
      });

      await apiClient.post('/test-endpoint', { data: 'test' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;
      
      expect(headers['Authorization']).toBe('Bearer test-jwt-token-with-spaces');
      expect(headers['Authorization']).not.toContain('  ');
    });

    it('should not add Authorization header when no token exists', async () => {
      (tokenManager.getToken as jest.Mock).mockReturnValue(null);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'success' })
      });

      await apiClient.get('/test-endpoint');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;
      
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should add Authorization header for POST requests with token', async () => {
      const mockToken = 'post-request-token';
      (tokenManager.getToken as jest.Mock).mockReturnValue(mockToken);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'created' })
      });

      await apiClient.post('/test-endpoint', { name: 'test' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;
      
      expect(headers['Authorization']).toBe(`Bearer ${mockToken}`);
    });

    it('should add Authorization header for PUT requests with token', async () => {
      const mockToken = 'put-request-token';
      (tokenManager.getToken as jest.Mock).mockReturnValue(mockToken);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'updated' })
      });

      await apiClient.put('/test-endpoint', { name: 'updated' });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;
      
      expect(headers['Authorization']).toBe(`Bearer ${mockToken}`);
    });

    it('should add Authorization header for DELETE requests with token', async () => {
      const mockToken = 'delete-request-token';
      (tokenManager.getToken as jest.Mock).mockReturnValue(mockToken);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'deleted' })
      });

      await apiClient.delete('/test-endpoint');

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;
      
      expect(headers['Authorization']).toBe(`Bearer ${mockToken}`);
    });

    it('should preserve existing headers when adding Authorization', async () => {
      const mockToken = 'test-token';
      (tokenManager.getToken as jest.Mock).mockReturnValue(mockToken);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'success' })
      });

      await apiClient.get('/test-endpoint', {
        headers: {
          'X-Custom-Header': 'custom-value'
        }
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;
      
      expect(headers['Authorization']).toBe(`Bearer ${mockToken}`);
      expect(headers['X-Custom-Header']).toBe('custom-value');
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});
