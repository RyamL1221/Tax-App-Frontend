/**
 * DocumentService - Document Generation API methods
 * 
 * This service provides type-safe methods for document generation operations including:
 * - 1099-DIV form generation with comprehensive validation
 * 
 * All methods perform client-side validation before making API calls.
 * All document generation requests require authentication (JWT token).
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { ApiClient } from './apiClient';
import { Validators } from './validators';
import {
  GenerateDocumentRequest,
  GenerateDocumentResponse,
  Form1099DivData
} from './types';

/**
 * DocumentService class provides document generation API methods
 */
export class DocumentService {
  private apiClient: ApiClient;

  /**
   * Creates a new DocumentService instance
   * 
   * @param apiClient - The API client instance for making HTTP requests
   */
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Generate a tax document (currently supports 1099-DIV)
   * 
   * Validates all required fields and formats before making the API call.
   * Requires authentication - JWT token must be stored via TokenManager.
   * 
   * Validation performed:
   * - All required fields must be present
   * - TIN formats must match EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX)
   * - State codes must be 2 uppercase letters (if provided)
   * - Monetary values must have exactly 2 decimal places
   * - Calendar year must be a 4-digit number between 1900 and 2100
   * 
   * @param request - Document generation request with documentType and formData
   * @returns Promise resolving to GenerateDocumentResponse with job information
   * @throws ApiError if validation fails or API request fails
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
   */
  async generateDocument(request: GenerateDocumentRequest): Promise<GenerateDocumentResponse> {
    const { documentType, formData } = request;

    // Currently only 1099-DIV is supported
    if (documentType === '1099-DIV') {
      this.validate1099DivData(formData);
    }

    // Make API request (requires authentication)
    return this.apiClient.post<GenerateDocumentResponse>(
      '/documents/generate',
      {
        documentType,
        formData
      }
    );
  }

  /**
   * Validates 1099-DIV form data
   * 
   * Checks all required fields and validates formats for:
   * - Calendar year
   * - Payer and recipient names
   * - Payer and recipient TINs
   * - Total ordinary dividends
   * - Optional state codes
   * - Optional monetary values
   * 
   * @param formData - The 1099-DIV form data to validate
   * @throws ApiError with status 400 if validation fails
   * 
   * Requirements: 4.3
   */
  private validate1099DivData(formData: Form1099DivData): void {
    // Validate required fields are present
    const requiredFields: (keyof Form1099DivData)[] = [
      'calendarYear',
      'payerName',
      'payerTIN',
      'recipientName',
      'recipientTIN',
      'totalOrdinaryDividends'
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        throw {
          status: 400,
          message: `Missing required field: ${field}`
        };
      }
    }

    // Validate calendar year
    const yearValidation = Validators.validateCalendarYear(formData.calendarYear);
    if (!yearValidation.isValid) {
      throw {
        status: 400,
        message: `Invalid calendarYear: ${yearValidation.error}`
      };
    }

    // Validate payer TIN format
    // Try EIN format first, then SSN format
    const payerEinValidation = Validators.validateTIN(formData.payerTIN, 'EIN');
    const payerSsnValidation = Validators.validateTIN(formData.payerTIN, 'SSN');
    
    if (!payerEinValidation.isValid && !payerSsnValidation.isValid) {
      throw {
        status: 400,
        message: 'Invalid payerTIN format. Expected EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX)'
      };
    }

    // Validate recipient TIN format
    // Try EIN format first, then SSN format
    const recipientEinValidation = Validators.validateTIN(formData.recipientTIN, 'EIN');
    const recipientSsnValidation = Validators.validateTIN(formData.recipientTIN, 'SSN');
    
    if (!recipientEinValidation.isValid && !recipientSsnValidation.isValid) {
      throw {
        status: 400,
        message: 'Invalid recipientTIN format. Expected EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX)'
      };
    }

    // Validate total ordinary dividends (required monetary field)
    const dividendsValidation = Validators.validateMonetaryValue(formData.totalOrdinaryDividends);
    if (!dividendsValidation.isValid) {
      throw {
        status: 400,
        message: `Invalid totalOrdinaryDividends: ${dividendsValidation.error}`
      };
    }

    // Validate optional state codes
    if (formData.payerState) {
      const payerStateValidation = Validators.validateStateCode(formData.payerState);
      if (!payerStateValidation.isValid) {
        throw {
          status: 400,
          message: `Invalid payerState: ${payerStateValidation.error}`
        };
      }
    }

    if (formData.recipientState) {
      const recipientStateValidation = Validators.validateStateCode(formData.recipientState);
      if (!recipientStateValidation.isValid) {
        throw {
          status: 400,
          message: `Invalid recipientState: ${recipientStateValidation.error}`
        };
      }
    }

    // Validate optional monetary values
    const optionalMonetaryFields: (keyof Form1099DivData)[] = [
      'qualifiedDividends',
      'totalCapitalGain',
      'unrecaptured1250Gain',
      'section1202Gain',
      'collectiblesGain',
      'section897OrdinaryDividends',
      'section897CapitalGain',
      'nondividendDistributions',
      'federalIncomeTaxWithheld',
      'section199ADividends',
      'investmentExpenses',
      'foreignTaxPaid',
      'cashLiquidationDistributions',
      'noncashLiquidationDistributions',
      'exemptInterestDividends',
      'specifiedPABInterestDividends',
      'stateTaxWithheld'
    ];

    for (const field of optionalMonetaryFields) {
      const value = formData[field];
      if (value !== undefined && value !== '') {
        const validation = Validators.validateMonetaryValue(value as string);
        if (!validation.isValid) {
          throw {
            status: 400,
            message: `Invalid ${field}: ${validation.error}`
          };
        }
      }
    }
  }
}
