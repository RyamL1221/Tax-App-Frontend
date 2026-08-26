/**
 * Unit tests for DocumentService
 * 
 * Tests document generation with validation for:
 * - Valid form data
 * - Missing required fields
 * - Invalid TIN formats
 * - Invalid state codes
 * - Invalid monetary values
 * - Authentication header inclusion
 */

import { DocumentService } from '../documentService';
import { ApiClient } from '../apiClient';
import { GenerateDocumentRequest, GenerateDocumentResponse, Form1099DivData } from '../types';

// Mock the ApiClient
jest.mock('../apiClient');

describe('DocumentService', () => {
  let documentService: DocumentService;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    // Create a mock ApiClient instance
    mockApiClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      addRequestInterceptor: jest.fn(),
      addResponseInterceptor: jest.fn()
    } as any;

    documentService = new DocumentService(mockApiClient);
  });

  describe('generateDocument', () => {
    const validFormData: Form1099DivData = {
      calendarYear: '2023',
      payerName: 'Test Payer Inc',
      payerTIN: '12-3456789',
      recipientName: 'John Doe',
      recipientTIN: '123-45-6789',
      totalOrdinaryDividends: '1000.00'
    };

    const mockResponse: GenerateDocumentResponse = {
      jobId: 'job-123',
      status: 'pending',
      documentType: '1099-DIV',
      templateKey: 'template-key',
      outputKey: 'output-key'
    };

    it('should generate document with valid form data', async () => {
      mockApiClient.post.mockResolvedValue(mockResponse);

      const request: GenerateDocumentRequest = {
        documentType: '1099-DIV',
        formData: validFormData
      };

      const result = await documentService.generateDocument(request);

      // Expect monetary values to be converted to numbers
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/documents/generate',
        {
          documentType: '1099-DIV',
          formData: {
            ...validFormData,
            totalOrdinaryDividends: 1000.00
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should accept EIN format for payer TIN', async () => {
      mockApiClient.post.mockResolvedValue(mockResponse);

      const request: GenerateDocumentRequest = {
        documentType: '1099-DIV',
        formData: {
          ...validFormData,
          payerTIN: '12-3456789' // EIN format
        }
      };

      await documentService.generateDocument(request);

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should accept SSN format for payer TIN', async () => {
      mockApiClient.post.mockResolvedValue(mockResponse);

      const request: GenerateDocumentRequest = {
        documentType: '1099-DIV',
        formData: {
          ...validFormData,
          payerTIN: '123-45-6789' // SSN format
        }
      };

      await documentService.generateDocument(request);

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should accept EIN format for recipient TIN', async () => {
      mockApiClient.post.mockResolvedValue(mockResponse);

      const request: GenerateDocumentRequest = {
        documentType: '1099-DIV',
        formData: {
          ...validFormData,
          recipientTIN: '98-7654321' // EIN format
        }
      };

      await documentService.generateDocument(request);

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should accept SSN format for recipient TIN', async () => {
      mockApiClient.post.mockResolvedValue(mockResponse);

      const request: GenerateDocumentRequest = {
        documentType: '1099-DIV',
        formData: {
          ...validFormData,
          recipientTIN: '987-65-4321' // SSN format
        }
      };

      await documentService.generateDocument(request);

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('should generate document with optional fields', async () => {
      mockApiClient.post.mockResolvedValue(mockResponse);

      const formDataWithOptionals: Form1099DivData = {
        ...validFormData,
        payerAddress: '123 Main St',
        payerCity: 'New York',
        payerState: 'NY',
        payerZip: '10001',
        qualifiedDividends: '500.00',
        federalIncomeTaxWithheld: '100.00'
      };

      const request: GenerateDocumentRequest = {
        documentType: '1099-DIV',
        formData: formDataWithOptionals
      };

      await documentService.generateDocument(request);

      // Expect monetary values to be converted to numbers
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/documents/generate',
        {
          documentType: '1099-DIV',
          formData: {
            ...formDataWithOptionals,
            totalOrdinaryDividends: 1000.00,
            qualifiedDividends: 500.00,
            federalIncomeTaxWithheld: 100.00
          }
        }
      );
    });

    describe('validation errors', () => {
      it('should throw error when calendarYear is missing', async () => {
        const invalidData = { ...validFormData };
        delete (invalidData as any).calendarYear;

        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: invalidData
        };

        await expect(documentService.generateDocument(request)).rejects.toEqual({
          status: 400,
          message: 'Missing required field: calendarYear'
        });

        expect(mockApiClient.post).not.toHaveBeenCalled();
      });

      it('should throw error when payerName is missing', async () => {
        const invalidData = { ...validFormData };
        delete (invalidData as any).payerName;

        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: invalidData
        };

        await expect(documentService.generateDocument(request)).rejects.toEqual({
          status: 400,
          message: 'Missing required field: payerName'
        });
      });

      it('should throw error when payerTIN is missing', async () => {
        const invalidData = { ...validFormData };
        delete (invalidData as any).payerTIN;

        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: invalidData
        };

        await expect(documentService.generateDocument(request)).rejects.toEqual({
          status: 400,
          message: 'Missing required field: payerTIN'
        });
      });

      it('should throw error when recipientName is missing', async () => {
        const invalidData = { ...validFormData };
        delete (invalidData as any).recipientName;

        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: invalidData
        };

        await expect(documentService.generateDocument(request)).rejects.toEqual({
          status: 400,
          message: 'Missing required field: recipientName'
        });
      });

      it('should throw error when recipientTIN is missing', async () => {
        const invalidData = { ...validFormData };
        delete (invalidData as any).recipientTIN;

        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: invalidData
        };

        await expect(documentService.generateDocument(request)).rejects.toEqual({
          status: 400,
          message: 'Missing required field: recipientTIN'
        });
      });

      it('should throw error when totalOrdinaryDividends is missing', async () => {
        const invalidData = { ...validFormData };
        delete (invalidData as any).totalOrdinaryDividends;

        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: invalidData
        };

        await expect(documentService.generateDocument(request)).rejects.toEqual({
          status: 400,
          message: 'Missing required field: totalOrdinaryDividends'
        });
      });

      it('should throw error for invalid calendar year format', async () => {
        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: {
            ...validFormData,
            calendarYear: '23' // Invalid: not 4 digits
          }
        };

        await expect(documentService.generateDocument(request)).rejects.toMatchObject({
          status: 400,
          message: expect.stringContaining('Invalid calendarYear')
        });
      });

      it('should throw error for calendar year out of range', async () => {
        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: {
            ...validFormData,
            calendarYear: '1899' // Out of range
          }
        };

        await expect(documentService.generateDocument(request)).rejects.toMatchObject({
          status: 400,
          message: expect.stringContaining('Invalid calendarYear')
        });
      });

      it('should throw error for invalid payer TIN format', async () => {
        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: {
            ...validFormData,
            payerTIN: '123456789' // Missing dashes
          }
        };

        await expect(documentService.generateDocument(request)).rejects.toEqual({
          status: 400,
          message: 'Invalid payerTIN format. Expected EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX)'
        });
      });

      it('should throw error for invalid recipient TIN format', async () => {
        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: {
            ...validFormData,
            recipientTIN: '12-34-5678' // Wrong format
          }
        };

        await expect(documentService.generateDocument(request)).rejects.toEqual({
          status: 400,
          message: 'Invalid recipientTIN format. Expected EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX)'
        });
      });

      it('should throw error for invalid totalOrdinaryDividends format', async () => {
        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: {
            ...validFormData,
            totalOrdinaryDividends: '1000.0' // Only 1 decimal place
          }
        };

        await expect(documentService.generateDocument(request)).rejects.toMatchObject({
          status: 400,
          message: expect.stringContaining('Invalid totalOrdinaryDividends')
        });
      });

      it('should throw error for invalid payer state code', async () => {
        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: {
            ...validFormData,
            payerState: 'New York' // Should be 2 letters
          }
        };

        await expect(documentService.generateDocument(request)).rejects.toMatchObject({
          status: 400,
          message: expect.stringContaining('Invalid payerState')
        });
      });

      it('should throw error for invalid recipient state code', async () => {
        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: {
            ...validFormData,
            recipientState: 'ca' // Should be uppercase
          }
        };

        await expect(documentService.generateDocument(request)).rejects.toMatchObject({
          status: 400,
          message: expect.stringContaining('Invalid recipientState')
        });
      });

      it('should throw error for invalid optional monetary value', async () => {
        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: {
            ...validFormData,
            qualifiedDividends: '500' // Missing decimal places
          }
        };

        await expect(documentService.generateDocument(request)).rejects.toMatchObject({
          status: 400,
          message: expect.stringContaining('Invalid qualifiedDividends')
        });
      });

      it('should throw error for invalid federalIncomeTaxWithheld', async () => {
        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: {
            ...validFormData,
            federalIncomeTaxWithheld: '100.123' // Too many decimal places
          }
        };

        await expect(documentService.generateDocument(request)).rejects.toMatchObject({
          status: 400,
          message: expect.stringContaining('Invalid federalIncomeTaxWithheld')
        });
      });
    });

    describe('edge cases', () => {
      it('should allow empty string for optional monetary fields', async () => {
        mockApiClient.post.mockResolvedValue(mockResponse);

        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: {
            ...validFormData,
            qualifiedDividends: '' // Empty string should be allowed
          }
        };

        await documentService.generateDocument(request);

        expect(mockApiClient.post).toHaveBeenCalled();
      });

      it('should allow undefined for optional monetary fields', async () => {
        mockApiClient.post.mockResolvedValue(mockResponse);

        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: {
            ...validFormData,
            qualifiedDividends: undefined // Undefined should be allowed
          }
        };

        await documentService.generateDocument(request);

        expect(mockApiClient.post).toHaveBeenCalled();
      });

      it('should validate all optional monetary fields', async () => {
        mockApiClient.post.mockResolvedValue(mockResponse);

        const formDataWithAllMonetary: Form1099DivData = {
          ...validFormData,
          qualifiedDividends: '100.00',
          totalCapitalGainDistributions: '200.00',
          unrecapturedSection1250Gain: '50.00',
          section1202Gain: '75.00',
          collectibles28Gain: '25.00',
          section897OrdinaryDividends: '10.00',
          section897CapitalGain: '15.00',
          nondividendDistributions: '30.00',
          federalIncomeTaxWithheld: '150.00',
          section199ADividends: '80.00',
          investmentExpenses: '20.00',
          foreignTaxPaid: '40.00',
          cashLiquidationDistributions: '500.00',
          noncashLiquidationDistributions: '300.00',
          exemptInterestDividends: '60.00',
          specifiedPrivateActivityBondInterest: '35.00',
          stateTaxWithheld: '90.00'
        };

        const request: GenerateDocumentRequest = {
          documentType: '1099-DIV',
          formData: formDataWithAllMonetary
        };

        await documentService.generateDocument(request);

        // Expect all monetary values to be converted to numbers
        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/documents/generate',
          {
            documentType: '1099-DIV',
            formData: {
              ...formDataWithAllMonetary,
              totalOrdinaryDividends: 1000.00,
              qualifiedDividends: 100.00,
              totalCapitalGainDistributions: 200.00,
              unrecapturedSection1250Gain: 50.00,
              section1202Gain: 75.00,
              collectibles28Gain: 25.00,
              section897OrdinaryDividends: 10.00,
              section897CapitalGain: 15.00,
              nondividendDistributions: 30.00,
              federalIncomeTaxWithheld: 150.00,
              section199ADividends: 80.00,
              investmentExpenses: 20.00,
              foreignTaxPaid: 40.00,
              cashLiquidationDistributions: 500.00,
              noncashLiquidationDistributions: 300.00,
              exemptInterestDividends: 60.00,
              specifiedPrivateActivityBondInterest: 35.00,
              stateTaxWithheld: 90.00
            }
          }
        );
      });
    });
  });

  describe('downloadDocument', () => {
    const mockJobId = '550e8400-e29b-41d4-a716-446655440000';
    const mockBlobUrl = 'blob:http://localhost:3000/mock-pdf';
    const mockToken = 'mock-jwt-token';

    beforeEach(() => {
      // Set the backend API URL for direct calls
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

      // Mock fetch globally
      global.fetch = jest.fn();
      
      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => mockBlobUrl);
      
      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => mockToken),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn()
        },
        writable: true
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should download PDF with authentication via direct backend URL', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: jest.fn((name: string) => {
            if (name === 'Content-Type') return 'application/pdf';
            if (name === 'Content-Length') return '1024';
            return null;
          })
        },
        blob: jest.fn().mockResolvedValue(mockBlob)
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await documentService.downloadDocument(mockJobId);

      // Should call fetch with direct backend URL and auth headers
      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/download/${mockJobId}`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Accept': 'application/pdf'
          }
        })
      );

      // Should create blob URL
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(result).toBe(mockBlobUrl);
    });

    it('should throw error when token is missing', async () => {
      // Mock localStorage to return null
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn()
        },
        writable: true
      });

      await expect(documentService.downloadDocument(mockJobId)).rejects.toEqual({
        status: 401,
        message: 'Authentication required. Please log in again.'
      });

      // Should not call fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle download errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: {
          get: jest.fn((name: string) => {
            if (name === 'Content-Type') return 'application/json';
            return null;
          })
        },
        text: jest.fn().mockResolvedValue(JSON.stringify({ error: 'Unauthorized' }))
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(documentService.downloadDocument(mockJobId)).rejects.toEqual({
        status: 401,
        message: 'Unauthorized'
      });
    });

    it('should handle network errors', async () => {
      const networkError = new TypeError('Failed to fetch');
      (global.fetch as jest.Mock).mockRejectedValue(networkError);

      await expect(documentService.downloadDocument(mockJobId)).rejects.toEqual({
        status: 0,
        message: 'Unable to download PDF. Please check your network connection and try again.'
      });
    });
  });
});
