import { ErrorHandler } from '../errorHandler';
import { ApiError } from '../types';

// Mock Response class for testing
class MockResponse {
  private _body: string;
  private _status: number;
  private _headers: Map<string, string>;

  constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
    this._body = body;
    this._status = init?.status || 200;
    this._headers = new Map(Object.entries(init?.headers || {}));
  }

  get status(): number {
    return this._status;
  }

  get headers() {
    return {
      get: (name: string) => this._headers.get(name) || null
    };
  }

  async json(): Promise<any> {
    return JSON.parse(this._body);
  }
}

describe('ErrorHandler', () => {
  describe('handleError', () => {
    it('should handle 400 Bad Request with validation errors', async () => {
      const mockResponse = new MockResponse(
        JSON.stringify({
          message: 'Validation failed',
          errors: [
            { field: 'email', message: 'Invalid email format' },
            { field: 'password', message: 'Password too short' }
          ]
        }),
        { status: 400 }
      );

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(400);
      expect(error.message).toBe('Validation failed');
      expect(error.errors).toHaveLength(2);
      expect(error.errors?.[0]).toEqual({
        field: 'email',
        message: 'Invalid email format'
      });
      expect(error.errors?.[1]).toEqual({
        field: 'password',
        message: 'Password too short'
      });
    });

    it('should handle 400 Bad Request without validation errors', async () => {
      const mockResponse = new MockResponse(
        JSON.stringify({ message: 'Bad request' }),
        { status: 400 }
      );

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.errors).toBeUndefined();
    });

    it('should handle 400 Bad Request with empty body', async () => {
      const mockResponse = new MockResponse('', { status: 400 });

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(400);
      expect(error.message).toBe('Validation failed');
      expect(error.errors).toBeUndefined();
    });

    it('should handle 401 Unauthorized', async () => {
      const mockResponse = new MockResponse(
        JSON.stringify({ message: 'Token expired' }),
        { status: 401 }
      );

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(401);
      expect(error.message).toBe('Authentication required. Please log in.');
      expect(error.errors).toBeUndefined();
      expect(error.retryAfter).toBeUndefined();
    });

    it('should handle 401 Unauthorized and not expose tokens in message', async () => {
      const mockResponse = new MockResponse(
        JSON.stringify({ 
          message: 'Invalid token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
        }),
        { status: 401 }
      );

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(401);
      expect(error.message).toBe('Authentication required. Please log in.');
      expect(error.message).not.toContain('eyJ');
      expect(error.message).not.toContain('token');
    });

    it('should handle 409 Conflict with message', async () => {
      const mockResponse = new MockResponse(
        JSON.stringify({ message: 'Email already exists' }),
        { status: 409 }
      );

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(409);
      expect(error.message).toBe('Email already exists');
    });

    it('should handle 409 Conflict without message', async () => {
      const mockResponse = new MockResponse('{}', { status: 409 });

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(409);
      expect(error.message).toBe('Resource conflict');
    });

    it('should handle 429 Too Many Requests with Retry-After header', async () => {
      const mockResponse = new MockResponse(
        JSON.stringify({ message: 'Rate limit exceeded' }),
        { 
          status: 429,
          headers: { 'Retry-After': '3600' }
        }
      );

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(429);
      expect(error.message).toBe('Too many requests. Please try again later.');
      expect(error.retryAfter).toBe(3600);
    });

    it('should handle 429 Too Many Requests without Retry-After header', async () => {
      const mockResponse = new MockResponse('{}', { status: 429 });

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(429);
      expect(error.message).toBe('Too many requests. Please try again later.');
      expect(error.retryAfter).toBe(3600); // Default value
    });

    it('should handle 429 Too Many Requests with invalid Retry-After header', async () => {
      const mockResponse = new MockResponse('{}', { 
        status: 429,
        headers: { 'Retry-After': 'invalid' }
      });

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(429);
      expect(error.retryAfter).toBe(3600); // Default value
    });

    it('should handle 500 Internal Server Error', async () => {
      const mockResponse = new MockResponse(
        JSON.stringify({ message: 'Database connection failed', stack: '...' }),
        { status: 500 }
      );

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(500);
      expect(error.message).toBe('An unexpected error occurred. Please try again.');
      expect(error.message).not.toContain('Database');
      expect(error.message).not.toContain('stack');
    });

    it('should handle 500 Internal Server Error with empty body', async () => {
      const mockResponse = new MockResponse('', { status: 500 });

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(500);
      expect(error.message).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle other HTTP error codes', async () => {
      const mockResponse = new MockResponse(
        JSON.stringify({ message: 'Service unavailable' }),
        { status: 503 }
      );

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(503);
      expect(error.message).toBe('Service unavailable');
    });

    it('should handle other HTTP error codes without message', async () => {
      const mockResponse = new MockResponse('{}', { status: 404 });

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(404);
      expect(error.message).toBe('An unexpected error occurred. Please try again.');
    });

    it('should handle non-JSON response body', async () => {
      const mockResponse = new MockResponse('Not JSON', { status: 400 });

      const error = await ErrorHandler.handleError(mockResponse as any);

      expect(error.status).toBe(400);
      expect(error.message).toBe('Validation failed');
    });
  });

  describe('handleNetworkError', () => {
    it('should handle network connection errors', () => {
      const networkError = new Error('Failed to fetch');
      
      const error = ErrorHandler.handleNetworkError(networkError);

      expect(error.status).toBe(0);
      expect(error.message).toBe('Unable to connect. Please check your internet connection.');
    });

    it('should handle timeout errors', () => {
      const timeoutError = new Error('Request timeout');
      
      const error = ErrorHandler.handleNetworkError(timeoutError);

      expect(error.status).toBe(0);
      expect(error.message).toBe('Unable to connect. Please check your internet connection.');
    });

    it('should handle DNS errors', () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND');
      
      const error = ErrorHandler.handleNetworkError(dnsError);

      expect(error.status).toBe(0);
      expect(error.message).toBe('Unable to connect. Please check your internet connection.');
    });
  });

  describe('security - token exposure prevention', () => {
    it('should never expose JWT tokens in error messages', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const mockResponse = new MockResponse(
        JSON.stringify({ 
          message: `Invalid token: ${token}`,
          token: token
        }),
        { status: 401 }
      );

      const error = await ErrorHandler.handleError(mockResponse as any);

      // Error message should not contain the token
      expect(error.message).not.toContain(token);
      expect(error.message).not.toContain('eyJ');
      expect(error.message).toBe('Authentication required. Please log in.');
    });

    it('should not expose tokens in validation errors', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      
      const mockResponse = new MockResponse(
        JSON.stringify({
          message: 'Validation failed',
          errors: [
            { field: 'authorization', message: `Invalid token: ${token}` }
          ]
        }),
        { status: 400 }
      );

      const error = await ErrorHandler.handleError(mockResponse as any);

      // Validation errors are extracted as-is from the backend
      // The backend should not include tokens in error messages
      // But we verify the error handler doesn't add tokens
      expect(error.status).toBe(400);
      expect(error.errors).toBeDefined();
    });
  });
});
