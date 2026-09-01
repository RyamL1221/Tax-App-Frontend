/**
 * Unit tests for 1099-DIV form validation schema
 * 
 * Tests specific valid and invalid examples for each field type,
 * edge cases, and boundary values.
 */

import { describe, it, expect } from '@jest/globals';
import {
  form1099DivSchema,
  tinRegex,
  ssnRegex,
  yearRegex,
  stateRegex,
  currencyRegex,
  isValidPayerTIN,
  isValidRecipientTIN,
  isValidCurrency,
  isValidYear,
  isValidStateCode,
  formatTIN,
  formatCurrency,
  getDefaultFormValues,
  type Form1099DivData,
} from '../form1099DivSchema';

describe('form1099DivSchema', () => {
  describe('Required Fields Validation', () => {
    it('should validate a complete valid form', () => {
      const validData: Form1099DivData = {
        calendarYear: '2024',
        payerName: 'Example Corporation',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '1000.00',
      };

      const result = form1099DivSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject form with missing calendar year', () => {
      const invalidData = {
        payerName: 'Example Corporation',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '1000.00',
      };

      const result = form1099DivSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('calendarYear');
      }
    });

    it('should reject form with missing payer name', () => {
      const invalidData = {
        calendarYear: '2024',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '1000.00',
      };

      const result = form1099DivSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject form with empty required fields', () => {
      const invalidData = {
        calendarYear: '',
        payerName: '',
        payerTIN: '',
        recipientName: '',
        recipientTIN: '',
        totalOrdinaryDividends: '',
      };

      const result = form1099DivSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Payer TIN Validation (Requirements 2.3)', () => {
    it('should accept valid payer TIN with hyphen', () => {
      expect(tinRegex.test('12-3456789')).toBe(true);
      expect(isValidPayerTIN('12-3456789')).toBe(true);
    });

    it('should accept valid payer TIN without hyphen', () => {
      expect(tinRegex.test('123456789')).toBe(true);
      expect(isValidPayerTIN('123456789')).toBe(true);
    });

    it('should reject payer TIN with wrong format', () => {
      expect(tinRegex.test('123-456789')).toBe(false);
      expect(tinRegex.test('1-23456789')).toBe(false);
      expect(tinRegex.test('12-345678')).toBe(false);
      expect(tinRegex.test('abc-defghij')).toBe(false);
    });

    it('should reject payer TIN with letters', () => {
      expect(isValidPayerTIN('AB-1234567')).toBe(false);
    });

    it('should reject payer TIN that is too short', () => {
      expect(isValidPayerTIN('12-345678')).toBe(false);
    });

    it('should reject payer TIN that is too long', () => {
      expect(isValidPayerTIN('12-34567890')).toBe(false);
    });
  });

  describe('Recipient TIN/SSN Validation (Requirements 2.4)', () => {
    it('should accept valid recipient TIN with hyphens', () => {
      expect(ssnRegex.test('123-45-6789')).toBe(true);
      expect(isValidRecipientTIN('123-45-6789')).toBe(true);
    });

    it('should accept valid recipient TIN without hyphens', () => {
      expect(ssnRegex.test('123456789')).toBe(true);
      expect(isValidRecipientTIN('123456789')).toBe(true);
    });

    it('should reject recipient TIN with wrong format', () => {
      expect(ssnRegex.test('12-345-6789')).toBe(false);
      expect(ssnRegex.test('1234-56-789')).toBe(false);
      expect(ssnRegex.test('123-456-789')).toBe(false);
    });

    it('should reject recipient TIN with letters', () => {
      expect(isValidRecipientTIN('ABC-45-6789')).toBe(false);
    });

    it('should reject recipient TIN that is too short', () => {
      expect(isValidRecipientTIN('123-45-678')).toBe(false);
    });

    it('should reject recipient TIN that is too long', () => {
      expect(isValidRecipientTIN('123-45-67890')).toBe(false);
    });
  });

  describe('Currency Format Validation (Requirements 2.5)', () => {
    it('should accept valid currency amounts', () => {
      expect(currencyRegex.test('1000.00')).toBe(true);
      expect(currencyRegex.test('1000')).toBe(true);
      expect(currencyRegex.test('1000.5')).toBe(true);
      expect(currencyRegex.test('0.99')).toBe(true);
      expect(currencyRegex.test('0')).toBe(true);
      expect(isValidCurrency('1234.56')).toBe(true);
    });

    it('should reject currency with more than 2 decimal places', () => {
      expect(currencyRegex.test('1000.123')).toBe(false);
      expect(isValidCurrency('100.999')).toBe(false);
    });

    it('should reject negative currency amounts', () => {
      expect(currencyRegex.test('-1000.00')).toBe(false);
      expect(isValidCurrency('-100')).toBe(false);
    });

    it('should reject currency with letters', () => {
      expect(currencyRegex.test('abc')).toBe(false);
      expect(isValidCurrency('$1000')).toBe(false);
    });

    it('should reject currency with special characters', () => {
      expect(isValidCurrency('1,000.00')).toBe(false);
    });
  });

  describe('Year Format Validation (Requirements 2.6)', () => {
    it('should accept valid 4-digit years', () => {
      expect(yearRegex.test('2024')).toBe(true);
      expect(yearRegex.test('2000')).toBe(true);
      expect(yearRegex.test('1999')).toBe(true);
      expect(isValidYear('2024')).toBe(true);
    });

    it('should reject 2-digit years', () => {
      expect(yearRegex.test('24')).toBe(false);
      expect(isValidYear('24')).toBe(false);
    });

    it('should reject 3-digit years', () => {
      expect(yearRegex.test('202')).toBe(false);
    });

    it('should reject 5-digit years', () => {
      expect(yearRegex.test('20244')).toBe(false);
    });

    it('should reject years with letters', () => {
      expect(isValidYear('202A')).toBe(false);
    });
  });

  describe('State Code Validation (Requirements 2.7)', () => {
    it('should accept valid 2-letter state codes', () => {
      expect(stateRegex.test('NY')).toBe(true);
      expect(stateRegex.test('CA')).toBe(true);
      expect(stateRegex.test('TX')).toBe(true);
      expect(isValidStateCode('FL')).toBe(true);
    });

    it('should reject lowercase state codes', () => {
      expect(stateRegex.test('ny')).toBe(false);
      expect(isValidStateCode('ca')).toBe(false);
    });

    it('should reject state codes with wrong length', () => {
      expect(stateRegex.test('N')).toBe(false);
      expect(stateRegex.test('NYC')).toBe(false);
    });

    it('should reject state codes with numbers', () => {
      expect(isValidStateCode('N1')).toBe(false);
    });

    it('should accept empty string for optional state fields', () => {
      const data = {
        calendarYear: '2024',
        payerName: 'Example Corp',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '1000.00',
        payerState: '',
        recipientState: '',
        state: '',
        state2: '',
      };

      const result = form1099DivSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Optional Fields', () => {
    it('should accept form with optional fields populated', () => {
      const data: Form1099DivData = {
        calendarYear: '2024',
        payerName: 'Example Corporation',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '1000.00',
        qualifiedDividends: '800.00',
        federalIncomeTaxWithheld: '150.00',
        state: 'NY',
        stateTaxWithheld: '50.00',
        voided: false,
        corrected: true,
      };

      const result = form1099DivSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept form with optional fields as empty strings', () => {
      const data = {
        calendarYear: '2024',
        payerName: 'Example Corporation',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '1000.00',
        qualifiedDividends: '',
        federalIncomeTaxWithheld: '',
        state: '',
      };

      const result = form1099DivSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept form with optional fields omitted', () => {
      const data = {
        calendarYear: '2024',
        payerName: 'Example Corporation',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '1000.00',
      };

      const result = form1099DivSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Field Length Validation', () => {
    it('should reject payer name longer than 100 characters', () => {
      const data = {
        calendarYear: '2024',
        payerName: 'A'.repeat(101),
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '1000.00',
      };

      const result = form1099DivSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept payer name exactly 100 characters', () => {
      const data = {
        calendarYear: '2024',
        payerName: 'A'.repeat(100),
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '1000.00',
      };

      const result = form1099DivSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    describe('formatTIN', () => {
      it('should format payer TIN with hyphens', () => {
        expect(formatTIN('123456789', 'payer')).toBe('12-3456789');
      });

      it('should format recipient TIN with hyphens', () => {
        expect(formatTIN('123456789', 'recipient')).toBe('123-45-6789');
      });

      it('should preserve already formatted TINs', () => {
        expect(formatTIN('12-3456789', 'payer')).toBe('12-3456789');
        expect(formatTIN('123-45-6789', 'recipient')).toBe('123-45-6789');
      });

      it('should return original if invalid length', () => {
        expect(formatTIN('12345', 'payer')).toBe('12345');
        expect(formatTIN('12345', 'recipient')).toBe('12345');
      });
    });

    describe('formatCurrency', () => {
      it('should format currency to 2 decimal places', () => {
        expect(formatCurrency('1000')).toBe('1000.00');
        expect(formatCurrency('1000.5')).toBe('1000.50');
        expect(formatCurrency('1000.99')).toBe('1000.99');
      });

      it('should return original if not a number', () => {
        expect(formatCurrency('abc')).toBe('abc');
      });
    });

    describe('getDefaultFormValues', () => {
      it('should return default values with current year', () => {
        const defaults = getDefaultFormValues();
        const currentYear = new Date().getFullYear().toString();
        
        expect(defaults.calendarYear).toBe(currentYear);
        expect(defaults.payerName).toBe('');
        expect(defaults.payerTIN).toBe('');
        expect(defaults.recipientName).toBe('');
        expect(defaults.recipientTIN).toBe('');
        expect(defaults.totalOrdinaryDividends).toBe('');
        expect(defaults.voided).toBe(false);
        expect(defaults.corrected).toBe(false);
        expect(defaults.secondTinNotification).toBe(false);
        expect(defaults.fatcaFilingRequirement).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle boundary values for currency', () => {
      const data = {
        calendarYear: '2024',
        payerName: 'Example Corp',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '0.01',
      };

      const result = form1099DivSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle zero values for currency', () => {
      const data = {
        calendarYear: '2024',
        payerName: 'Example Corp',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '0',
      };

      const result = form1099DivSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle large currency values', () => {
      const data = {
        calendarYear: '2024',
        payerName: 'Example Corp',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '999999999.99',
      };

      const result = form1099DivSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle all checkbox fields', () => {
      const data = {
        calendarYear: '2024',
        payerName: 'Example Corp',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '1000.00',
        voided: true,
        corrected: true,
        secondTinNotification: true,
        fatcaFilingRequirement: true,
      };

      const result = form1099DivSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle both state tax fields', () => {
      const data = {
        calendarYear: '2024',
        payerName: 'Example Corp',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '1000.00',
        state: 'NY',
        stateIdentificationNumber: '12-3456789',
        stateTaxWithheld: '50.00',
        state2: 'CA',
        stateIdentificationNumber2: '98-7654321',
        stateTaxWithheld2: '25.00',
      };

      const result = form1099DivSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
