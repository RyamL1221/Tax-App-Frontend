/**
 * Unit tests for Validators class
 * Tests specific examples and edge cases for each validator
 */

import { Validators } from '../validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(Validators.validateEmail('user@example.com').isValid).toBe(true);
      expect(Validators.validateEmail('test.user@domain.co.uk').isValid).toBe(true);
      expect(Validators.validateEmail('name+tag@example.org').isValid).toBe(true);
    });

    it('should reject invalid email formats', () => {
      const result1 = Validators.validateEmail('invalid');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('Invalid email format');

      const result2 = Validators.validateEmail('missing@domain');
      expect(result2.isValid).toBe(false);

      const result3 = Validators.validateEmail('@example.com');
      expect(result3.isValid).toBe(false);

      const result4 = Validators.validateEmail('user@');
      expect(result4.isValid).toBe(false);
    });

    it('should reject emails with spaces', () => {
      const result = Validators.validateEmail('user @example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });
  });

  describe('validatePassword', () => {
    it('should validate passwords with 8 or more characters', () => {
      expect(Validators.validatePassword('12345678').isValid).toBe(true);
      expect(Validators.validatePassword('password123').isValid).toBe(true);
      expect(Validators.validatePassword('a'.repeat(100)).isValid).toBe(true);
    });

    it('should reject passwords with less than 8 characters', () => {
      const result1 = Validators.validatePassword('1234567');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('Password must be at least 8 characters');

      const result2 = Validators.validatePassword('');
      expect(result2.isValid).toBe(false);

      const result3 = Validators.validatePassword('abc');
      expect(result3.isValid).toBe(false);
    });
  });

  describe('validateTIN', () => {
    describe('EIN format', () => {
      it('should validate correct EIN format (XX-XXXXXXX)', () => {
        expect(Validators.validateTIN('12-3456789', 'EIN').isValid).toBe(true);
        expect(Validators.validateTIN('00-0000000', 'EIN').isValid).toBe(true);
        expect(Validators.validateTIN('99-9999999', 'EIN').isValid).toBe(true);
      });

      it('should reject invalid EIN formats', () => {
        const result1 = Validators.validateTIN('123456789', 'EIN');
        expect(result1.isValid).toBe(false);
        expect(result1.error).toContain('Invalid EIN format');

        const result2 = Validators.validateTIN('12-345678', 'EIN');
        expect(result2.isValid).toBe(false);

        const result3 = Validators.validateTIN('1-23456789', 'EIN');
        expect(result3.isValid).toBe(false);

        const result4 = Validators.validateTIN('AB-1234567', 'EIN');
        expect(result4.isValid).toBe(false);
      });
    });

    describe('SSN format', () => {
      it('should validate correct SSN format (XXX-XX-XXXX)', () => {
        expect(Validators.validateTIN('123-45-6789', 'SSN').isValid).toBe(true);
        expect(Validators.validateTIN('000-00-0000', 'SSN').isValid).toBe(true);
        expect(Validators.validateTIN('999-99-9999', 'SSN').isValid).toBe(true);
      });

      it('should reject invalid SSN formats', () => {
        const result1 = Validators.validateTIN('123456789', 'SSN');
        expect(result1.isValid).toBe(false);
        expect(result1.error).toContain('Invalid SSN format');

        const result2 = Validators.validateTIN('12-34-5678', 'SSN');
        expect(result2.isValid).toBe(false);

        const result3 = Validators.validateTIN('1234-56-789', 'SSN');
        expect(result3.isValid).toBe(false);

        const result4 = Validators.validateTIN('ABC-DE-FGHI', 'SSN');
        expect(result4.isValid).toBe(false);
      });
    });
  });

  describe('validateStateCode', () => {
    it('should validate correct state codes (2 uppercase letters)', () => {
      expect(Validators.validateStateCode('CA').isValid).toBe(true);
      expect(Validators.validateStateCode('NY').isValid).toBe(true);
      expect(Validators.validateStateCode('TX').isValid).toBe(true);
    });

    it('should reject invalid state codes', () => {
      const result1 = Validators.validateStateCode('ca');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('State code must be 2 uppercase letters');

      const result2 = Validators.validateStateCode('C');
      expect(result2.isValid).toBe(false);

      const result3 = Validators.validateStateCode('CAL');
      expect(result3.isValid).toBe(false);

      const result4 = Validators.validateStateCode('C1');
      expect(result4.isValid).toBe(false);

      const result5 = Validators.validateStateCode('');
      expect(result5.isValid).toBe(false);
    });
  });

  describe('validateMonetaryValue', () => {
    it('should validate correct monetary formats (exactly 2 decimal places)', () => {
      expect(Validators.validateMonetaryValue('0.00').isValid).toBe(true);
      expect(Validators.validateMonetaryValue('100.50').isValid).toBe(true);
      expect(Validators.validateMonetaryValue('1234567.89').isValid).toBe(true);
    });

    it('should reject invalid monetary formats', () => {
      const result1 = Validators.validateMonetaryValue('100');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('Monetary value must have exactly 2 decimal places');

      const result2 = Validators.validateMonetaryValue('100.5');
      expect(result2.isValid).toBe(false);

      const result3 = Validators.validateMonetaryValue('100.500');
      expect(result3.isValid).toBe(false);

      const result4 = Validators.validateMonetaryValue('$100.00');
      expect(result4.isValid).toBe(false);

      const result5 = Validators.validateMonetaryValue('100.0a');
      expect(result5.isValid).toBe(false);

      const result6 = Validators.validateMonetaryValue('');
      expect(result6.isValid).toBe(false);
    });
  });

  describe('validateCalendarYear', () => {
    it('should validate correct calendar years (4 digits, 1900-2100)', () => {
      expect(Validators.validateCalendarYear('1900').isValid).toBe(true);
      expect(Validators.validateCalendarYear('2024').isValid).toBe(true);
      expect(Validators.validateCalendarYear('2100').isValid).toBe(true);
    });

    it('should reject years outside valid range', () => {
      const result1 = Validators.validateCalendarYear('1899');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('Calendar year must be between 1900 and 2100');

      const result2 = Validators.validateCalendarYear('2101');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Calendar year must be between 1900 and 2100');
    });

    it('should reject invalid year formats', () => {
      const result1 = Validators.validateCalendarYear('24');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('Invalid calendar year format');

      const result2 = Validators.validateCalendarYear('202');
      expect(result2.isValid).toBe(false);

      const result3 = Validators.validateCalendarYear('20244');
      expect(result3.isValid).toBe(false);

      const result4 = Validators.validateCalendarYear('abcd');
      expect(result4.isValid).toBe(false);

      const result5 = Validators.validateCalendarYear('');
      expect(result5.isValid).toBe(false);
    });
  });
});
