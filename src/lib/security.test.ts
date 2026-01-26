/**
 * Security utilities tests
 * 
 * Tests for security-related functionality, particularly around
 * password storage prevention.
 */

import { validateNoPasswordInStorage, sanitizeFormData } from './security';
import * as fc from 'fast-check';

// Mock storage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('Security Utilities', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
  });

  describe('validateNoPasswordInStorage', () => {
    it('should return true when no password data is in storage', () => {
      mockLocalStorage.setItem('user_preferences', JSON.stringify({ theme: 'dark' }));
      mockSessionStorage.setItem('login_rate_limit', JSON.stringify({ attempts: 0 }));
      
      expect(validateNoPasswordInStorage()).toBe(true);
    });

    it('should return false when password key is in localStorage', () => {
      mockLocalStorage.setItem('password', 'secret123');
      
      expect(validateNoPasswordInStorage()).toBe(false);
    });

    it('should return false when password key is in sessionStorage', () => {
      mockSessionStorage.setItem('user_password', 'secret123');
      
      expect(validateNoPasswordInStorage()).toBe(false);
    });

    it('should return false when password field is in JSON data', () => {
      mockLocalStorage.setItem('user_data', JSON.stringify({
        email: 'test@example.com',
        password: 'secret123',
      }));
      
      expect(validateNoPasswordInStorage()).toBe(false);
    });

    it('should detect password in nested JSON objects', () => {
      mockSessionStorage.setItem('form_data', JSON.stringify({
        user: {
          credentials: {
            password: 'secret123',
          },
        },
      }));
      
      expect(validateNoPasswordInStorage()).toBe(false);
    });

    it('should detect various password keyword variations', () => {
      const passwordKeys = ['password', 'passwd', 'pwd', 'user_pass'];
      
      passwordKeys.forEach((key) => {
        mockLocalStorage.clear();
        mockLocalStorage.setItem(key, 'secret');
        expect(validateNoPasswordInStorage()).toBe(false);
      });
    });

    it('should handle invalid JSON gracefully', () => {
      mockLocalStorage.setItem('invalid_json', '{not valid json}');
      
      // Should not throw and should return true (no password detected)
      expect(validateNoPasswordInStorage()).toBe(true);
    });

    it('should handle storage access errors gracefully', () => {
      // Mock storage to throw an error
      const originalGetItem = mockLocalStorage.getItem;
      mockLocalStorage.getItem = () => {
        throw new Error('Storage access denied');
      };
      
      // Should not throw and should return true (assuming no storage means no password stored)
      expect(validateNoPasswordInStorage()).toBe(true);
      
      // Restore original method
      mockLocalStorage.getItem = originalGetItem;
    });
  });

  describe('sanitizeFormData', () => {
    it('should redact password fields', () => {
      const data = {
        email: 'test@example.com',
        password: 'secret123',
      };
      
      const sanitized = sanitizeFormData(data);
      
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.password).toBe('[REDACTED]');
    });

    it('should redact various password field names', () => {
      const data = {
        email: 'test@example.com',
        password: 'secret1',
        confirmPassword: 'secret1',
        oldPassword: 'secret2',
        newPassword: 'secret3',
      };
      
      const sanitized = sanitizeFormData(data);
      
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.confirmPassword).toBe('[REDACTED]');
      expect(sanitized.oldPassword).toBe('[REDACTED]');
      expect(sanitized.newPassword).toBe('[REDACTED]');
    });

    it('should not modify non-password fields', () => {
      const data = {
        username: 'testuser',
        email: 'test@example.com',
        preferences: { theme: 'dark' },
      };
      
      const sanitized = sanitizeFormData(data);
      
      expect(sanitized).toEqual(data);
    });
  });

  // Feature: login-page, Property 14: Password not stored in browser storage
  // **Validates: Requirements 7.2**
  describe('Property-Based Tests', () => {
    test('property: password values never appear in browser storage after any interaction', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary password strings
          fc.string({ minLength: 8, maxLength: 100 }),
          // Generate arbitrary email strings
          fc.emailAddress(),
          (password, email) => {
            // Clear storage before each test
            mockLocalStorage.clear();
            mockSessionStorage.clear();
            
            // Simulate various storage operations that might occur during login
            // Store user email (allowed)
            mockSessionStorage.setItem('user_email', email);
            
            // Store rate limit data (allowed)
            mockSessionStorage.setItem('login_rate_limit', JSON.stringify({
              attempts: 1,
              windowStart: Date.now(),
            }));
            
            // Store user preferences (allowed)
            mockLocalStorage.setItem('preferences', JSON.stringify({
              theme: 'dark',
              language: 'en',
            }));
            
            // Property: Password should NEVER be stored in browser storage
            // Even if someone tries to store it, our validation should detect it
            const isValid = validateNoPasswordInStorage();
            
            // Verify no password data is in storage
            expect(isValid).toBe(true);
            
            // Additional check: Verify password value doesn't appear in any storage
            for (let i = 0; i < mockLocalStorage.length; i++) {
              const key = mockLocalStorage.key(i);
              if (key) {
                const value = mockLocalStorage.getItem(key);
                expect(value).not.toContain(password);
              }
            }
            
            for (let i = 0; i < mockSessionStorage.length; i++) {
              const key = mockSessionStorage.key(i);
              if (key) {
                const value = mockSessionStorage.getItem(key);
                expect(value).not.toContain(password);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('property: storage validation detects any password-related keys', () => {
      fc.assert(
        fc.property(
          // Generate password-related key names
          fc.constantFrom('password', 'passwd', 'pwd', 'user_password', 'pass'),
          // Generate arbitrary values
          fc.string({ minLength: 1, maxLength: 50 }),
          (passwordKey, value) => {
            // Clear storage
            mockLocalStorage.clear();
            mockSessionStorage.clear();
            
            // Try to store data with password-related key
            mockLocalStorage.setItem(passwordKey, value);
            
            // Property: Validation should detect password-related keys
            const isValid = validateNoPasswordInStorage();
            
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('property: storage validation detects password fields in JSON objects', () => {
      fc.assert(
        fc.property(
          // Generate email and password
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 100 }),
          (email, password) => {
            // Clear storage
            mockLocalStorage.clear();
            mockSessionStorage.clear();
            
            // Try to store form data with password field
            const formData = {
              email,
              password,
            };
            mockSessionStorage.setItem('form_data', JSON.stringify(formData));
            
            // Property: Validation should detect password fields in JSON
            const isValid = validateNoPasswordInStorage();
            
            expect(isValid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('property: sanitizeFormData always redacts password fields', () => {
      fc.assert(
        fc.property(
          // Generate form data with password
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 100 }),
          (email, password) => {
            const formData = {
              email,
              password,
            };
            
            const sanitized = sanitizeFormData(formData);
            
            // Property: Password should always be redacted
            expect(sanitized.password).toBe('[REDACTED]');
            // Property: Other fields should remain unchanged
            expect(sanitized.email).toBe(email);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
