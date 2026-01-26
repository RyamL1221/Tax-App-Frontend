import * as fc from 'fast-check';
import {
  validatePassword,
  calculatePasswordStrength,
  isValidEmail,
  PasswordStrength,
  PasswordValidationResult
} from './passwordValidation';

describe('passwordValidation', () => {
  describe('validatePassword', () => {
    describe('Unit Tests - Edge Cases', () => {
      it('should reject empty password', () => {
        const result = validatePassword('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters');
      });

      it('should reject password with exactly 7 characters', () => {
        const result = validatePassword('Pass1!a');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters');
      });

      it('should accept password with exactly 8 characters meeting all requirements', () => {
        const result = validatePassword('Pass1!ab');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject password with only lowercase letters', () => {
        const result = validatePassword('password');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one number');
        expect(result.errors).toContain('Password must contain at least one special character');
      });

      it('should reject password with only uppercase letters', () => {
        const result = validatePassword('PASSWORD');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
        expect(result.errors).toContain('Password must contain at least one number');
        expect(result.errors).toContain('Password must contain at least one special character');
      });

      it('should reject password with only numbers', () => {
        const result = validatePassword('12345678');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
        expect(result.errors).toContain('Password must contain at least one special character');
      });

      it('should reject password missing uppercase letter', () => {
        const result = validatePassword('password123!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).not.toContain('Password must contain at least one lowercase letter');
      });

      it('should reject password missing lowercase letter', () => {
        const result = validatePassword('PASSWORD123!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
        expect(result.errors).not.toContain('Password must contain at least one uppercase letter');
      });

      it('should reject password missing number', () => {
        const result = validatePassword('Password!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
      });

      it('should reject password missing special character', () => {
        const result = validatePassword('Password123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one special character');
      });

      it('should accept password with all requirements met', () => {
        const result = validatePassword('Password123!');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with various special characters', () => {
        const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '='];
        specialChars.forEach(char => {
          const result = validatePassword(`Pass123${char}`);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        });
      });

      it('should accept very long password meeting all requirements', () => {
        const result = validatePassword('Password123!'.repeat(10));
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      // Weak pattern tests - these should still be VALID (validation only checks requirements)
      // Strength calculation penalizes these patterns, but they're not rejected
      it('should accept password with repeated characters if it meets all requirements', () => {
        const result = validatePassword('Aaa111!!!bbb');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with sequential numbers if it meets all requirements', () => {
        const result = validatePassword('Pass1234!');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with common pattern if it meets all requirements', () => {
        const result = validatePassword('Password123!');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with all same special characters if it meets requirements', () => {
        const result = validatePassword('Pass1!!!');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      // Additional boundary tests
      it('should reject password with 7 characters even with all character types', () => {
        const result = validatePassword('Pas12!a');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters');
        expect(result.errors).toHaveLength(1);
      });

      it('should accept password with exactly 8 characters and minimal requirements', () => {
        const result = validatePassword('Aa1!aaaa');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject password with multiple missing requirements', () => {
        const result = validatePassword('pass');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
        expect(result.errors).toContain('Password must be at least 8 characters');
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
        expect(result.errors).toContain('Password must contain at least one number');
        expect(result.errors).toContain('Password must contain at least one special character');
      });

      it('should handle unicode characters in password', () => {
        const result = validatePassword('Pässw0rd!');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle emoji in password', () => {
        const result = validatePassword('Pass123!😀');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with mixed special characters', () => {
        const result = validatePassword('P@ss#w0rd$');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with spaces if it meets requirements', () => {
        const result = validatePassword('Pass 123 !');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    // Feature: register-page, Property 4: Password validation enforces all requirements
    // **Validates: Requirements 3.1, 3.2**
    describe('Property-Based Tests', () => {
      test('property: passwords meeting all requirements are valid', () => {
        fc.assert(
          fc.property(
            // Generate valid passwords with all requirements
            fc.integer({ min: 8, max: 50 }),
            fc.array(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), { minLength: 1, maxLength: 3 }),
            fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 3 }),
            fc.array(fc.constantFrom(...'0123456789'), { minLength: 1, maxLength: 3 }),
            fc.array(fc.constantFrom(...'!@#$%^&*()_+-='), { minLength: 1, maxLength: 3 }),
            (length, upperChars, lowerChars, numberChars, specialChars) => {
              // Build a password that meets all requirements
              const upper = upperChars.join('');
              const lower = lowerChars.join('');
              const number = numberChars.join('');
              const special = specialChars.join('');
              
              const parts = [upper, lower, number, special];
              // Shuffle the parts
              for (let i = parts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [parts[i], parts[j]] = [parts[j], parts[i]];
              }
              let password = parts.join('');
              // Pad to minimum length if needed
              while (password.length < length) {
                password += 'a';
              }
              password = password.slice(0, length);
              
              const result = validatePassword(password);
              // If password has all required character types and is >= 8 chars, it should be valid
              const hasUpper = /[A-Z]/.test(password);
              const hasLower = /[a-z]/.test(password);
              const hasNumber = /[0-9]/.test(password);
              const hasSpecial = /[^A-Za-z0-9]/.test(password);
              const isLongEnough = password.length >= 8;
              
              if (hasUpper && hasLower && hasNumber && hasSpecial && isLongEnough) {
                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      test('property: passwords missing any requirement are invalid', () => {
        fc.assert(
          fc.property(
            fc.oneof(
              // Too short
              fc.string({ minLength: 0, maxLength: 7 }),
              // Missing uppercase
              fc.string({ minLength: 8, maxLength: 20 }).filter(s => !/[A-Z]/.test(s)),
              // Missing lowercase
              fc.string({ minLength: 8, maxLength: 20 }).filter(s => !/[a-z]/.test(s)),
              // Missing number
              fc.string({ minLength: 8, maxLength: 20 }).filter(s => !/[0-9]/.test(s)),
              // Missing special character
              fc.string({ minLength: 8, maxLength: 20 }).filter(s => !/[^A-Za-z0-9]/.test(s))
            ),
            (password) => {
              const result = validatePassword(password);
              
              // Check if password is actually missing at least one requirement
              const hasUpper = /[A-Z]/.test(password);
              const hasLower = /[a-z]/.test(password);
              const hasNumber = /[0-9]/.test(password);
              const hasSpecial = /[^A-Za-z0-9]/.test(password);
              const isLongEnough = password.length >= 8;
              
              const meetsAllRequirements = hasUpper && hasLower && hasNumber && hasSpecial && isLongEnough;
              
              if (!meetsAllRequirements) {
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      test('property: validation errors correctly identify missing requirements', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 0, maxLength: 30 }),
            (password) => {
              const result = validatePassword(password);
              
              // Check each requirement and verify error messages match
              if (password.length < 8) {
                expect(result.errors).toContain('Password must be at least 8 characters');
              } else {
                expect(result.errors).not.toContain('Password must be at least 8 characters');
              }
              
              if (!/[A-Z]/.test(password)) {
                expect(result.errors).toContain('Password must contain at least one uppercase letter');
              } else {
                expect(result.errors).not.toContain('Password must contain at least one uppercase letter');
              }
              
              if (!/[a-z]/.test(password)) {
                expect(result.errors).toContain('Password must contain at least one lowercase letter');
              } else {
                expect(result.errors).not.toContain('Password must contain at least one lowercase letter');
              }
              
              if (!/[0-9]/.test(password)) {
                expect(result.errors).toContain('Password must contain at least one number');
              } else {
                expect(result.errors).not.toContain('Password must contain at least one number');
              }
              
              if (!/[^A-Za-z0-9]/.test(password)) {
                expect(result.errors).toContain('Password must contain at least one special character');
              } else {
                expect(result.errors).not.toContain('Password must contain at least one special character');
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('calculatePasswordStrength', () => {
    describe('Unit Tests - Edge Cases', () => {
      it('should return WEAK for empty password', () => {
        expect(calculatePasswordStrength('')).toBe(PasswordStrength.WEAK);
      });

      it('should return WEAK for very short password', () => {
        expect(calculatePasswordStrength('abc')).toBe(PasswordStrength.WEAK);
      });

      it('should return WEAK for password with only numbers', () => {
        expect(calculatePasswordStrength('12345678')).toBe(PasswordStrength.WEAK);
      });

      it('should return WEAK for password with only letters', () => {
        expect(calculatePasswordStrength('abcdefgh')).toBe(PasswordStrength.WEAK);
      });

      it('should return WEAK for password with repeated characters', () => {
        expect(calculatePasswordStrength('aaaa1111')).toBe(PasswordStrength.WEAK);
      });

      it('should return FAIR for 8-char password with some variety', () => {
        expect(calculatePasswordStrength('Pass1234')).toBe(PasswordStrength.FAIR);
      });

      it('should return GOOD for 12-char password with good variety', () => {
        expect(calculatePasswordStrength('Password1234')).toBe(PasswordStrength.GOOD);
      });

      it('should return STRONG for 16-char password with excellent variety', () => {
        expect(calculatePasswordStrength('Password1234!@#$')).toBe(PasswordStrength.STRONG);
      });

      it('should penalize repeated characters', () => {
        const withRepeats = calculatePasswordStrength('Passsword123!');
        const withoutRepeats = calculatePasswordStrength('Password123!');
        // withRepeats should be weaker or equal
        const strengthOrder = [PasswordStrength.WEAK, PasswordStrength.FAIR, PasswordStrength.GOOD, PasswordStrength.STRONG];
        expect(strengthOrder.indexOf(withRepeats)).toBeLessThanOrEqual(strengthOrder.indexOf(withoutRepeats));
      });

      it('should return STRONG for complex long password', () => {
        expect(calculatePasswordStrength('MyV3ry$ecur3P@ssw0rd!')).toBe(PasswordStrength.STRONG);
      });
    });

    // Feature: register-page, Property 5: Password strength indicator reflects password quality
    // **Validates: Requirements 3.3, 3.4**
    describe('Property-Based Tests', () => {
      test('property: longer passwords with more character variety have higher strength', () => {
        fc.assert(
          fc.property(
            fc.record({
              length: fc.integer({ min: 8, max: 30 }),
              hasUpper: fc.boolean(),
              hasLower: fc.boolean(),
              hasNumber: fc.boolean(),
              hasSpecial: fc.boolean()
            }),
            (config) => {
              // Build password based on config
              let password = '';
              const chars = {
                upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                lower: 'abcdefghijklmnopqrstuvwxyz',
                number: '0123456789',
                special: '!@#$%^&*()'
              };
              
              if (config.hasUpper) password += chars.upper[0];
              if (config.hasLower) password += chars.lower[0];
              if (config.hasNumber) password += chars.number[0];
              if (config.hasSpecial) password += chars.special[0];
              
              // Fill to desired length
              while (password.length < config.length) {
                password += 'a';
              }
              
              const strength = calculatePasswordStrength(password);
              
              // Verify strength is one of the valid enum values
              expect([
                PasswordStrength.WEAK,
                PasswordStrength.FAIR,
                PasswordStrength.GOOD,
                PasswordStrength.STRONG
              ]).toContain(strength);
              
              // Longer passwords should generally be stronger
              if (config.length >= 16 && config.hasUpper && config.hasLower && config.hasNumber && config.hasSpecial) {
                expect([PasswordStrength.GOOD, PasswordStrength.STRONG]).toContain(strength);
              }
            }
          ),
          { numRuns: 100 }
        );
      });

      test('property: passwords with all character types are stronger than those without', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 8, max: 20 }),
            (length) => {
              // Password with all character types
              const fullPassword = 'Aa1!' + 'x'.repeat(Math.max(0, length - 4));
              // Password with only lowercase
              const simplePassword = 'a'.repeat(length);
              
              const fullStrength = calculatePasswordStrength(fullPassword);
              const simpleStrength = calculatePasswordStrength(simplePassword);
              
              const strengthOrder = [PasswordStrength.WEAK, PasswordStrength.FAIR, PasswordStrength.GOOD, PasswordStrength.STRONG];
              
              // Full password should be stronger or equal
              expect(strengthOrder.indexOf(fullStrength)).toBeGreaterThanOrEqual(strengthOrder.indexOf(simpleStrength));
            }
          ),
          { numRuns: 100 }
        );
      });

      test('property: strength calculation is consistent for same password', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 0, maxLength: 30 }),
            (password) => {
              const strength1 = calculatePasswordStrength(password);
              const strength2 = calculatePasswordStrength(password);
              
              expect(strength1).toBe(strength2);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('isValidEmail', () => {
    describe('Unit Tests - Edge Cases', () => {
      it('should accept valid email addresses', () => {
        const validEmails = [
          'user@example.com',
          'test.user@example.com',
          'user+tag@example.co.uk',
          'user_name@example.com',
          'user123@test-domain.com',
          'a@b.c'
        ];
        
        validEmails.forEach(email => {
          expect(isValidEmail(email)).toBe(true);
        });
      });

      it('should reject invalid email addresses', () => {
        const invalidEmails = [
          '',
          'notanemail',
          '@example.com',
          'user@',
          'user @example.com',
          'user@example',
          'user..name@example.com',
          'user@.com',
          'user@example..com'
        ];
        
        invalidEmails.forEach(email => {
          expect(isValidEmail(email)).toBe(false);
        });
      });

      it('should reject email with spaces', () => {
        expect(isValidEmail('user name@example.com')).toBe(false);
        expect(isValidEmail('user@exam ple.com')).toBe(false);
      });

      it('should reject email without @', () => {
        expect(isValidEmail('userexample.com')).toBe(false);
      });

      it('should reject email without domain', () => {
        expect(isValidEmail('user@')).toBe(false);
      });

      it('should reject email without local part', () => {
        expect(isValidEmail('@example.com')).toBe(false);
      });

      it('should reject email without TLD', () => {
        expect(isValidEmail('user@example')).toBe(false);
      });
    });

    // Feature: register-page, Property 2: Email validation rejects invalid formats
    // **Validates: Requirements 2.1, 2.3**
    describe('Property-Based Tests', () => {
      test('property: emails with valid format are accepted', () => {
        fc.assert(
          fc.property(
            fc.emailAddress(),
            (email) => {
              // fast-check's emailAddress generator creates valid emails
              const result = isValidEmail(email);
              expect(result).toBe(true);
            }
          ),
          { numRuns: 100 }
        );
      });

      test('property: strings without @ are rejected', () => {
        fc.assert(
          fc.property(
            fc.string().filter(s => !s.includes('@')),
            (invalidEmail) => {
              const result = isValidEmail(invalidEmail);
              expect(result).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      test('property: strings with spaces are rejected', () => {
        fc.assert(
          fc.property(
            fc.string().filter(s => s.includes(' ')),
            (invalidEmail) => {
              const result = isValidEmail(invalidEmail);
              expect(result).toBe(false);
            }
          ),
          { numRuns: 100 }
        );
      });

      test('property: validation is consistent for same email', () => {
        fc.assert(
          fc.property(
            fc.string(),
            (email) => {
              const result1 = isValidEmail(email);
              const result2 = isValidEmail(email);
              
              expect(result1).toBe(result2);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
