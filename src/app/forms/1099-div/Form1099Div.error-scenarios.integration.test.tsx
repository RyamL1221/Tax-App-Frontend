/**
 * Integration Tests for 1099-DIV Form Submission - Error Scenarios
 * 
 * These tests verify error handling throughout the form submission workflow.
 * They test validation errors, API errors, authentication errors, and network errors.
 * 
 * Test Scenarios:
 * - Validation errors prevent submission
 * - API errors are handled gracefully
 * - Authentication errors redirect to login
 * - Network errors show retry option
 * 
 * Requirements: 2.1, 2.9, 3.5, 3.6, 3.7, 3.8
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Form1099DivClient from './Form1099DivClient';
import { documentService } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Mock the document service
jest.mock('@/lib/api', () => ({
  documentService: {
    generateDocument: jest.fn(),
  },
  // Re-export other exports that might be needed
  tokenManager: {
    getToken: jest.fn(() => 'test-jwt-token'),
    setToken: jest.fn(),
    clearToken: jest.fn(),
  },
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock token manager
jest.mock('@/lib/api/tokenManager', () => ({
  getToken: () => 'test-jwt-token',
}));

describe('1099-DIV Form Submission - Error Scenarios Integration', () => {
  const mockToken = 'test-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  // Helper function to fill in valid form data
  const fillValidFormData = async (user: ReturnType<typeof userEvent.setup>) => {
    const calendarYearInput = screen.getByLabelText(/Tax Year/i);
    await user.clear(calendarYearInput);
    await user.type(calendarYearInput, '2024');
    await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
    await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
    await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
    await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
    await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');
  };

  describe('Validation Errors Prevent Submission', () => {
    it('should prevent submission when required fields are missing', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // Clear the default calendar year to make it empty
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);

      // Try to submit without filling any fields
      const submitButton = screen.getByRole('button', { name: /Generate Preview/i });
      await user.click(submitButton);

      // Verify API was not called
      expect(documentService.generateDocument).not.toHaveBeenCalled();

      // Verify error messages are displayed for required fields
      await waitFor(() => {
        expect(screen.getByText(/Calendar year must be a 4-digit year/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Payer name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Payer TIN must be in format XX-XXXXXXX/i)).toBeInTheDocument();
      expect(screen.getByText(/Recipient name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Recipient TIN must be in format XXX-XX-XXXX/i)).toBeInTheDocument();
      expect(screen.getByText(/Must be a valid amount with up to 2 decimal places/i)).toBeInTheDocument();

      // Verify form is still in input mode
      expect(screen.getByRole('heading', { name: /Calendar Year/i })).toBeInTheDocument();
    });

    it('should show validation error for invalid payer TIN format', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in required fields with invalid payer TIN
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), 'invalid-tin');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Blur the payer TIN field to trigger validation
      const payerTINInput = screen.getByLabelText(/Payer TIN/i);
      await user.click(payerTINInput);
      await user.tab();

      // Try to submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/Payer TIN must be in format XX-XXXXXXX/i)).toBeInTheDocument();
      });

      // Verify API was not called
      expect(documentService.generateDocument).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid recipient TIN format', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in required fields with invalid recipient TIN
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), 'bad-ssn');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Blur the recipient TIN field
      const recipientTINInput = screen.getByLabelText(/Recipient TIN/i);
      await user.click(recipientTINInput);
      await user.tab();

      // Try to submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/Recipient TIN must be in format XXX-XX-XXXX/i)).toBeInTheDocument();
      });

      expect(documentService.generateDocument).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid currency format', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in required fields with invalid currency
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), 'not-a-number');

      // Blur the field
      const dividendsInput = screen.getByLabelText(/Total Ordinary Dividends/i);
      await user.click(dividendsInput);
      await user.tab();

      // Try to submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/Must be a valid amount with up to 2 decimal places/i)).toBeInTheDocument();
      });

      expect(documentService.generateDocument).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid year format', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in with invalid year
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '24');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Blur the year field
      const yearInput = screen.getByLabelText(/Tax Year/i);
      await user.click(yearInput);
      await user.tab();

      // Try to submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify error message
      await waitFor(() => {
        expect(screen.getByText(/Calendar year must be a 4-digit year/i)).toBeInTheDocument();
      });

      expect(documentService.generateDocument).not.toHaveBeenCalled();
    });

    it('should clear validation errors when user corrects input', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={mockToken} />);

      // Enter invalid payer TIN
      await user.type(screen.getByLabelText(/Payer TIN/i), 'invalid');
      await user.tab();

      // Verify error appears
      await waitFor(() => {
        expect(screen.getByText(/Payer TIN must be in format XX-XXXXXXX/i)).toBeInTheDocument();
      });

      // Correct the input
      const payerTINInput = screen.getByLabelText(/Payer TIN/i);
      await user.clear(payerTINInput);
      await user.type(payerTINInput, '12-3456789');
      await user.tab();

      // Verify error is cleared
      await waitFor(() => {
        expect(screen.queryByText(/Payer TIN must be in format XX-XXXXXXX/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('API Errors Are Handled Gracefully', () => {
    it('should display validation error from API (400)', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid payer TIN format';
      
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 400,
        message: errorMessage,
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in valid data
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Verify form is still in input mode
      expect(screen.getByRole('heading', { name: /Calendar Year/i })).toBeInTheDocument();

      // Verify no retry button for validation errors
      expect(screen.queryByRole('button', { name: /Retry/i })).not.toBeInTheDocument();
    });

    it('should display server error message (500)', async () => {
      const user = userEvent.setup();
      
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 500,
        message: 'Internal server error',
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in valid data
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify generic server error message
      await waitFor(() => {
        expect(screen.getByText(/Server error. Please try again later./i)).toBeInTheDocument();
      });

      // Verify retry button is available for server errors
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('should display network error message', async () => {
      const user = userEvent.setup();
      
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 0,
        message: 'Network error',
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in valid data
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify network error message
      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
      });

      // Verify retry button is available
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('should allow retry after server error', async () => {
      const user = userEvent.setup();
      
      // First call fails, second succeeds
      (documentService.generateDocument as jest.Mock)
        .mockRejectedValueOnce({
          status: 500,
          message: 'Server error',
        })
        .mockResolvedValueOnce({
          jobId: 'test-job-123',
          status: 'COMPLETED',
          documentType: '1099-DIV',
          templateKey: 'templates/1099-DIV.pdf',
          outputKey: 'outputs/1099-DIV-test.pdf',
        });

      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in valid data
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Submit (fails)
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/Server error/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /Retry/i });
      await user.click(retryButton);

      // Verify success - preview should be displayed
      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });

      // Verify API was called twice
      expect(documentService.generateDocument).toHaveBeenCalledTimes(2);
    });

    it('should clear error message on successful retry', async () => {
      const user = userEvent.setup();
      
      (documentService.generateDocument as jest.Mock)
        .mockRejectedValueOnce({
          status: 500,
          message: 'Server error',
        })
        .mockResolvedValueOnce({
          jobId: 'test-job-123',
          status: 'COMPLETED',
          documentType: '1099-DIV',
          templateKey: 'templates/1099-DIV.pdf',
          outputKey: 'outputs/1099-DIV-test.pdf',
        });

      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill and submit
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Wait for error
      await waitFor(() => {
        const errorText = screen.getByText(/Server error/i);
        expect(errorText).toBeInTheDocument();
      });

      // Retry
      await user.click(screen.getByRole('button', { name: /Retry/i }));

      // Verify error is cleared
      await waitFor(() => {
        expect(screen.queryByText(/Server error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Authentication Errors Redirect to Login', () => {
    it('should redirect to login when token is null', async () => {
      const user = userEvent.setup();
      
      render(<Form1099DivClient initialToken={null} />);

      // Fill in valid data
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      // Verify API was not called
      expect(documentService.generateDocument).not.toHaveBeenCalled();
    });

    it('should redirect to login on 401 error', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 401,
        message: 'Unauthorized',
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in valid data
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/Your session has expired/i)).toBeInTheDocument();
      });

      // Fast-forward time to trigger redirect
      jest.advanceTimersByTime(1500);

      // Verify redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });

      jest.useRealTimers();
    });

    it('should display session expired message before redirecting', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 401,
        message: 'Unauthorized',
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill and submit
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify message appears
      await waitFor(() => {
        expect(screen.getByText(/Your session has expired. Please log in again./i)).toBeInTheDocument();
      });

      // Verify no retry button for auth errors
      expect(screen.queryByRole('button', { name: /Retry/i })).not.toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('Error Recovery and User Experience', () => {
    it('should preserve form data after API error', async () => {
      const user = userEvent.setup();
      
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 500,
        message: 'Server error',
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill in data
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Debug: Check form values
      console.log('Form values:', {
        calendarYear: (screen.getByLabelText(/Tax Year/i) as HTMLInputElement).value,
        payerName: (screen.getByLabelText(/Payer Name/i) as HTMLInputElement).value,
        payerTIN: (screen.getByLabelText(/Payer TIN/i) as HTMLInputElement).value,
      });

      // Submit (fails)
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Debug: Check if API was called
      console.log('documentService.generateDocument called:', (documentService.generateDocument as jest.Mock).mock.calls.length);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/Server error/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify form data is still present
      expect((screen.getByLabelText(/Tax Year/i) as HTMLInputElement).value).toBe('2024');
      expect((screen.getByLabelText(/Payer Name/i) as HTMLInputElement).value).toBe('Test Corp');
      expect((screen.getByLabelText(/Payer TIN/i) as HTMLInputElement).value).toBe('12-3456789');
      expect((screen.getByLabelText(/Recipient Name/i) as HTMLInputElement).value).toBe('John Doe');
      expect((screen.getByLabelText(/Recipient TIN/i) as HTMLInputElement).value).toBe('123-45-6789');
      expect((screen.getByLabelText(/Total Ordinary Dividends/i) as HTMLInputElement).value).toBe('1000.00');
    });

    it('should allow user to modify data after error and resubmit', async () => {
      const user = userEvent.setup();
      
      (documentService.generateDocument as jest.Mock)
        .mockRejectedValueOnce({
          status: 400,
          message: 'Validation error',
        })
        .mockResolvedValueOnce({
          jobId: 'test-job-123',
          status: 'COMPLETED',
          documentType: '1099-DIV',
          templateKey: 'templates/1099-DIV.pdf',
          outputKey: 'outputs/1099-DIV-test.pdf',
        });

      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill and submit (fails)
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/Validation error/i)).toBeInTheDocument();
      });

      // Modify data
      const payerNameInput = screen.getByLabelText(/Payer Name/i);
      await user.clear(payerNameInput);
      await user.type(payerNameInput, 'Corrected Corp');

      // Resubmit (succeeds)
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify success
      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });

      // Verify API was called with corrected data
      expect(documentService.generateDocument).toHaveBeenLastCalledWith({
        documentType: '1099-DIV',
        formData: expect.objectContaining({
          payerName: 'Corrected Corp',
        }),
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      (documentService.generateDocument as jest.Mock).mockReturnValue(promise);

      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill and submit
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/Generating Preview/i)).toBeInTheDocument();
      });

      // Verify submit button is disabled
      const submitButton = screen.getByRole('button', { name: /Generating Preview/i });
      expect(submitButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!({
        jobId: 'test-job-123',
        status: 'COMPLETED',
        documentType: '1099-DIV',
        templateKey: 'templates/1099-DIV.pdf',
        outputKey: 'outputs/1099-DIV-test.pdf',
      });

      // Verify loading state is cleared
      await waitFor(() => {
        expect(screen.queryByText(/Generating Preview/i)).not.toBeInTheDocument();
      });
    });

    it('should disable form inputs during submission', async () => {
      const user = userEvent.setup();
      
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      (documentService.generateDocument as jest.Mock).mockReturnValue(promise);

      render(<Form1099DivClient initialToken={mockToken} />);

      // Fill form
      const calendarYearInput = screen.getByLabelText(/Tax Year/i);
      await user.clear(calendarYearInput);
      await user.type(calendarYearInput, '2024');
      await user.type(screen.getByLabelText(/Payer Name/i), 'Test Corp');
      await user.type(screen.getByLabelText(/Payer TIN/i), '12-3456789');
      await user.type(screen.getByLabelText(/Recipient Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Recipient TIN/i), '123-45-6789');
      await user.type(screen.getByLabelText(/Total Ordinary Dividends/i), '1000.00');

      // Submit
      await user.click(screen.getByRole('button', { name: /Generate Preview/i }));

      // Verify inputs are disabled
      await waitFor(() => {
        expect(screen.getByLabelText(/Tax Year/i)).toBeDisabled();
        expect(screen.getByLabelText(/Payer Name/i)).toBeDisabled();
        expect(screen.getByLabelText(/Payer TIN/i)).toBeDisabled();
      });

      // Resolve
      resolvePromise!({
        jobId: 'test-job-123',
        status: 'COMPLETED',
        documentType: '1099-DIV',
        templateKey: 'templates/1099-DIV.pdf',
        outputKey: 'outputs/1099-DIV-test.pdf',
      });

      // Wait for preview
      await waitFor(() => {
        expect(screen.getByText(/Preview Generated Document/i)).toBeInTheDocument();
      });
    });
  });
});
