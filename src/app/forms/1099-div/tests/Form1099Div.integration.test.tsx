/**
 * Integration Tests for 1099-DIV Form Submission - Complete Workflow
 * 
 * These tests verify the complete user workflow from data entry through
 * preview to approval. They test the integration between all components
 * and the API service.
 * 
 * Test Scenarios:
 * - User enters valid data and submits
 * - Preview is displayed with correct information
 * - User can edit and resubmit
 * - User can approve and form resets
 * 
 * Requirements: All (comprehensive integration test)
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Form1099DivClient from '../Form1099DivClient';
import { documentService } from '@/lib/api';
import type { GenerateDocumentResponse } from '@/lib/api';

// Mock the document service
jest.mock('@/lib/api', () => ({
  documentService: {
    generateDocument: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock token manager
jest.mock('@/lib/api/tokenManager', () => ({
  getToken: () => 'test-jwt-token',
}));

describe('1099-DIV Form Submission - Complete Workflow Integration', () => {
  const mockToken = 'test-jwt-token';
  
  const mockDocumentResponse: GenerateDocumentResponse = {
    jobId: 'test-job-12345',
    status: 'COMPLETED',
    documentType: '1099-DIV',
    templateKey: 'templates/1099-DIV.pdf',
    outputKey: 'outputs/1099-DIV-test-job-12345.pdf',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for successful API calls
    (documentService.generateDocument as jest.Mock).mockResolvedValue(mockDocumentResponse);
  });

  describe('Complete Workflow: Enter Data → Preview → Approve', () => {
    it('should complete the full workflow from data entry to approval', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // Step 1: Verify form is displayed in input mode
      expect(screen.getByRole('heading', { name: /Calendar Year/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate Preview/i })).toBeInTheDocument();

      // Step 2: Fill in required fields
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');

      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corporation');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Step 3: Submit the form
      const submitButton = screen.getByRole('button', { name: /Generate Preview/i });
      await user.click(submitButton);

      // Step 4: Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/Generating Preview/i)).toBeInTheDocument();
      });

      // Step 5: Verify API was called with correct data
      await waitFor(() => {
        expect(documentService.generateDocument).toHaveBeenCalledWith({
          documentType: '1099-DIV',
          formData: expect.objectContaining({
            calendarYear: '2024',
            payerName: 'Test Corporation',
            payerTIN: '12-3456789',
            recipientName: 'John Doe',
            recipientTIN: '123-45-6789',
            totalOrdinaryDividends: '1000.00',
          }),
        });
      });

      // Step 6: Verify preview is displayed with correct information
      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });

      expect(screen.getByText('test-job-12345')).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /Status: Completed/i })).toBeInTheDocument();
      expect(screen.getByText('1099-DIV')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Download PDF/i })).toBeInTheDocument();

      // Step 7: Verify action buttons are present
      expect(screen.getByRole('button', { name: /Edit Form/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();

      // Step 8: Click approve button
      const approveButton = screen.getByRole('button', { name: /Approve/i });
      await user.click(approveButton);

      // Step 9: Verify success message is displayed
      await waitFor(() => {
        expect(screen.getByText(/Form Approved Successfully!/i)).toBeInTheDocument();
      });

      // Step 10: Wait for form to reset (after 2 second timeout)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Calendar Year/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Generate Preview/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      // Step 11: Verify form is cleared (inputs should be empty or default values)
      const resetCalendarYearInput = screen.getByLabelText(/Tax Year/i) as HTMLInputElement;
      // Calendar year defaults to current year
      expect(resetCalendarYearInput.value).toBe(new Date().getFullYear().toString());
    });
  });

  describe('Complete Workflow: Enter Data → Preview → Edit → Resubmit → Approve', () => {
    it('should allow editing and resubmitting with modified data', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // Step 1: Fill in initial data
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Initial Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'Jane Smith');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '987-65-4321');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '500.00');

      // Step 2: Submit the form
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Step 3: Wait for preview to appear
      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });

      // Step 4: Click edit button
      const editButton = screen.getByRole('button', { name: /Edit Form/i });
      await user.click(editButton);

      // Step 5: Verify form is displayed again with preserved data
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Calendar Year/i })).toBeInTheDocument();
      });

      const payerNameInput = screen.getByLabelText(/Payer Name/i) as HTMLInputElement;
      expect(payerNameInput.value).toBe('Initial Corp');

      const totalDividendsInput = screen.getByLabelText(/Total Ordinary Dividends/i) as HTMLInputElement;
      expect(totalDividendsInput.value).toBe('500.00');

      // Step 6: Modify the data
      await user.clear(screen.getByLabelText(/Payer Name/i));
      await user.type(screen.getByLabelText(/Payer Name/i), 'Modified Corp');

      await user.clear(screen.getByLabelText(/Total Ordinary Dividends/i));
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '2000.00');

      // Step 7: Resubmit the form
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Step 8: Verify API was called with modified data
      await waitFor(() => {
        expect(documentService.generateDocument).toHaveBeenCalledWith({
          documentType: '1099-DIV',
          formData: expect.objectContaining({
            payerName: 'Modified Corp',
            totalOrdinaryDividends: '2000.00',
          }),
        });
      });

      // Step 9: Verify preview is displayed again
      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });

      // Step 10: Approve the modified form
      await user.click(screen.getByRole('button', { name: /Approve/i }));

      // Step 11: Verify success message
      await waitFor(() => {
        expect(screen.getByText(/Form Approved Successfully!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Complete Workflow: Multiple Edit Cycles', () => {
    it('should support multiple edit-preview cycles before approval', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in initial data
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'First Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'Test User');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '111-22-3333');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '100.00');

      // First submission
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));
      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });

      // First edit
      await user.click(screen.getByRole('button', { name: /Edit Form/i }));
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Calendar Year/i })).toBeInTheDocument();
      });

      await user.clear(screen.getByLabelText(/Payer Name/i));
      await user.type(screen.getByLabelText(/Payer Name/i), 'Second Corp');

      // Second submission
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));
      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });

      // Second edit
      await user.click(screen.getByRole('button', { name: /Edit Form/i }));
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Calendar Year/i })).toBeInTheDocument();
      });

      await user.clear(screen.getByLabelText(/Payer Name/i));
      await user.type(screen.getByLabelText(/Payer Name/i), 'Final Corp');

      // Final submission
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));
      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });

      // Verify API was called 3 times
      expect(documentService.generateDocument).toHaveBeenCalledTimes(3);

      // Approve
      await user.click(screen.getByRole('button', { name: /Approve/i }));
      await waitFor(() => {
        expect(screen.getByText(/Form Approved Successfully!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Complete Workflow: Optional Fields', () => {
    it('should handle forms with optional fields filled', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in required fields
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Fill in optional fields
      await user.type(screen.getByLabelText(/Qualified Dividends/i), '800.00');
      await user.type(screen.getByLabelText(/Federal Income Tax Withheld/i), '150.00');
      
      // Fill in payer address
      const payerStreetInput = screen.getByLabelText(/Street Address/i, { selector: '#payerStreetAddress' });
      await user.type(payerStreetInput, '123 Main St');

      // Submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify API was called with optional fields
      await waitFor(() => {
        expect(documentService.generateDocument).toHaveBeenCalledWith({
          documentType: '1099-DIV',
          formData: expect.objectContaining({
            qualifiedDividends: '800.00',
            federalIncomeTaxWithheld: '150.00',
            payerStreetAddress: '123 Main St',
          }),
        });
      });

      // Verify preview
      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });
    });
  });

  describe('Complete Workflow: Checkbox Fields', () => {
    it('should handle checkbox fields correctly', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in required fields
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Check the "Corrected" checkbox
      const correctedCheckbox = screen.getByLabelText(/Corrected/i);
      await user.click(correctedCheckbox);

      // Submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify API was called with checkbox value
      await waitFor(() => {
        expect(documentService.generateDocument).toHaveBeenCalledWith({
          documentType: '1099-DIV',
          formData: expect.objectContaining({
            corrected: true,
          }),
        });
      });

      // Verify preview
      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });

      // Edit and uncheck
      await user.click(screen.getByRole('button', { name: /Edit Form/i }));
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Calendar Year/i })).toBeInTheDocument();
      });

      const correctedCheckboxAfterEdit = screen.getByLabelText(/Corrected/i) as HTMLInputElement;
      expect(correctedCheckboxAfterEdit.checked).toBe(true);

      await user.click(correctedCheckboxAfterEdit);

      // Resubmit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify checkbox is now false
      await waitFor(() => {
        expect(documentService.generateDocument).toHaveBeenLastCalledWith({
          documentType: '1099-DIV',
          formData: expect.objectContaining({
            corrected: false,
          }),
        });
      });
    });
  });

  describe('Complete Workflow: Data Persistence', () => {
    it('should preserve all form data when editing from preview', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in comprehensive data
      const formData = {
        calendarYear: '2024',
        payerName: 'Comprehensive Corp',
        payerTIN: '12-3456789',
        payerStreetAddress: '456 Business Ave',
        payerCity: 'New York',
        payerState: 'NY',
        payerZip: '10001',
        recipientName: 'Alice Johnson',
        recipientTIN: '555-66-7777',
        recipientStreetAddress: '789 Home St',
        recipientCity: 'Los Angeles',
        recipientState: 'CA',
        recipientZip: '90001',
        totalOrdinaryDividends: '5000.00',
        qualifiedDividends: '4000.00',
        federalIncomeTaxWithheld: '750.00',
      };

      // Fill all fields
      await user.type(screen.getByLabelText(/Tax Year/i), formData.calendarYear);
      await user.type(screen.getByLabelText(/Payer Name/i), formData.payerName);
      await user.type(screen.getByLabelText(/Payer TIN/i), formData.payerTIN);
      
      const payerStreetInput = screen.getByLabelText(/Street Address/i, { selector: '#payerStreetAddress' });
      await user.type(payerStreetInput, formData.payerStreetAddress);
      
      const payerCityInput = screen.getByLabelText(/City/i, { selector: '#payerCity' });
      await user.type(payerCityInput, formData.payerCity);
      
      const payerStateInput = screen.getByLabelText(/State/i, { selector: '#payerState' });
      await user.type(payerStateInput, formData.payerState);
      
      const payerZipInput = screen.getByLabelText(/ZIP Code/i, { selector: '#payerZip' });
      await user.type(payerZipInput, formData.payerZip);

      await user.type(screen.getByLabelText(/Recipient Name/i), formData.recipientName);
      await user.type(screen.getByLabelText(/Recipient TIN/i), formData.recipientTIN);
      
      const recipientStreetInput = screen.getByLabelText(/Street Address/i, { selector: '#recipientStreetAddress' });
      await user.type(recipientStreetInput, formData.recipientStreetAddress);
      
      const recipientCityInput = screen.getByLabelText(/City/i, { selector: '#recipientCity' });
      await user.type(recipientCityInput, formData.recipientCity);
      
      const recipientStateInput = screen.getByLabelText(/State/i, { selector: '#recipientState' });
      await user.type(recipientStateInput, formData.recipientState);
      
      const recipientZipInput = screen.getByLabelText(/ZIP Code/i, { selector: '#recipientZip' });
      await user.type(recipientZipInput, formData.recipientZip);

      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), formData.totalOrdinaryDividends);
      await user.type(screen.getByLabelText(/Qualified Dividends/i), formData.qualifiedDividends);
      await user.type(screen.getByLabelText(/Federal Income Tax Withheld/i), formData.federalIncomeTaxWithheld);

      // Submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Wait for preview
      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });

      // Edit
      await user.click(screen.getByRole('button', { name: /Edit Form/i }));

      // Verify all data is preserved
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Calendar Year/i })).toBeInTheDocument();
      });

      expect((screen.getByLabelText(/Tax Year/i) as HTMLInputElement).value).toBe(formData.calendarYear);
      expect((screen.getByLabelText(/Payer Name/i) as HTMLInputElement).value).toBe(formData.payerName);
      expect((screen.getByLabelText(/Payer TIN/i) as HTMLInputElement).value).toBe(formData.payerTIN);
      expect((screen.getByLabelText(/Recipient Name/i) as HTMLInputElement).value).toBe(formData.recipientName);
      expect((screen.getByLabelText(/Recipient TIN/i) as HTMLInputElement).value).toBe(formData.recipientTIN);
      expect((screen.getByLabelText(/Total Ordinary Dividends/i) as HTMLInputElement).value).toBe(formData.totalOrdinaryDividends);
      expect((screen.getByLabelText(/Qualified Dividends/i) as HTMLInputElement).value).toBe(formData.qualifiedDividends);
      expect((screen.getByLabelText(/Federal Income Tax Withheld/i) as HTMLInputElement).value).toBe(formData.federalIncomeTaxWithheld);
    });
  });

  describe('Complete Workflow: Form Reset After Approval', () => {
    it('should completely reset form after approval for new submission', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // First submission
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'First Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'First User');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '111-11-1111');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });

      // Approve
      await user.click(screen.getByRole('button', { name: /Approve/i }));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/Form Approved Successfully!/i)).toBeInTheDocument();
      });

      // Fast-forward time to trigger form reset
      jest.advanceTimersByTime(2000);

      // Verify form is reset
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Calendar Year/i })).toBeInTheDocument();
      });

      // Verify all fields are empty
      expect((screen.getByLabelText(/Tax Year/i) as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText(/Payer Name/i) as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText(/Payer TIN/i) as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText(/Recipient Name/i) as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText(/Recipient TIN/i) as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText(/Total Ordinary Dividends/i) as HTMLInputElement).value).toBe('');

      // Second submission with different data
      await user.type(screen.getByLabelText(/Tax Year/i), '2025');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Second Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '98-7654321');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'Second User');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '999-99-9999');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '2000.00');

      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify second submission works
      await waitFor(() => {
        expect(documentService.generateDocument).toHaveBeenCalledWith({
          documentType: '1099-DIV',
          formData: expect.objectContaining({
            calendarYear: '2025',
            payerName: 'Second Corp',
            totalOrdinaryDividends: '2000.00',
          }),
        });
      });

      jest.useRealTimers();
    });
  });
});
