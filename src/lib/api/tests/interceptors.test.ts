/**
 * Unit tests for request and response interceptors
 * 
 * Tests the authentication request interceptor and response interceptor
 * to ensure proper token injection and 401 error handling.
 * 
 * Requirements: 2.2, 2.4, 4.1, 4.2, 4.3
 */

import { authRequestInterceptor, authResponseInterceptor } from '../interceptors';
import { RequestConfig } from '../types';
import { tokenManager } from '../tokenManager';

// Valid JWT-format test token (three base64 segments separated by dots)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
const TEST_TOKEN_2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIn0.testSignatureValue123';

// Mock Response for tests
global.Response = class Response {
  status: number;
  body: any;
  headers: Map<string, string>;
  url: string;

  constructor(body: any, init?: { status?: number; headers?: Record<string, string>; url?: string }) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.url = init?.url || '';
  }
} as any;

describe('authRequestInterceptor', () => {
  beforeEach(() => {
    // Clear any stored tokens before each test
    tokenManager.clearToken();
  });

  it('should add Authorization header when token exists', () => {
    // Arrange
    tokenManager.setToken(TEST_TOKEN);
    
    const config: RequestConfig = {
      method: 'GET',
      url: '/api/test',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Act
    const result = authRequestInterceptor(config);

    // Assert
    expect(result.headers).toEqual({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKEN}`
    });
  });

  it('should not add Authorization header when no token exists', () => {
    // Arrange
    const config: RequestConfig = {
      method: 'GET',
      url: '/api/test',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Act
    const result = authRequestInterceptor(config);

    // Assert
    expect(result.headers).toEqual({
      'Content-Type': 'application/json'
    });
    expect(result.headers?.['Authorization']).toBeUndefined();
  });

  it('should skip authentication when requiresAuth is false', () => {
    // Arrange
    tokenManager.setToken(TEST_TOKEN);
    
    const config: RequestConfig = {
      method: 'GET',
      url: '/api/public',
      requiresAuth: false,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Act
    const result = authRequestInterceptor(config);

    // Assert
    expect(result.headers).toEqual({
      'Content-Type': 'application/json'
    });
    expect(result.headers?.['Authorization']).toBeUndefined();
  });

  it('should preserve existing headers when adding Authorization', () => {
    // Arrange
    tokenManager.setToken(TEST_TOKEN);
    
    const config: RequestConfig = {
      method: 'POST',
      url: '/api/test',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value'
      }
    };

    // Act
    const result = authRequestInterceptor(config);

    // Assert
    expect(result.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Custom-Header': 'custom-value',
      'Authorization': `Bearer ${TEST_TOKEN}`
    });
  });

  it('should handle config with no headers', () => {
    // Arrange
    tokenManager.setToken(TEST_TOKEN);
    
    const config: RequestConfig = {
      method: 'GET',
      url: '/api/test'
    };

    // Act
    const result = authRequestInterceptor(config);

    // Assert
    expect(result.headers).toEqual({
      'Authorization': `Bearer ${TEST_TOKEN}`
    });
  });
});

describe('authResponseInterceptor', () => {
  beforeEach(() => {
    // Clear any stored tokens before each test
    tokenManager.clearToken();
  });

  it('should clear token on 401 response from non-auth endpoint', async () => {
    // Arrange
    tokenManager.setToken(TEST_TOKEN);
    const response = new Response(null, { 
      status: 401,
      url: 'http://localhost:3000/documents/generate'
    });

    // Act
    await authResponseInterceptor(response);

    // Assert
    expect(tokenManager.getToken()).toBeNull();
  });

  it('should not clear token on 200 response', async () => {
    // Arrange
    tokenManager.setToken(TEST_TOKEN);
    const response = new Response(JSON.stringify({ data: 'success' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    // Act
    await authResponseInterceptor(response);

    // Assert
    expect(tokenManager.getToken()).toBe(TEST_TOKEN);
  });

  it('should not clear token on 400 response', async () => {
    // Arrange
    tokenManager.setToken(TEST_TOKEN);
    const response = new Response(JSON.stringify({ error: 'Bad request' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

    // Act
    await authResponseInterceptor(response);

    // Assert
    expect(tokenManager.getToken()).toBe(TEST_TOKEN);
  });

  it('should not clear token on 500 response', async () => {
    // Arrange
    tokenManager.setToken(TEST_TOKEN);
    const response = new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });

    // Act
    await authResponseInterceptor(response);

    // Assert
    expect(tokenManager.getToken()).toBe(TEST_TOKEN);
  });

  it('should return the response unchanged', async () => {
    // Arrange
    const responseBody = JSON.stringify({ data: 'test' });
    const response = new Response(responseBody, { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    // Act
    const result = await authResponseInterceptor(response);

    // Assert
    expect(result).toBe(response);
    expect(result.status).toBe(200);
  });

  it('should log authentication failure and redirect on 401 for protected endpoint', async () => {
    // Arrange
    tokenManager.setToken(TEST_TOKEN);
    const testUrl = 'https://api.example.com/protected/resource';
    const response = new Response(null, { 
      status: 401,
      url: testUrl
    });

    // Spy on console methods to verify logging
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Act
    await authResponseInterceptor(response);

    // Assert - verify token was cleared
    expect(tokenManager.getToken()).toBeNull();

    // Assert - verify logging occurred (in development mode)
    expect(consoleWarnSpy).toHaveBeenCalled();
    
    // Clean up
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('auth endpoint protection (Requirements 4.1, 4.2, 4.3)', () => {
    it('should NOT clear token on 401 from /auth/login endpoint', async () => {
      // Arrange
      tokenManager.setToken(TEST_TOKEN);
      const response = new Response(null, {
        status: 401,
        url: 'http://localhost:3000/auth/login'
      });
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await authResponseInterceptor(response);

      // Assert - token should still be present
      expect(tokenManager.getToken()).toBe(TEST_TOKEN);
      
      consoleLogSpy.mockRestore();
    });

    it('should NOT clear token on 401 from /auth/register endpoint', async () => {
      // Arrange
      tokenManager.setToken(TEST_TOKEN);
      const response = new Response(null, {
        status: 401,
        url: 'http://localhost:3000/auth/register'
      });
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await authResponseInterceptor(response);

      // Assert
      expect(tokenManager.getToken()).toBe(TEST_TOKEN);
      
      consoleLogSpy.mockRestore();
    });

    it('should NOT clear token on 401 from /auth/forgot-password endpoint', async () => {
      // Arrange
      tokenManager.setToken(TEST_TOKEN);
      const response = new Response(null, {
        status: 401,
        url: 'http://localhost:3000/auth/forgot-password'
      });
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await authResponseInterceptor(response);

      // Assert
      expect(tokenManager.getToken()).toBe(TEST_TOKEN);
      
      consoleLogSpy.mockRestore();
    });

    it('should NOT clear token on 401 from /auth/reset-password endpoint', async () => {
      // Arrange
      tokenManager.setToken(TEST_TOKEN);
      const response = new Response(null, {
        status: 401,
        url: 'http://localhost:3000/auth/reset-password'
      });
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await authResponseInterceptor(response);

      // Assert
      expect(tokenManager.getToken()).toBe(TEST_TOKEN);
      
      consoleLogSpy.mockRestore();
    });

    it('should clear token on 401 from a protected endpoint', async () => {
      // Arrange
      tokenManager.setToken(TEST_TOKEN);
      const response = new Response(null, {
        status: 401,
        url: 'http://localhost:3000/documents/generate'
      });
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await authResponseInterceptor(response);

      // Assert - token should be cleared for protected endpoints
      expect(tokenManager.getToken()).toBeNull();
      
      consoleWarnSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should return the response unchanged for auth endpoint 401s', async () => {
      // Arrange
      tokenManager.setToken(TEST_TOKEN);
      const response = new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        url: 'http://localhost:3000/auth/login'
      });
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await authResponseInterceptor(response);

      // Assert - should return the same response object
      expect(result).toBe(response);
      expect(result.status).toBe(401);
      
      consoleLogSpy.mockRestore();
    });

    it('should handle auth endpoints with full external URLs', async () => {
      // Arrange
      tokenManager.setToken(TEST_TOKEN);
      const response = new Response(null, {
        status: 401,
        url: 'https://api.example.com/auth/login'
      });
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await authResponseInterceptor(response);

      // Assert - token should still be present
      expect(tokenManager.getToken()).toBe(TEST_TOKEN);
      
      consoleLogSpy.mockRestore();
    });
  });
});
