/**
 * Unit Tests for useForm1099Div Hook
 * 
 * Tests the form workflow state management including:
 * - Successful document generation flow
 * - Error handling for API failures
 * - Authentication error redirect
 * - Mode transitions (input → preview → edit → approve)
 * - Data persistence during editing
 * 
 * Requirements: 3.1, 3.4, 3.5, 6.3, 9.1
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { useForm1099Div } from './useForm1099Div';
import { documentService } from '@/lib/api';
import type { Form1099DivData, GenerateDocumentResponse } from '@/lib/api';
import { validateAuth } from '@/lib/auth/AuthCoordinator';
import { logAuthEvent, createAuthState } from '@/lib/auth/AuthLogger';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock document service
jest.mock('@/lib/api', () => ({
  documentService: {
    generateDocument: jest.fn(),
  },
}));

// Mock AuthCoordinator
jest.mock('@/lib/auth/AuthCoordinator', () => ({
  validateAuth: jest.fn(),
}));

// Mock AuthLogger
jest.mock('@/lib/auth/AuthLogger', () => ({
  logAuthEvent: jest.fn(),
  createAuthState: jest.fn((hasSession, hasJWT, userId, email) => ({
    hasSession,
    hasJWT,
    isAuthenticated: hasSession && hasJWT,
    userId,
    email,
  })),
}));

// Mock FormDataPreserver
jest.mock('@/lib/auth/FormDataPreserver', () => ({
  saveFormData: jest.fn(),
  restoreFormData: jest.fn(),
  clearFormData: jest.fn(),
}));

describe('useForm1099Div', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockFormData: Form1099DivData = {
    calendarYear: '2024',
    payerName: 'Test Corporation',
    payerTIN: '12-3456789',
    recipientName: 'John Doe',
    recipientTIN: '123-45-6789',
    totalOrdinaryDividends: '1000.00',
  };

  const mockDocumentResponse: GenerateDocumentResponse = {
    jobId: 'test-job-123',
    status: 'COMPLETED',
    documentType: '1099-DIV',
    templateKey: 'templates/1099-DIV.pdf',
    outputKey: 'outputs/1099-DIV-test-job-123.pdf',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/forms/1099-div');
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Default mock: JWT validation passes
    (validateAuth as jest.Mock).mockReturnValue({
      valid: true,
      canRecover: false,
    });
  });

  describe('Initial State', () => {
    it('should initialize with input mode', () => {
      const { result } = renderHook(() => useForm1099Div('test-token'));

      expect(result.current.mode).toBe('input');
      expect(result.current.formData).toBeNull();
      expect(result.current.generatedDocument).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should provide all required handlers', () => {
      const { result } = renderHook(() => useForm1099Div('test-token'));

      expect(typeof result.current.handleGeneratePreview).toBe('function');
      expect(typeof result.current.handleEdit).toBe('function');
      expect(typeof result.current.handleApprove).toBe('function');
    });
  });

  describe('handleGeneratePreview - Successful Flow', () => {
    it('should generate document and transition to preview mode', async () => {
      (documentService.generateDocument as jest.Mock).mockResolvedValue(mockDocumentResponse);

      const { result } = renderHook(() => useForm1099Div('test-token'));

      // Initially in input mode
      expect(result.current.mode).toBe('input');
      expect(result.current.isSubmitting).toBe(false);

      // Call handleGeneratePreview
      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Should transition to preview mode
      expect(result.current.mode).toBe('preview');
      expect(result.current.formData).toEqual(mockFormData);
      expect(result.current.generatedDocument).toEqual(mockDocumentResponse);
      expect(result.current.error).toBeNull();
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should call documentService with correct parameters', async () => {
      (documentService.generateDocument as jest.Mock).mockResolvedValue(mockDocumentResponse);

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      expect(documentService.generateDocument).toHaveBeenCalledWith({
        documentType: '1099-DIV',
        formData: mockFormData,
      });
      expect(documentService.generateDocument).toHaveBeenCalledTimes(1);
    });

    it('should set isSubmitting to true during API call', async () => {
      let resolvePromise: (value: GenerateDocumentResponse) => void;
      const promise = new Promise<GenerateDocumentResponse>((resolve) => {
        resolvePromise = resolve;
      });
      (documentService.generateDocument as jest.Mock).mockReturnValue(promise);

      const { result } = renderHook(() => useForm1099Div('test-token'));

      // Start the API call
      act(() => {
        result.current.handleGeneratePreview(mockFormData);
      });

      // Should be submitting
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockDocumentResponse);
        await promise;
      });

      // Should no longer be submitting
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should clear any previous errors on successful submission', async () => {
      (documentService.generateDocument as jest.Mock)
        .mockRejectedValueOnce({ status: 400, message: 'Validation error' })
        .mockResolvedValueOnce(mockDocumentResponse);

      const { result } = renderHook(() => useForm1099Div('test-token'));

      // First submission fails
      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });
      expect(result.current.error).toBe('Validation error');

      // Second submission succeeds
      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('handleGeneratePreview - Authentication Errors', () => {
    it('should validate JWT before making API call', async () => {
      (documentService.generateDocument as jest.Mock).mockResolvedValue(mockDocumentResponse);

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Verify validateAuth was called
      expect(validateAuth).toHaveBeenCalled();
      expect(logAuthEvent).toHaveBeenCalledWith(
        'Form submission JWT validation',
        'info',
        expect.any(Object),
        expect.objectContaining({
          operation: 'form-submission-validation',
          valid: true,
        })
      );
    });

    it('should redirect to login when JWT validation fails', async () => {
      jest.useFakeTimers();
      
      // Mock JWT validation failure
      (validateAuth as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'JWT token missing',
        canRecover: true,
      });

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Error should be set immediately
      expect(result.current.error).toBe('Your session has expired. Please log in again to submit the form.');
      
      // Form data should be preserved
      expect(result.current.formData).toEqual(mockFormData);
      
      // Should not call API
      expect(documentService.generateDocument).not.toHaveBeenCalled();
      
      // Fast-forward time to trigger the redirect
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/login');
      
      jest.useRealTimers();
    });

    it('should log JWT validation failure', async () => {
      // Mock JWT validation failure
      (validateAuth as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'JWT token expired',
        canRecover: true,
      });

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Verify logging was called
      expect(logAuthEvent).toHaveBeenCalledWith(
        'Form submission JWT validation',
        'warn',
        expect.any(Object),
        expect.objectContaining({
          operation: 'form-submission-validation',
          valid: false,
          reason: 'JWT token expired',
          canRecover: true,
        })
      );
    });

    it('should preserve form data when JWT validation fails', async () => {
      jest.useFakeTimers();
      
      // Mock JWT validation failure
      (validateAuth as jest.Mock).mockReturnValue({
        valid: false,
        reason: 'JWT token missing',
        canRecover: true,
      });

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Form data should be preserved for recovery
      expect(result.current.formData).toEqual(mockFormData);
      
      jest.useRealTimers();
    });

    it('should redirect to login when token is null', async () => {
      jest.useFakeTimers();
      
      const { result } = renderHook(() => useForm1099Div(null));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Should still validate JWT (will fail)
      expect(validateAuth).toHaveBeenCalled();
      
      // Form data should be preserved
      expect(result.current.formData).toEqual(mockFormData);
      
      // Fast-forward time to trigger the redirect
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/login');
      expect(documentService.generateDocument).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should redirect to login on 401 error', async () => {
      jest.useFakeTimers();
      
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 401,
        message: 'Unauthorized',
      });

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Error should be set immediately
      expect(result.current.error).toBe('Your session has expired. Please log in again.');
      
      // Fast-forward time to trigger the redirect
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/login');
      expect(result.current.mode).toBe('input');
      
      jest.useRealTimers();
    });

    it('should redirect to login when error message contains "401"', async () => {
      jest.useFakeTimers();
      
      (documentService.generateDocument as jest.Mock).mockRejectedValue(
        new Error('Request failed with status 401')
      );

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Error should be set immediately
      expect(result.current.error).toBe('Your session has expired. Please log in again.');
      
      // Fast-forward time to trigger the redirect
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/login');
      
      jest.useRealTimers();
    });

    it('should redirect to login when error message contains "unauthorized"', async () => {
      jest.useFakeTimers();
      
      (documentService.generateDocument as jest.Mock).mockRejectedValue(
        new Error('Unauthorized access')
      );

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Error should be set immediately
      expect(result.current.error).toBe('Your session has expired. Please log in again.');
      
      // Fast-forward time to trigger the redirect
      act(() => {
        jest.advanceTimersByTime(1500);
      });

      expect(mockRouter.push).toHaveBeenCalledWith('/login');
      
      jest.useRealTimers();
    });
  });

  describe('handleGeneratePreview - API Errors', () => {
    it('should display validation error message on 400 error', async () => {
      const errorMessage = 'Invalid payer TIN format';
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 400,
        message: errorMessage,
      });

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.mode).toBe('input');
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should display generic message on 400 error without message', async () => {
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 400,
        message: '',
      });

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      expect(result.current.error).toBe('Validation error. Please check your inputs and try again.');
    });

    it('should display server error message on 500 error', async () => {
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 500,
        message: 'Internal server error',
      });

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      expect(result.current.error).toBe('Server error. Please try again later.');
      expect(result.current.mode).toBe('input');
    });

    it('should display API error message for other status codes', async () => {
      const errorMessage = 'Rate limit exceeded';
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 429,
        message: errorMessage,
      });

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it('should display generic message for API errors without message', async () => {
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 503,
        message: '',
      });

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      expect(result.current.error).toBe('An error occurred while generating the document. Please try again.');
    });

    it('should handle JavaScript Error objects', async () => {
      const errorMessage = 'Network connection failed';
      (documentService.generateDocument as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Network-related errors get a specific message
      expect(result.current.error).toBe('Unable to connect to the server. Please check your internet connection and try again.');
    });

    it('should handle unknown error types', async () => {
      (documentService.generateDocument as jest.Mock).mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      expect(result.current.error).toBe('An unexpected error occurred. Please try again.');
    });

    it('should log errors to console', async () => {
      const errorMessage = 'Test error';
      (documentService.generateDocument as jest.Mock).mockRejectedValue({
        status: 500,
        message: errorMessage,
      });

      const { result } = renderHook(() => useForm1099Div('test-token'));

      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Check that error was logged with the new format
      expect(console.error).toHaveBeenCalledWith(
        '[Form1099Div] Error generating document:',
        expect.objectContaining({ status: 500, message: errorMessage })
      );
    });
  });

  describe('handleEdit', () => {
    it('should return to input mode from preview', async () => {
      (documentService.generateDocument as jest.Mock).mockResolvedValue(mockDocumentResponse);

      const { result } = renderHook(() => useForm1099Div('test-token'));

      // Generate preview
      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });
      expect(result.current.mode).toBe('preview');

      // Click edit
      act(() => {
        result.current.handleEdit();
      });

      expect(result.current.mode).toBe('input');
    });

    it('should preserve form data when editing', async () => {
      (documentService.generateDocument as jest.Mock).mockResolvedValue(mockDocumentResponse);

      const { result } = renderHook(() => useForm1099Div('test-token'));

      // Generate preview
      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Click edit
      act(() => {
        result.current.handleEdit();
      });

      expect(result.current.formData).toEqual(mockFormData);
      expect(result.current.generatedDocument).toEqual(mockDocumentResponse);
    });

    it('should clear any error messages when editing', async () => {
      (documentService.generateDocument as jest.Mock).mockResolvedValue(mockDocumentResponse);

      const { result } = renderHook(() => useForm1099Div('test-token'));

      // Generate preview
      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Manually set an error (simulating some error state)
      act(() => {
        result.current.handleEdit();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('handleApprove', () => {
    it('should clear all data and return to input mode', async () => {
      (documentService.generateDocument as jest.Mock).mockResolvedValue(mockDocumentResponse);

      const { result } = renderHook(() => useForm1099Div('test-token'));

      // Generate preview
      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });
      expect(result.current.mode).toBe('preview');
      expect(result.current.formData).toEqual(mockFormData);
      expect(result.current.generatedDocument).toEqual(mockDocumentResponse);

      // Click approve
      act(() => {
        result.current.handleApprove();
      });

      expect(result.current.mode).toBe('input');
      expect(result.current.formData).toBeNull();
      expect(result.current.generatedDocument).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should clear any error messages when approving', async () => {
      (documentService.generateDocument as jest.Mock).mockResolvedValue(mockDocumentResponse);

      const { result } = renderHook(() => useForm1099Div('test-token'));

      // Generate preview
      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });

      // Click approve
      act(() => {
        result.current.handleApprove();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Complete Workflow', () => {
    it('should support edit-preview-edit-approve cycle', async () => {
      (documentService.generateDocument as jest.Mock).mockResolvedValue(mockDocumentResponse);

      const { result } = renderHook(() => useForm1099Div('test-token'));

      // Initial state
      expect(result.current.mode).toBe('input');

      // Submit form
      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });
      expect(result.current.mode).toBe('preview');
      expect(result.current.formData).toEqual(mockFormData);

      // Edit
      act(() => {
        result.current.handleEdit();
      });
      expect(result.current.mode).toBe('input');
      expect(result.current.formData).toEqual(mockFormData);

      // Re-submit with modified data
      const modifiedData = { ...mockFormData, totalOrdinaryDividends: '2000.00' };
      await act(async () => {
        await result.current.handleGeneratePreview(modifiedData);
      });
      expect(result.current.mode).toBe('preview');
      expect(result.current.formData).toEqual(modifiedData);

      // Approve
      act(() => {
        result.current.handleApprove();
      });
      expect(result.current.mode).toBe('input');
      expect(result.current.formData).toBeNull();
    });

    it('should allow multiple submissions after approval', async () => {
      (documentService.generateDocument as jest.Mock).mockResolvedValue(mockDocumentResponse);

      const { result } = renderHook(() => useForm1099Div('test-token'));

      // First submission
      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });
      expect(result.current.mode).toBe('preview');

      // Approve
      act(() => {
        result.current.handleApprove();
      });
      expect(result.current.mode).toBe('input');
      expect(result.current.formData).toBeNull();

      // Second submission
      await act(async () => {
        await result.current.handleGeneratePreview(mockFormData);
      });
      expect(result.current.mode).toBe('preview');
      expect(result.current.formData).toEqual(mockFormData);
    });
  });
});
