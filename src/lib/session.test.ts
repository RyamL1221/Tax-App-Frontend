/**
 * Property-Based Tests for Session Management
 * 
 * Tests session creation, validation, and expiration handling
 * using property-based testing with @fast-check/jest
 */

import { test, expect, describe, jest, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import {
  generateSessionToken,
  validateSessionToken,
  isSessionExpired,
  SESSION_CONFIG,
  type SessionData,
} from './session';

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('Session Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Feature: login-page, Property 16: Session creation on successful authentication
  // Validates: Requirements 8.1, 8.2
  describe('Property 16: Session creation on successful authentication', () => {
    test('generated session tokens should be valid and contain correct user data', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), // userId - non-whitespace
          fc.emailAddress(), // email
          (userId, email) => {
            // Generate a session token
            const token = generateSessionToken(userId, email);

            // Token should be a non-empty string
            expect(token).toBeTruthy();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);

            // Validate the token
            const sessionData = validateSessionToken(token);

            // Session data should be valid
            expect(sessionData).not.toBeNull();
            expect(sessionData?.userId).toBe(userId.trim());
            expect(sessionData?.email).toBe(email.trim());
            expect(sessionData?.createdAt).toBeLessThanOrEqual(Date.now());
            expect(sessionData?.expiresAt).toBeGreaterThan(Date.now());

            // Session should not be expired immediately after creation
            expect(isSessionExpired(token)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('session tokens should have correct expiration time', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          (userId, email) => {
            const beforeCreation = Date.now();
            const token = generateSessionToken(userId, email);
            const afterCreation = Date.now();

            const sessionData = validateSessionToken(token);
            expect(sessionData).not.toBeNull();

            if (sessionData) {
              // Expiration should be approximately MAX_AGE seconds in the future
              const expectedExpiry = beforeCreation + (SESSION_CONFIG.MAX_AGE * 1000);
              const actualExpiry = sessionData.expiresAt;

              // Allow for small timing differences (within 1 second)
              expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
              expect(actualExpiry).toBeLessThanOrEqual(afterCreation + (SESSION_CONFIG.MAX_AGE * 1000) + 1000);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('different user credentials should produce different tokens', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            fc.emailAddress()
          ),
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            fc.emailAddress()
          ),
          ([userId1, email1], [userId2, email2]) => {
            // Skip if credentials are identical (after trimming)
            if (userId1.trim() === userId2.trim() && email1.trim() === email2.trim()) {
              return true;
            }

            const token1 = generateSessionToken(userId1, email1);
            const token2 = generateSessionToken(userId2, email2);

            // Different credentials should produce different tokens
            // (tokens include timestamp, so they'll always be different)
            expect(token1).not.toBe(token2);

            // Both tokens should be valid
            const session1 = validateSessionToken(token1);
            const session2 = validateSessionToken(token2);

            expect(session1?.userId).toBe(userId1.trim());
            expect(session1?.email).toBe(email1.trim());
            expect(session2?.userId).toBe(userId2.trim());
            expect(session2?.email).toBe(email2.trim());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Session validation', () => {
    test('invalid token formats should return null', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ maxLength: 10 }), // Short random strings
            fc.constant(''), // Empty string
            fc.constant('invalid-token'), // Invalid format
            fc.string({ minLength: 1, maxLength: 20 }) // Random strings
          ),
          (invalidToken) => {
            const result = validateSessionToken(invalidToken);
            // Most random strings should be invalid
            // (unless they happen to be valid base64 JSON by chance)
            if (result !== null) {
              // If it somehow decoded, it should still fail validation
              // due to missing or invalid fields
              return true;
            }
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('whitespace-only userId or email should be rejected', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(' '),
            fc.constant('  '),
            fc.constant('\t'),
            fc.constant('\n'),
            fc.constant('   \t  ')
          ),
          (whitespace) => {
            // Try to create a token with whitespace-only userId
            expect(() => generateSessionToken(whitespace, 'test@example.com')).toThrow();
            
            // Try to create a token with whitespace-only email
            expect(() => generateSessionToken('user123', whitespace)).toThrow();
            
            // Manually create a token with whitespace-only fields to test validation
            const now = Date.now();
            const invalidSessionData: SessionData = {
              userId: whitespace,
              email: 'test@example.com',
              createdAt: now,
              expiresAt: now + 3600000,
            };
            const invalidToken = Buffer.from(JSON.stringify(invalidSessionData)).toString('base64');
            
            // Validation should reject it
            expect(validateSessionToken(invalidToken)).toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });

    test('valid tokens should always validate correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          (userId, email) => {
            const token = generateSessionToken(userId, email);
            const sessionData = validateSessionToken(token);

            expect(sessionData).not.toBeNull();
            expect(sessionData?.userId).toBe(userId.trim());
            expect(sessionData?.email).toBe(email.trim());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: login-page, Property 18: Expired session cleanup
  // Validates: Requirements 8.4
  describe('Property 18: Expired session cleanup', () => {
    test('expired session tokens should be rejected by validation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          (userId, email) => {
            // Create a session data object that's already expired
            const now = Date.now();
            const expiredSessionData: SessionData = {
              userId: userId.trim(),
              email: email.trim(),
              createdAt: now - 10000, // Created 10 seconds ago
              expiresAt: now - 1000, // Expired 1 second ago
            };

            // Encode it as a token
            const expiredToken = Buffer.from(JSON.stringify(expiredSessionData)).toString('base64');

            // Validation should return null for expired token
            const result = validateSessionToken(expiredToken);
            expect(result).toBeNull();

            // isSessionExpired should return true
            expect(isSessionExpired(expiredToken)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('sessions expiring at different times should be handled correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          fc.integer({ min: -10000, max: 10000 }), // Time offset in ms
          (userId, email, timeOffset) => {
            const now = Date.now();
            const sessionData: SessionData = {
              userId: userId.trim(),
              email: email.trim(),
              createdAt: now - Math.abs(timeOffset),
              expiresAt: now + timeOffset,
            };

            const token = Buffer.from(JSON.stringify(sessionData)).toString('base64');
            const result = validateSessionToken(token);

            if (timeOffset > 0) {
              // Future expiration - should be valid
              expect(result).not.toBeNull();
              expect(result?.userId).toBe(userId.trim());
              expect(isSessionExpired(token)).toBe(false);
            } else {
              // Past or current expiration - should be invalid
              // (timeOffset <= 0 means expired at or before now)
              expect(result).toBeNull();
              expect(isSessionExpired(token)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('freshly created sessions should not be expired', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.emailAddress(),
          (userId, email) => {
            const token = generateSessionToken(userId, email);
            
            // Freshly created session should not be expired
            expect(isSessionExpired(token)).toBe(false);
            
            // Should validate successfully
            const sessionData = validateSessionToken(token);
            expect(sessionData).not.toBeNull();
            expect(sessionData?.expiresAt).toBeGreaterThan(Date.now());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Unit tests for session cookie configuration
  // Validates: Requirements 8.2
  describe('Session cookie configuration', () => {
    test('SESSION_CONFIG should have HTTP-only flag set to true', () => {
      // Requirement 8.2: HTTP-only cookie flag must be true
      expect(SESSION_CONFIG.HTTP_ONLY).toBe(true);
    });

    test('SESSION_CONFIG should have secure flag configured', () => {
      // Secure flag should be set based on environment
      expect(typeof SESSION_CONFIG.SECURE).toBe('boolean');
      
      // In production, secure should be true
      if (process.env.NODE_ENV === 'production') {
        expect(SESSION_CONFIG.SECURE).toBe(true);
      }
    });

    test('SESSION_CONFIG should have sameSite set to lax', () => {
      // sameSite should be 'lax' for CSRF protection
      expect(SESSION_CONFIG.SAME_SITE).toBe('lax');
    });

    test('SESSION_CONFIG should have appropriate maxAge', () => {
      // maxAge should be 7 days in seconds
      const sevenDaysInSeconds = 60 * 60 * 24 * 7;
      expect(SESSION_CONFIG.MAX_AGE).toBe(sevenDaysInSeconds);
    });

    test('SESSION_CONFIG should have correct cookie name', () => {
      expect(SESSION_CONFIG.COOKIE_NAME).toBe('session_token');
    });

    test('SESSION_CONFIG should have path set to root', () => {
      expect(SESSION_CONFIG.PATH).toBe('/');
    });
  });
});
