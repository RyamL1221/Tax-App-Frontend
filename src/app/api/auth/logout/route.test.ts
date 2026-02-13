/**
 * Unit tests for logout API route handler
 * 
 * Tests the logout endpoint functionality including:
 * - Successful logout with 200 response
 * - Error handling with 500 response
 * - Method validation (405 for GET)
 * - Session clearing behavior
 * 
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST, GET } from './route';
import * as session from '@/lib/session';

// Mock the session module
jest.mock('@/lib/session', () => ({
  clearSession: jest.fn(),
}));

// Mock AuthLogger
jest.mock('@/lib/auth/AuthLogger', () => ({
  logAuthEvent: jest.fn(),
  createAuthState: jest.fn((hasSession, hasJWT, userId, email) => ({
    hasSession,
    hasJWT,
    isAuthenticated: hasSession && hasJWT,
    userId,
    email,
  })),
}));

describe('Logout API Route Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/logout', () => {
    it('should return 200 with success response on successful logout', async () => {
      // Mock clearSession to succeed
      (session.clearSession as jest.Mock).mockResolvedValue(undefined);

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      // Call the POST handler
      const response = await POST(request);
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
      });

      // Verify clearSession was called
      expect(session.clearSession).toHaveBeenCalledTimes(1);
    });

    it('should return 500 with error response on failure', async () => {
      // Mock clearSession to throw an error
      const error = new Error('Session clearing failed');
      (session.clearSession as jest.Mock).mockRejectedValue(error);

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      // Call the POST handler
      const response = await POST(request);
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: {
          type: 'server',
          message: 'Failed to log out. Please try again.',
        },
      });

      // Verify clearSession was called
      expect(session.clearSession).toHaveBeenCalledTimes(1);

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith('Logout API error:', error);
    });

    it('should call clearSession during logout', async () => {
      // Mock clearSession to succeed
      (session.clearSession as jest.Mock).mockResolvedValue(undefined);

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      // Call the POST handler
      await POST(request);

      // Verify clearSession was called exactly once
      expect(session.clearSession).toHaveBeenCalledTimes(1);
      expect(session.clearSession).toHaveBeenCalledWith();
    });

    it('should have correct response format on success', async () => {
      // Mock clearSession to succeed
      (session.clearSession as jest.Mock).mockResolvedValue(undefined);

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      // Call the POST handler
      const response = await POST(request);
      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data.error).toBeUndefined();
    });

    it('should have correct response format on error', async () => {
      // Mock clearSession to throw an error
      (session.clearSession as jest.Mock).mockRejectedValue(new Error('Test error'));

      // Create a mock request
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      // Call the POST handler
      const response = await POST(request);
      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('type');
      expect(data.error).toHaveProperty('message');
      expect(data.error.type).toBe('server');
    });
  });

  describe('GET /api/auth/logout', () => {
    it('should return 405 Method Not Allowed for GET requests', async () => {
      // Call the GET handler
      const response = await GET();
      const data = await response.json();

      // Verify response
      expect(response.status).toBe(405);
      expect(data).toEqual({
        error: 'Method not allowed',
      });
    });

    it('should not call clearSession for GET requests', async () => {
      // Call the GET handler
      await GET();

      // Verify clearSession was not called
      expect(session.clearSession).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should log errors to console', async () => {
      const error = new Error('Test error');
      (session.clearSession as jest.Mock).mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      await POST(request);

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith('Logout API error:', error);
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock clearSession to throw a non-Error object
      (session.clearSession as jest.Mock).mockRejectedValue('Unexpected error');

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      // Should still return proper error response
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
});
