import { ApiClient } from './apiClient';
import { HealthCheckResponse } from './types';

// Mock fetch globally
global.fetch = jest.fn();

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
          mode: 'cors',
          credentials: 'include'
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
});
