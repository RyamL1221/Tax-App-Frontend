/**
 * Tests for validation utilities
 * Includes both property-based tests and unit tests
 */

import { describe, test, expect } from '@jest/globals';
import * as fc from 'fast-check';
import {
  validateEmail,
  validatePassword,
  mapValidationError,
  validationErrorMessages,
  loginSchema,
} from './validation';

describe('Email Validation', () => {
  // Feature: login-page, Property 4: Email validation provides appropriate feedback
  test('property: valid emails are accepted', () => {
    // Custom email generator that produces emails matching Zod's validation pattern
    // Zod uses a stricter pattern than RFC 5322, so we generate simpler emails
    const zodCompliantEmailArbitrary = fc.tuple(
      fc.stringMatching(/^[a-zA-Z0-9]+([._+-][a-zA-Z0-9]+)*$/), // local part: alphanumeric, can have . _ + - in middle
      fc.stringMatching(/^[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*$/), // domain: alphanumeric, can have . - in middle
      fc.constantFrom('com', 'org', 'net', 'edu', 'io') // TLD
    ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

    fc.assert(
      fc.property(zodCompliantEmailArbitrary, (email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  // Feature: login-page, Property 4: Email validation provides appropriate feedback
  test('property: invalid email formats are rejected with error message', () => {
    const invalidEmailArbitrary = fc.oneof(
      fc.string().filter(s => !s.includes('@')), // No @ symbol
      fc.string().map(s => `${s}@`), // Missing domain
      fc.string().map(s => `@${s}`), // Missing local part
      fc.constant(''), // Empty string
      fc.constant('not-an-email'), // Plain text
      fc.constant('missing@domain'), // Missing TLD
    );

    fc.assert(
      fc.property(invalidEmailArbitrary, (email) => {
        const result = validateEmail(email);
        if (email === '') {
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Email is required');
        } else {
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('Password Validation', () => {
  // Feature: login-page, Property 5: Password length validation
  test('property: passwords shorter than 8 characters are rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 7 }),
        (password) => {
          const result = validatePassword(password);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Password must be at least 8 characters');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: login-page, Property 5: Password length validation
  test('property: passwords with 8 or more characters are accepted', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 8, maxLength: 100 }),
        (password) => {
          const result = validatePassword(password);
          expect(result.isValid).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: login-page, Property 5: Password length validation
  test('property: passwords longer than 100 characters are rejected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 101, maxLength: 200 }),
        (password) => {
          const result = validatePassword(password);
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('Password is too long');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Validation Edge Cases', () => {
  test('empty email field returns required error', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  test('empty password field returns required error', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters');
  });

  test('various invalid email formats are rejected', () => {
    const invalidEmails = [
      'plaintext',
      '@example.com',
      'user@',
      'user @example.com',
      'user@example',
      'user..name@example.com',
      'user@.com',
    ];

    invalidEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  test('valid email formats are accepted', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user123@test-domain.com',
    ];

    validEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});

describe('Error Message Mapping', () => {
  test('maps email required error', () => {
    const message = mapValidationError('email', 'String must contain at least 1 character(s)');
    expect(message).toBe(validationErrorMessages.email.required);
  });

  test('maps email invalid format error', () => {
    const message = mapValidationError('email', 'Invalid email');
    expect(message).toBe(validationErrorMessages.email.invalid);
  });

  test('maps password required error', () => {
    const message = mapValidationError('password', 'String must contain at least 1 character(s)');
    expect(message).toBe(validationErrorMessages.password.required);
  });

  test('maps password min length error', () => {
    const message = mapValidationError('password', 'String must contain at least 8 character(s)');
    expect(message).toBe(validationErrorMessages.password.minLength);
  });

  test('maps password max length error', () => {
    const message = mapValidationError('password', 'String is too long');
    expect(message).toBe(validationErrorMessages.password.maxLength);
  });

  test('returns original message for unmapped errors', () => {
    const originalMessage = 'Some unknown error';
    const message = mapValidationError('email', originalMessage);
    expect(message).toBe(originalMessage);
  });
});

describe('Login Schema', () => {
  test('validates complete login form data', () => {
    const validData = {
      email: 'user@example.com',
      password: 'password123',
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects invalid login form data', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'short',
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
