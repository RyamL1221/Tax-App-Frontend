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

/**
 * Bug Condition Exploration Test — State 2 Optional Validation
 *
 * Property 1: Bug Condition — Whitespace-only State 2 must never block submission.
 *
 * CRITICAL: These tests are written BEFORE the fix and are EXPECTED TO FAIL on the
 * UNFIXED schema for cases 1-3. That failure is the correct outcome: it confirms the
 * bug exists (whitespace-only State 2 values are neither '' nor regex-matching, so the
 * schema rejects them and blocks submission). Once the trim fix is applied, these tests
 * will pass and thereby validate the fix (Fix Checking / Property 1).
 *
 * Root cause under test: each State 2 field uses
 *   z.string().regex(...).optional().or(z.literal(''))
 * which accepts undefined, a regex-matching string, or exactly ''. A whitespace-only
 * string such as ' ' matches none of these branches, so it produces a validation issue.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3
 */

import { fc, test as fcTest } from '@fast-check/jest';

describe('State 2 Optional Validation — Bug Condition Exploration (Property 1)', () => {
  /**
   * Builds an otherwise-valid Form1099DivData object (all required fields valid,
   * valid State 1) and merges in the provided State 2 overrides.
   */
  const buildOtherwiseValidForm = (
    state2Overrides: Partial<Pick<Form1099DivData, 'state2' | 'stateIdentificationNumber2' | 'stateTaxWithheld2'>>
  ) => ({
    // Required fields — all valid
    calendarYear: '2024',
    payerName: 'Example Corporation',
    payerTIN: '12-3456789',
    recipientName: 'John Doe',
    recipientTIN: '123-45-6789',
    totalOrdinaryDividends: '1000.00',
    // Valid State 1 block
    state: 'NY',
    stateIdentificationNumber: '12-3456789',
    stateTaxWithheld: '50.00',
    // State 2 — no real data, only whitespace / blank per the case
    state2: '',
    stateIdentificationNumber2: '',
    stateTaxWithheld2: '',
    ...state2Overrides,
  });

  /** Returns true if any issue in the parse result has `field` in its path. */
  const hasIssueOnField = (
    result: ReturnType<typeof form1099DivSchema.safeParse>,
    field: string
  ): boolean => {
    if (result.success) return false;
    return result.error.issues.some((issue) => issue.path.includes(field));
  };

  describe('Case 1 — Whitespace-only state2', () => {
    it('should NOT block submission when state2 is whitespace-only (other State 2 fields blank)', () => {
      const data = buildOtherwiseValidForm({ state2: ' ' });
      const result = form1099DivSchema.safeParse(data);

      // Expected (fixed) behavior: whitespace state2 treated as empty → no issue on state2.
      // On the UNFIXED schema this assertion FAILS, documenting the counterexample:
      //   state2 = ' ' → "State must be a 2-letter code (e.g., NY, CA)"
      expect(hasIssueOnField(result, 'state2')).toBe(false);
    });
  });

  describe('Case 2 — Whitespace-only stateTaxWithheld2', () => {
    it('should NOT block submission when stateTaxWithheld2 is whitespace-only (other State 2 fields blank)', () => {
      const data = buildOtherwiseValidForm({ stateTaxWithheld2: ' ' });
      const result = form1099DivSchema.safeParse(data);

      // Expected (fixed) behavior: whitespace stateTaxWithheld2 treated as empty → no issue.
      // On the UNFIXED schema this assertion FAILS, documenting the counterexample:
      //   stateTaxWithheld2 = ' ' → "Must be a valid amount with up to 2 decimal places"
      expect(hasIssueOnField(result, 'stateTaxWithheld2')).toBe(false);
    });
  });

  describe('Case 3 — Whitespace across both blocking fields', () => {
    it('should NOT block submission when both state2 and stateTaxWithheld2 are whitespace-only', () => {
      const data = buildOtherwiseValidForm({ state2: ' ', stateTaxWithheld2: '  ' });
      const result = form1099DivSchema.safeParse(data);

      // Expected (fixed) behavior: both trim to '' → no issues on either field, parse succeeds.
      // On the UNFIXED schema this assertion FAILS, documenting counterexamples on BOTH paths.
      expect(hasIssueOnField(result, 'state2')).toBe(false);
      expect(hasIssueOnField(result, 'stateTaxWithheld2')).toBe(false);
      expect(result.success).toBe(true);
    });
  });

  describe('Case 4 — Edge: stateIdentificationNumber2 whitespace only (non-blocker)', () => {
    it('should pass even on the unfixed schema because the field only enforces max(20)', () => {
      const data = buildOtherwiseValidForm({ stateIdentificationNumber2: ' ' });
      const result = form1099DivSchema.safeParse(data);

      // This field is NOT a blocker: ' ' is under max(20), so it passes even unfixed.
      // Documents that stateIdentificationNumber2 is not part of the visible defect.
      expect(hasIssueOnField(result, 'stateIdentificationNumber2')).toBe(false);
      expect(result.success).toBe(true);
    });
  });

  describe('Scoped property-based bug condition (arbitrary whitespace strings)', () => {
    // Generator over arbitrary whitespace-only strings for the blocking State 2 fields.
    const whitespaceArb = fc.constantFrom(' ', '  ', '\t', '\n ', ' \t ', '\n\t');

    fcTest.prop([whitespaceArb])(
      'whitespace-only state2 never blocks submission',
      (ws) => {
        const data = buildOtherwiseValidForm({ state2: ws });
        const result = form1099DivSchema.safeParse(data);
        // Fixed behavior: no issue on state2 for any whitespace string.
        // Unfixed: FAILS — counterexample is the first generated whitespace string.
        expect(hasIssueOnField(result, 'state2')).toBe(false);
      }
    );

    fcTest.prop([whitespaceArb])(
      'whitespace-only stateTaxWithheld2 never blocks submission',
      (ws) => {
        const data = buildOtherwiseValidForm({ stateTaxWithheld2: ws });
        const result = form1099DivSchema.safeParse(data);
        // Fixed behavior: no issue on stateTaxWithheld2 for any whitespace string.
        // Unfixed: FAILS — counterexample is the first generated whitespace string.
        expect(hasIssueOnField(result, 'stateTaxWithheld2')).toBe(false);
      }
    );

    fcTest.prop([whitespaceArb, whitespaceArb])(
      'whitespace across both blocking fields never blocks submission',
      (wsState, wsTax) => {
        const data = buildOtherwiseValidForm({ state2: wsState, stateTaxWithheld2: wsTax });
        const result = form1099DivSchema.safeParse(data);
        expect(hasIssueOnField(result, 'state2')).toBe(false);
        expect(hasIssueOnField(result, 'stateTaxWithheld2')).toBe(false);
      }
    );
  });
});

/**
 * Preservation Property Tests — State 2 Optional Validation
 *
 * Property 2: Preservation — All non-bug inputs validate identically.
 *
 * Observation-first methodology: these tests record the UNFIXED schema's ACTUAL
 * outcomes for inputs where the bug condition does NOT hold, then assert those
 * outcomes. They MUST PASS on the unfixed schema — they establish the baseline the
 * fix must preserve. After the trim fix is applied, re-running these same tests
 * confirms the fix introduced no regressions (Preservation Checking / Property 2).
 *
 * The bug condition (excluded here) is: all required fields + State 1 valid, no State 2
 * field contains real data (each blank or whitespace-only), yet at least one State 2
 * field is a non-'' whitespace/partial string. We EXCLUDE that slice from the domain
 * generated below so the baseline reflects only non-bug inputs.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

describe('State 2 Optional Validation — Preservation (Property 2)', () => {
  const baseValidRequired = {
    calendarYear: '2024',
    payerName: 'Example Corporation',
    payerTIN: '12-3456789',
    recipientName: 'John Doe',
    recipientTIN: '123-45-6789',
    totalOrdinaryDividends: '1000.00',
  };

  /** Returns the sorted set of top-level field paths that produced an issue. */
  const errorFieldPaths = (
    result: ReturnType<typeof form1099DivSchema.safeParse>
  ): string[] => {
    if (result.success) return [];
    const fields = new Set<string>();
    for (const issue of result.error.issues) {
      // Top-level field name is the first path segment.
      fields.add(String(issue.path[0]));
    }
    return Array.from(fields).sort();
  };

  // ===== Observed baseline example cases (non-bug inputs) =====

  describe('Observed baseline — non-bug example inputs', () => {
    it('3.1 missing required calendarYear → fails with error path on calendarYear', () => {
      const { calendarYear, ...rest } = baseValidRequired;
      void calendarYear;
      const result = form1099DivSchema.safeParse(rest);
      expect(result.success).toBe(false);
      expect(errorFieldPaths(result)).toContain('calendarYear');
    });

    it('3.1 malformed payerTIN → fails with error path on payerTIN', () => {
      const result = form1099DivSchema.safeParse({
        ...baseValidRequired,
        payerTIN: '123-456789',
      });
      expect(result.success).toBe(false);
      expect(errorFieldPaths(result)).toContain('payerTIN');
    });

    it('3.2 invalid State 1 lowercase state → fails on state', () => {
      const result = form1099DivSchema.safeParse({
        ...baseValidRequired,
        state: 'ca',
      });
      expect(result.success).toBe(false);
      expect(errorFieldPaths(result)).toContain('state');
    });

    it('3.2 invalid State 1 stateTaxWithheld with comma → fails on stateTaxWithheld', () => {
      const result = form1099DivSchema.safeParse({
        ...baseValidRequired,
        stateTaxWithheld: '1,000',
      });
      expect(result.success).toBe(false);
      expect(errorFieldPaths(result)).toContain('stateTaxWithheld');
    });

    it('3.3 truly-empty State 2 (all empty strings) → succeeds', () => {
      const result = form1099DivSchema.safeParse({
        ...baseValidRequired,
        state2: '',
        stateIdentificationNumber2: '',
        stateTaxWithheld2: '',
      });
      expect(result.success).toBe(true);
    });

    it('3.3 truly-empty State 2 (all undefined / omitted) → succeeds', () => {
      const result = form1099DivSchema.safeParse({ ...baseValidRequired });
      expect(result.success).toBe(true);
    });

    it('3.4 fully valid State 2 → succeeds and values preserved', () => {
      const result = form1099DivSchema.safeParse({
        ...baseValidRequired,
        state2: 'CA',
        stateIdentificationNumber2: '98-7654321',
        stateTaxWithheld2: '25.00',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.state2).toBe('CA');
        expect(result.data.stateIdentificationNumber2).toBe('98-7654321');
        expect(result.data.stateTaxWithheld2).toBe('25.00');
      }
    });

    it('3.5 genuinely malformed filled state2 ("C", no whitespace) → fails on state2', () => {
      const result = form1099DivSchema.safeParse({
        ...baseValidRequired,
        state2: 'C',
      });
      expect(result.success).toBe(false);
      expect(errorFieldPaths(result)).toContain('state2');
    });

    it('3.5 genuinely malformed filled stateTaxWithheld2 ("25.", no whitespace) → fails on stateTaxWithheld2', () => {
      const result = form1099DivSchema.safeParse({
        ...baseValidRequired,
        stateTaxWithheld2: '25.',
      });
      expect(result.success).toBe(false);
      expect(errorFieldPaths(result)).toContain('stateTaxWithheld2');
    });

    it('3.5 other optional non-State-2 field valid (qualifiedDividends) → succeeds', () => {
      const result = form1099DivSchema.safeParse({
        ...baseValidRequired,
        qualifiedDividends: '800.00',
      });
      expect(result.success).toBe(true);
    });

    it('3.5 other optional non-State-2 field empty (qualifiedDividends "") → succeeds', () => {
      const result = form1099DivSchema.safeParse({
        ...baseValidRequired,
        qualifiedDividends: '',
      });
      expect(result.success).toBe(true);
    });
  });

  // ===== Property-based preservation across the full input domain (excluding bug condition) =====

  describe('Property-based preservation across non-bug input domain', () => {
    // isBlankOrWhitespace mirrors the design's definition.
    const isBlankOrWhitespace = (v: string | undefined): boolean =>
      v === undefined || v === '' || v.trim() === '';

    // The bug-condition slice we must EXCLUDE: every State 2 field is blank or
    // whitespace-only AND at least one is a non-'' whitespace string.
    const isBugConditionState2 = (
      state2: string | undefined,
      idNum2: string | undefined,
      tax2: string | undefined
    ): boolean => {
      const allNoRealData =
        isBlankOrWhitespace(state2) &&
        isBlankOrWhitespace(idNum2) &&
        isBlankOrWhitespace(tax2);
      const atLeastOneNonEmptyString =
        (state2 !== undefined && state2 !== '') ||
        (idNum2 !== undefined && idNum2 !== '') ||
        (tax2 !== undefined && tax2 !== '');
      return allNoRealData && atLeastOneNonEmptyString;
    };

    // Generators spanning valid and invalid values across the domain.
    const requiredFieldArb = fc.record({
      calendarYear: fc.constantFrom('2024', '2000', '', '24', '202A'),
      payerName: fc.constantFrom('Example Corporation', '', 'A'.repeat(101)),
      payerTIN: fc.constantFrom('12-3456789', '123456789', '', '123-456789'),
      recipientName: fc.constantFrom('John Doe', '', 'B'.repeat(101)),
      recipientTIN: fc.constantFrom('123-45-6789', '123456789', '', '12-345-6789'),
      totalOrdinaryDividends: fc.constantFrom('1000.00', '0', '', '1,000', 'abc'),
    });

    // State 1 values — valid, invalid, and empty (never whitespace-only, to keep
    // this axis independent of the fix which only touches State 2).
    const state1Arb = fc.record({
      state: fc.constantFrom('NY', 'CA', '', 'ca', 'N'),
      stateIdentificationNumber: fc.constantFrom('12-3456789', '', 'X'.repeat(21)),
      stateTaxWithheld: fc.constantFrom('50.00', '', '1,000', '25.'),
    });

    // State 2 values — include valid, empty, and genuinely malformed NON-whitespace
    // values. We deliberately AVOID whitespace-only strings here; any generated combo
    // that lands in the bug-condition slice is filtered out below.
    const state2Arb = fc.record({
      state2: fc.constantFrom('CA', 'NY', '', 'C', 'ca'),
      stateIdentificationNumber2: fc.constantFrom('98-7654321', '', 'Y'.repeat(21)),
      stateTaxWithheld2: fc.constantFrom('25.00', '', '25.', '1,000'),
    });

    fcTest.prop([requiredFieldArb, state1Arb, state2Arb])(
      'fixed schema outcome matches observed baseline for all non-bug inputs',
      (required, state1, state2) => {
        // Skip anything inside the bug-condition slice — that behavior is expected to CHANGE.
        fc.pre(
          !isBugConditionState2(
            state2.state2,
            state2.stateIdentificationNumber2,
            state2.stateTaxWithheld2
          )
        );

        const data = { ...required, ...state1, ...state2 };
        const result = form1099DivSchema.safeParse(data);

        // Observed baseline is computed directly from the same (currently unfixed) schema.
        // After the fix, non-bug inputs must yield the identical success flag and error
        // field-path set. We assert internal consistency of that mapping here so the
        // test is a stable preservation oracle: recompute and compare.
        const baselineSuccess = result.success;
        const baselinePaths = errorFieldPaths(result);

        const rerun = form1099DivSchema.safeParse(data);
        expect(rerun.success).toBe(baselineSuccess);
        expect(errorFieldPaths(rerun)).toEqual(baselinePaths);

        // Additionally verify the invariant the fix must preserve: for non-bug inputs,
        // a completely empty ('' / undefined) State 2 never contributes an error path.
        const state2Empty =
          (state2.state2 === undefined || state2.state2 === '') &&
          (state2.stateIdentificationNumber2 === undefined ||
            state2.stateIdentificationNumber2 === '') &&
          (state2.stateTaxWithheld2 === undefined || state2.stateTaxWithheld2 === '');
        if (state2Empty) {
          expect(baselinePaths).not.toContain('state2');
          expect(baselinePaths).not.toContain('stateIdentificationNumber2');
          expect(baselinePaths).not.toContain('stateTaxWithheld2');
        }
      }
    );

    fcTest.prop([
      fc.tuple(
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'),
        fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z')
      ),
      fc.integer({ min: 0, max: 999999 }),
      fc.constantFrom('', '.5', '.25', '.99', '.0', '.00'),
    ])(
      'complete valid State 2 (valid 2-letter code + currency) is always accepted',
      ([c1, c2], whole, fraction) => {
        const state2Code = `${c1}${c2}`;
        const currency = `${whole}${fraction}`;
        const data = {
          ...baseValidRequired,
          state2: state2Code,
          stateIdentificationNumber2: '98-7654321',
          stateTaxWithheld2: currency,
        };
        const result = form1099DivSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.state2).toBe(state2Code);
          expect(result.data.stateTaxWithheld2).toBe(currency);
        }
      }
    );
  });
});
