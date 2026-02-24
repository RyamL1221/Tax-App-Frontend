/**
 * Unit Tests for useForgotPasswordForm hook
 * 
 * Tests form state management, validation, and API integration.
 * 
 * Properties: 8, 9, 13, 16, 17
 * Requirements: 7.1, 7.2, 7.3, 7.4, 8.3, 8.4, 1.5, 11.4, 1.2, 4.3, 1.3, 4.4
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useForgotPasswordForm } from './useForgotPasswordForm';

// Mock the authService
jest.mock('@/lib/api', () => ({
  authService: {
    forgotPassword: jest.fn(),
  },
}));

import { authService } from '@/lib/api';

const mockForgotPassword = authService.forgotPassword as jest.MockedFunction<typeof authService.forgotPassword>;

describe('useForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty email', () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      
      expect(result.current.email).toBe('');
    });

    it('should initialize with no error', () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      
      expect(result.current.error).toBeUndefined();
    });

    it('should initialize with isSubmitting false', () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      
      expect(result.current.isSubmitting).toBe(false);
    });

    it('should initialize with isSuccess false', () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      
      expect(result.current.isSuccess).toBe(false);
    });

    it('should initialize with isRateLimited false', () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      
      expect(result.current.isRateLimited).toBe(false);
    });
  });

  describe('Email State Management', () => {
    it('should update email when setEmail is called', () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      expect(result.current.email).toBe('test@example.com');
    });

    it('should clear error when setEmail is called', async () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      
      // Set invalid email and submit to trigger error
      act(() => {
        result.current.setEmail('invalid');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(result.current.error).toBeDefined();
      
      // Set new email should clear error
      act(() => {
        result.current.setEmail('new@example.com');
      });
      
      expect(result.current.error).toBeUndefined();
    });
  });

  /**
   * Feature: password-recovery, Property 8: Loading state management during submission
   * 
   * For any form submission, the submit button should be disabled and display a loading
   * indicator during the API call, and should return to normal state when the call
   * completes (success or failure).
   * 
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
   */
  describe('Property 8: Loading state management during submission', () => {
    it('should set isSubmitting true during API call', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockForgotPassword.mockReturnValue(promise as any);
      
      const { result } = renderHook(() => useForgotPasswordForm());
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      // Start submission
      act(() => {
        result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      // Should be submitting
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });
      
      // Resolve the promise
      await act(async () => {
        resolvePromise!({ message: 'Email sent' });
      });
      
      // Should no longer be submitting
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should set isSubmitting false after API error', async () => {
      mockForgotPassword.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useForgotPasswordForm());
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  /**
   * Feature: password-recovery, Property 13: Network error handling displays connectivity message
   * 
   * For any network error during form submission (connection timeout, no internet),
   * the form should display a user-friendly message indicating connectivity issues.
   * 
   * **Validates: Requirements 1.5, 11.4**
   */
  describe('Property 13: Network error handling displays connectivity message', () => {
    it('should display network error message on network failure', async () => {
      mockForgotPassword.mockRejectedValue({ message: 'Network Error' });
      
      const { result } = renderHook(() => useForgotPasswordForm());
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(result.current.error).toBe('Unable to connect. Please check your internet connection.');
    });

    it('should display network error message on connection timeout', async () => {
      mockForgotPassword.mockRejectedValue({ message: 'Network Error' });
      
      const { result } = renderHook(() => useForgotPasswordForm());
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(result.current.error).toContain('Unable to connect');
    });
  });

  /**
   * Feature: password-recovery, Property 16: Form submission triggers API call with correct data
   * 
   * For any valid form submission (forgot password with valid email), the appropriate
   * API endpoint should be called with the correct payload.
   * 
   * **Validates: Requirements 1.2, 4.3**
   */
  describe('Property 16: Form submission triggers API call with correct data', () => {
    it('should call forgotPassword API with email', async () => {
      mockForgotPassword.mockResolvedValue({ message: 'Email sent' });
      
      const { result } = renderHook(() => useForgotPasswordForm());
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(mockForgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should not call API with invalid email', async () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      
      act(() => {
        result.current.setEmail('invalid-email');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(mockForgotPassword).not.toHaveBeenCalled();
    });
  });

  /**
   * Feature: password-recovery, Property 17: Success state displays appropriate feedback
   * 
   * For any successful API response, the form should display a success message.
   * 
   * **Validates: Requirements 1.3, 4.4**
   */
  describe('Property 17: Success state displays appropriate feedback', () => {
    it('should set isSuccess true on successful API response', async () => {
      mockForgotPassword.mockResolvedValue({ message: 'Email sent' });
      
      const { result } = renderHook(() => useForgotPasswordForm());
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(result.current.isSuccess).toBe(true);
    });

    it('should call onSuccess callback on successful submission', async () => {
      mockForgotPassword.mockResolvedValue({ message: 'Email sent' });
      const onSuccess = jest.fn();
      
      const { result } = renderHook(() => useForgotPasswordForm({ onSuccess }));
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should show error for empty email', async () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(result.current.error).toBe('Email is required');
    });

    it('should show error for invalid email format', async () => {
      const { result } = renderHook(() => useForgotPasswordForm());
      
      act(() => {
        result.current.setEmail('invalid-email');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(result.current.error).toBe('Please enter a valid email address');
    });
  });

  describe('Rate Limiting', () => {
    it('should set rate limit state on 429 response', async () => {
      mockForgotPassword.mockRejectedValue({ status: 429, retryAfter: 3600 });
      
      const { result } = renderHook(() => useForgotPasswordForm());
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(result.current.isRateLimited).toBe(true);
      expect(result.current.rateLimitMessage).toContain('60');
    });

    it('should prevent submission when rate limited', async () => {
      mockForgotPassword.mockRejectedValue({ status: 429, retryAfter: 3600 });
      
      const { result } = renderHook(() => useForgotPasswordForm());
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      // First submission triggers rate limit
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      mockForgotPassword.mockClear();
      
      // Second submission should be blocked
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(mockForgotPassword).not.toHaveBeenCalled();
    });
  });

  describe('Callbacks', () => {
    it('should call onError callback on error', async () => {
      mockForgotPassword.mockRejectedValue({ message: 'Network Error' });
      const onError = jest.fn();
      
      const { result } = renderHook(() => useForgotPasswordForm({ onError }));
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(onError).toHaveBeenCalledWith('Network error');
    });
  });
});
