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
import { decodePdfResponse } from './pdfUtils';

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
   * Note: Backend expects monetary values as numbers (floats), not strings.
   * This method converts string monetary values to numbers before sending.
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

    // Convert monetary string values to numbers for backend compatibility
    // Backend expects numbers despite documentation stating strings
    const transformedFormData = this.transformMonetaryValues(formData);

    // Make API request (requires authentication)
    return this.apiClient.post<GenerateDocumentResponse>(
      '/documents/generate',
      {
        documentType,
        formData: transformedFormData
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
      'totalCapitalGainDistributions',
      'unrecapturedSection1250Gain',
      'section1202Gain',
      'collectibles28Gain',
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
      'specifiedPrivateActivityBondInterest',
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

  /**
   * Transforms monetary string values to numbers for backend compatibility
   * 
   * The backend expects monetary values as numbers (floats), not strings,
   * despite the API documentation stating they should be strings.
   * This method converts all monetary string fields to numbers.
   * 
   * @param formData - The 1099-DIV form data with string monetary values
   * @returns Form data with monetary values converted to numbers
   * 
   * Requirements: Backend compatibility
   */
  private transformMonetaryValues(formData: Form1099DivData): any {
    // Create a copy to avoid mutating the original
    const transformed: any = { ...formData };

    // List of all monetary fields that need conversion
    const monetaryFields = [
      'totalOrdinaryDividends',
      'qualifiedDividends',
      'totalCapitalGainDistributions',
      'unrecapturedSection1250Gain',
      'section1202Gain',
      'collectibles28Gain',
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
      'specifiedPrivateActivityBondInterest',
      'stateTaxWithheld',
      'stateTaxWithheld2'  // Second state tax field
    ];

    // Convert each monetary field from string to number
    // Remove empty strings to prevent backend validation errors
    for (const field of monetaryFields) {
      const value = transformed[field];
      if (value === '' || value === null) {
        // Remove empty/null values - backend doesn't accept them
        delete transformed[field];
      } else if (value !== undefined) {
        // Convert string to number (parseFloat handles decimal values)
        transformed[field] = parseFloat(value);
      }
    }

    return transformed;
  }

  /**
   * Downloads a generated PDF document with authentication
   * 
   * Fetches the PDF from the backend using the jobId and JWT token.
   * Fetches directly from the backend API.
   * Returns a blob URL that can be used to display the PDF in an iframe
   * or trigger a download.
   * 
   * Timeout Behavior:
   * - Client timeout: 35 seconds
   * - If the entire request takes longer than 35 seconds, client aborts with 504
   * 
   * Error Handling:
   * - 401: Missing or invalid authentication token
   * - 504: Request timeout (backend or network took too long)
   * - Other status codes: Forwarded from backend
   * 
   * @param jobId - The job ID for the generated document (UUID)
   * @returns Promise resolving to a blob URL for the PDF
   * @throws ApiError if the request fails
   * 
   * Requirements: 5.1, 5.2
   */
  async downloadDocument(jobId: string): Promise<string> {
    console.log('[DocumentService] Starting PDF download', { 
      jobId,
      timestamp: new Date().toISOString()
    });

    // Fetch directly from the backend API
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL}/documents/download/${jobId}`;

    // Get the JWT token from storage
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;

    // Check if token exists
    if (!token) {
      console.error('[DocumentService] No JWT token found in localStorage');
      throw {
        status: 401,
        message: 'Authentication required. Please log in again.'
      };
    }
    
    console.log('[DocumentService] JWT token found, length:', token.length);

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 second timeout

      console.log('[DocumentService] Fetching PDF', { 
        downloadUrl,
        hasAuthHeader: true,
        timeout: '35s'
      });

      try {
        // Fetch the PDF with authentication
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('[DocumentService] Download response received', {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('Content-Type'),
          contentLength: response.headers.get('Content-Length')
        });

        // Handle errors
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[DocumentService] Error response from backend', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          
          let errorMessage = 'Failed to download document';
          
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
          } catch {
            // If not JSON, use the text as message
            errorMessage = errorText || errorMessage;
          }

          throw {
            status: response.status,
            message: errorMessage
          };
        }

        // Decode base64-encoded PDF from API Gateway
        console.log('[DocumentService] Decoding PDF response');
        const blob = await decodePdfResponse(response);
        console.log('[DocumentService] Blob created', {
          size: blob.size,
          type: blob.type
        });
        
        // Create a blob URL
        const blobUrl = URL.createObjectURL(blob);
        console.log('[DocumentService] Blob URL created', { 
          blobUrl,
          blobSize: blob.size
        });
        
        return blobUrl;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('[DocumentService] Request timeout after 35 seconds');
          throw {
            status: 504,
            message: 'Request timeout. The PDF download took too long. Please try again.'
          };
        }
        
        console.error('[DocumentService] Fetch error', {
          error: fetchError.message || fetchError,
          name: fetchError.name,
          stack: fetchError.stack
        });
        
        throw fetchError;
      }
    } catch (error: any) {
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('[DocumentService] Network error - failed to fetch');
        throw {
          status: 0,
          message: 'Unable to download PDF. Please check your network connection and try again.'
        };
      }
      
      console.error('[DocumentService] Download failed', {
        error: error.message || error,
        status: error.status,
        stack: error.stack
      });
      
      // Re-throw other errors
      throw error;
    }
  }
}
