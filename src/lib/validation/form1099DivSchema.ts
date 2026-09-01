/**
 * Validation schema and types for 1099-DIV tax form
 * 
 * This module provides Zod validation schemas and TypeScript types for the 1099-DIV form.
 * It validates all required and optional fields according to IRS specifications and
 * backend API requirements.
 */

import { z } from 'zod';

/**
 * Regular expression patterns for form field validation
 */

// Payer TIN format: XX-XXXXXXX (with or without hyphen)
export const tinRegex = /^\d{2}-?\d{7}$/;

// Recipient TIN/SSN format: XXX-XX-XXXX (with or without hyphens)
export const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;

// Calendar year format: 4-digit year (e.g., 2024)
export const yearRegex = /^\d{4}$/;

// State code format: 2-letter uppercase abbreviation (e.g., NY, CA)
export const stateRegex = /^[A-Z]{2}$/;

// Currency format: decimal with up to 2 decimal places (e.g., 1000.00, 1000, 1000.5)
export const currencyRegex = /^\d+(\.\d{1,2})?$/;

/**
 * Zod validation schema for 1099-DIV form
 * 
 * This schema validates all form fields according to IRS requirements and backend API specifications.
 * Required fields are validated strictly, while optional fields allow empty strings or undefined values.
 */
export const form1099DivSchema = z.object({
  // ===== Required Fields =====
  
  /**
   * Calendar year for the tax form (e.g., "2024")
   * Must be a 4-digit year string
   */
  calendarYear: z.string()
    .min(1, 'Calendar year is required')
    .regex(yearRegex, 'Calendar year must be a 4-digit year (e.g., 2024)'),
  
  /**
   * Payer name (company or organization paying dividends)
   * Maximum 100 characters
   */
  payerName: z.string()
    .min(1, 'Payer name is required')
    .max(100, 'Payer name must be 100 characters or less'),
  
  /**
   * Payer Tax Identification Number (EIN format: XX-XXXXXXX)
   * Hyphens are optional in input but format must match
   */
  payerTIN: z.string()
    .min(1, 'Payer TIN is required')
    .regex(tinRegex, 'Payer TIN must be in format XX-XXXXXXX'),
  
  /**
   * Recipient name (person receiving dividends)
   * Maximum 100 characters
   */
  recipientName: z.string()
    .min(1, 'Recipient name is required')
    .max(100, 'Recipient name must be 100 characters or less'),
  
  /**
   * Recipient Tax Identification Number (SSN format: XXX-XX-XXXX)
   * Hyphens are optional in input but format must match
   */
  recipientTIN: z.string()
    .min(1, 'Recipient TIN is required')
    .regex(ssnRegex, 'Recipient TIN must be in format XXX-XX-XXXX'),
  
  /**
   * Total ordinary dividends (Box 1a)
   * Must be a decimal string with up to 2 decimal places
   */
  totalOrdinaryDividends: z.string()
    .min(1, 'Total ordinary dividends is required')
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places'),
  
  // ===== Optional Payer Address Fields =====
  
  payerStreetAddress: z.string().max(100, 'Street address must be 100 characters or less').optional().or(z.literal('')),
  payerCity: z.string().max(50, 'City must be 50 characters or less').optional().or(z.literal('')),
  payerState: z.string()
    .regex(stateRegex, 'State must be a 2-letter code (e.g., NY, CA)')
    .optional()
    .or(z.literal('')),
  payerCountry: z.string().max(50, 'Country must be 50 characters or less').optional().or(z.literal('')),
  payerZip: z.string().max(10, 'ZIP code must be 10 characters or less').optional().or(z.literal('')),
  payerTelephoneNumber: z.string().max(20, 'Phone number must be 20 characters or less').optional().or(z.literal('')),
  
  // ===== Optional Recipient Address Fields =====
  
  recipientStreetAddress: z.string().max(100, 'Street address must be 100 characters or less').optional().or(z.literal('')),
  recipientCity: z.string().max(50, 'City must be 50 characters or less').optional().or(z.literal('')),
  recipientState: z.string()
    .regex(stateRegex, 'State must be a 2-letter code (e.g., NY, CA)')
    .optional()
    .or(z.literal('')),
  recipientCountry: z.string().max(50, 'Country must be 50 characters or less').optional().or(z.literal('')),
  recipientZip: z.string().max(10, 'ZIP code must be 10 characters or less').optional().or(z.literal('')),
  
  // ===== Optional Dividend Fields =====
  
  /**
   * Qualified dividends (Box 1b)
   * Subset of total ordinary dividends eligible for lower tax rates
   */
  qualifiedDividends: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Total capital gain distributions (Box 2a)
   */
  totalCapitalGainDistributions: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Unrecaptured Section 1250 gain (Box 2b)
   */
  unrecapturedSection1250Gain: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Section 1202 gain (Box 2c)
   */
  section1202Gain: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Collectibles (28%) gain (Box 2d)
   */
  collectibles28Gain: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Section 897 ordinary dividends (Box 2e)
   */
  section897OrdinaryDividends: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Section 897 capital gain (Box 2f)
   */
  section897CapitalGain: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  // ===== Optional Distribution Fields =====
  
  /**
   * Nondividend distributions (Box 3)
   */
  nondividendDistributions: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Cash liquidation distributions (Box 8)
   */
  cashLiquidationDistributions: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Noncash liquidation distributions (Box 9)
   */
  noncashLiquidationDistributions: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  // ===== Optional Tax Withholding Fields =====
  
  /**
   * Federal income tax withheld (Box 4)
   */
  federalIncomeTaxWithheld: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Foreign tax paid (Box 6)
   */
  foreignTaxPaid: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Foreign country or U.S. possession (Box 7)
   */
  foreignCountry: z.string().max(50, 'Country must be 50 characters or less').optional().or(z.literal('')),
  
  // ===== Optional Other Fields =====
  
  /**
   * Section 199A dividends (Box 5)
   */
  section199ADividends: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Investment expenses (Box 10)
   */
  investmentExpenses: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Exempt-interest dividends (Box 11)
   */
  exemptInterestDividends: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  /**
   * Specified private activity bond interest dividends (Box 12)
   */
  specifiedPrivateActivityBondInterest: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  // ===== Optional State Tax Fields (First State) =====
  
  /**
   * State abbreviation (Box 13)
   */
  state: z.string()
    .regex(stateRegex, 'State must be a 2-letter code (e.g., NY, CA)')
    .optional()
    .or(z.literal('')),
  
  /**
   * State identification number (Box 14)
   */
  stateIdentificationNumber: z.string().max(20, 'State ID must be 20 characters or less').optional().or(z.literal('')),
  
  /**
   * State tax withheld (Box 15)
   */
  stateTaxWithheld: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  // ===== Optional State Tax Fields (Second State) =====
  
  /**
   * Second state abbreviation (Box 13)
   */
  state2: z.string()
    .regex(stateRegex, 'State must be a 2-letter code (e.g., NY, CA)')
    .optional()
    .or(z.literal('')),
  
  /**
   * Second state identification number (Box 14)
   */
  stateIdentificationNumber2: z.string().max(20, 'State ID must be 20 characters or less').optional().or(z.literal('')),
  
  /**
   * Second state tax withheld (Box 15)
   */
  stateTaxWithheld2: z.string()
    .regex(currencyRegex, 'Must be a valid amount with up to 2 decimal places')
    .optional()
    .or(z.literal('')),
  
  // ===== Optional Account Field =====
  
  /**
   * Account number (optional identifier)
   */
  accountNumber: z.string().max(20, 'Account number must be 20 characters or less').optional().or(z.literal('')),
  
  // ===== Optional Checkbox Fields =====
  
  /**
   * Indicates the form is voided and should be disregarded
   */
  voided: z.boolean().optional(),
  
  /**
   * Indicates this is a correction of a previously filed form
   */
  corrected: z.boolean().optional(),
  
  /**
   * Second TIN notification - IRS has notified payer twice that recipient's TIN is incorrect
   */
  secondTinNotification: z.boolean().optional(),
  
  /**
   * FATCA filing requirement checkbox
   */
  fatcaFilingRequirement: z.boolean().optional(),
});

/**
 * TypeScript type inferred from the Zod schema
 * Use this type for form data throughout the application
 */
export type Form1099DivData = z.infer<typeof form1099DivSchema>;

/**
 * Response structure from the backend API after document generation
 */
export interface DocumentResponse {
  /**
   * Unique identifier for the document generation job
   */
  jobId: string;
  
  /**
   * Current status of the document generation
   */
  status: 'COMPLETED' | 'PENDING' | 'RUNNING' | 'FAILED';
  
  /**
   * Type of document generated (e.g., "1099-DIV")
   */
  documentType: string;
  
  /**
   * S3 key for the template PDF used
   */
  templateKey: string;
  
  /**
   * S3 key for the generated output PDF
   */
  outputKey: string;
  
  /**
   * Success or error message from the API
   */
  message: string;
}

/**
 * Default values for a new 1099-DIV form
 * Provides empty strings for required fields and undefined for optional fields
 */
export function getDefaultFormValues(): Partial<Form1099DivData> {
  return {
    calendarYear: new Date().getFullYear().toString(),
    payerName: '',
    payerTIN: '',
    recipientName: '',
    recipientTIN: '',
    totalOrdinaryDividends: '',
    voided: false,
    corrected: false,
    secondTinNotification: false,
    fatcaFilingRequirement: false,
  };
}

/**
 * Validation helper functions
 */

/**
 * Validates a payer TIN format
 * @param tin - The TIN to validate
 * @returns true if valid, false otherwise
 */
export function isValidPayerTIN(tin: string): boolean {
  return tinRegex.test(tin);
}

/**
 * Validates a recipient TIN/SSN format
 * @param tin - The TIN/SSN to validate
 * @returns true if valid, false otherwise
 */
export function isValidRecipientTIN(tin: string): boolean {
  return ssnRegex.test(tin);
}

/**
 * Validates a currency amount format
 * @param amount - The amount to validate
 * @returns true if valid, false otherwise
 */
export function isValidCurrency(amount: string): boolean {
  return currencyRegex.test(amount);
}

/**
 * Validates a calendar year format
 * @param year - The year to validate
 * @returns true if valid, false otherwise
 */
export function isValidYear(year: string): boolean {
  return yearRegex.test(year);
}

/**
 * Validates a state code format
 * @param state - The state code to validate
 * @returns true if valid, false otherwise
 */
export function isValidStateCode(state: string): boolean {
  return stateRegex.test(state);
}

/**
 * Formats a TIN by adding hyphens if not present
 * @param tin - The TIN to format
 * @param type - 'payer' for EIN format or 'recipient' for SSN format
 * @returns Formatted TIN with hyphens
 */
export function formatTIN(tin: string, type: 'payer' | 'recipient'): string {
  // Remove any existing hyphens
  const digitsOnly = tin.replace(/-/g, '');
  
  if (type === 'payer' && digitsOnly.length === 9) {
    // Format as XX-XXXXXXX
    return `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2)}`;
  } else if (type === 'recipient' && digitsOnly.length === 9) {
    // Format as XXX-XX-XXXX
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 5)}-${digitsOnly.slice(5)}`;
  }
  
  // Return original if invalid length
  return tin;
}

/**
 * Formats a currency amount to 2 decimal places
 * @param amount - The amount to format
 * @returns Formatted amount string
 */
export function formatCurrency(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return num.toFixed(2);
}
