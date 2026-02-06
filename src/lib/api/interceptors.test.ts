/**
 * Unit tests for request and response interceptors
 * 
 * Tests the authentication request interceptor and response interceptor
 * to ensure proper token injection and 401 error handling.
 */

import { authRequestInterceptor, authResponseInterceptor } from './interceptors';
import { RequestConfig } from './types';
import { tokenManager } from './tokenManager';

// Mock Response for tests
global.Response = class Response {
  status: number;
  body: any;
  headers: Map<string, string>;

  constructor(body: any, init?: { status?: number; headers?: Record<string, string> }) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
} as any;

describe('authRequestInterceptor', () => {
  beforeEach(() => {
    // Clear any stored tokens before each test
    tokenManager.clearToken();
  });

  it('should add Authorization header when token exists', () => {
    // Arrange
    const token = 'test-jwt-token-123';
    tokenManager.setToken(token);
    
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
      'Authorization': `Bearer ${token}`
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
    const token = 'test-jwt-token-123';
    tokenManager.setToken(token);
    
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
    const token = 'test-jwt-token-123';
    tokenManager.setToken(token);
    
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
      'Authorization': `Bearer ${token}`
    });
  });

  it('should handle config with no headers', () => {
    // Arrange
    const token = 'test-jwt-token-123';
    tokenManager.setToken(token);
    
    const config: RequestConfig = {
      method: 'GET',
      url: '/api/test'
    };

    // Act
    const result = authRequestInterceptor(config);

    // Assert
    expect(result.headers).toEqual({
      'Authorization': `Bearer ${token}`
    });
  });
});

describe('authResponseInterceptor', () => {
  beforeEach(() => {
    // Clear any stored tokens before each test
    tokenManager.clearToken();
  });

  it('should clear token on 401 response', async () => {
    // Arrange
    tokenManager.setToken('test-token');
    const response = new Response(null, { status: 401 });

    // Act
    // Note: This will attempt to redirect in the browser, but we're testing token clearing
    await authResponseInterceptor(response);

    // Assert
    expect(tokenManager.getToken()).toBeNull();
  });

  it('should not clear token on 200 response', async () => {
    // Arrange
    tokenManager.setToken('test-token');
    const response = new Response(JSON.stringify({ data: 'success' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

    // Act
    await authResponseInterceptor(response);

    // Assert
    expect(tokenManager.getToken()).toBe('test-token');
  });

  it('should not clear token on 400 response', async () => {
    // Arrange
    tokenManager.setToken('test-token');
    const response = new Response(JSON.stringify({ error: 'Bad request' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

    // Act
    await authResponseInterceptor(response);

    // Assert
    expect(tokenManager.getToken()).toBe('test-token');
  });

  it('should not clear token on 500 response', async () => {
    // Arrange
    tokenManager.setToken('test-token');
    const response = new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });

    // Act
    await authResponseInterceptor(response);

    // Assert
    expect(tokenManager.getToken()).toBe('test-token');
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
});
