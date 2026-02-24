/**
 * Unit Tests for useResetPasswordForm hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useResetPasswordForm } from './useResetPasswordForm';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/api', () => ({
  authService: { resetPassword: jest.fn() },
}));

import { authService } from '@/lib/api';

const mockResetPassword = authService.resetPassword as jest.MockedFunction<typeof authService.resetPassword>;

describe('useResetPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with empty passwords', () => {
      const { result } = renderHook(() => useResetPasswordForm({ token: 'valid-token' }));
      expect(result.current.newPassword).toBe('');
      expect(result.current.confirmPassword).toBe('');
    });

    it('should initialize with passwords hidden', () => {
      const { result } = renderHook(() => useResetPasswordForm({ token: 'valid-token' }));
      expect(result.current.showNewPassword).toBe(false);
      expect(result.current.showConfirmPassword).toBe(false);
    });

    it('should initialize with no errors', () => {
      const { result } = renderHook(() => useResetPasswordForm({ token: 'valid-token' }));
      expect(result.current.errors).toEqual({});
    });
  });

  describe('Password Visibility', () => {
    it('should toggle new password visibility', () => {
      const { result } = renderHook(() => useResetPasswordForm({ token: 'valid-token' }));
      expect(result.current.showNewPassword).toBe(false);
      act(() => { result.current.toggleNewPasswordVisibility(); });
      expect(result.current.showNewPassword).toBe(true);
    });
  });


  describe('Property 8: Loading state management', () => {
    it('should set isSubmitting false after API error', async () => {
      mockResetPassword.mockRejectedValue({ status: 400, message: 'Invalid token' });
      const { result } = renderHook(() => useResetPasswordForm({ token: 'valid-token' }));
      act(() => {
        result.current.setNewPassword('password123');
        result.current.setConfirmPassword('password123');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('Property 13: Network error handling', () => {
    it('should display network error message', async () => {
      mockResetPassword.mockRejectedValue({ message: 'Network Error' });
      const { result } = renderHook(() => useResetPasswordForm({ token: 'valid-token' }));
      act(() => {
        result.current.setNewPassword('password123');
        result.current.setConfirmPassword('password123');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      expect(result.current.errors.general).toBe('Unable to connect. Please check your internet connection.');
    });
  });

  describe('Property 16: Form submission triggers API call', () => {
    it('should call resetPassword API with token and password', async () => {
      mockResetPassword.mockResolvedValue({ message: 'Password reset successful' });
      const { result } = renderHook(() => useResetPasswordForm({ token: 'my-reset-token' }));
      act(() => {
        result.current.setNewPassword('newpassword123');
        result.current.setConfirmPassword('newpassword123');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      expect(mockResetPassword).toHaveBeenCalledWith({
        token: 'my-reset-token',
        newPassword: 'newpassword123',
      });
    });
  });

  describe('Property 17: Success state feedback', () => {
    it('should set isSuccess true on successful API response', async () => {
      mockResetPassword.mockResolvedValue({ message: 'Password reset successful' });
      const { result } = renderHook(() => useResetPasswordForm({ token: 'valid-token' }));
      act(() => {
        result.current.setNewPassword('password123');
        result.current.setConfirmPassword('password123');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      expect(result.current.isSuccess).toBe(true);
    });

    it('should redirect to login after success', async () => {
      mockResetPassword.mockResolvedValue({ message: 'Password reset successful' });
      const { result } = renderHook(() => useResetPasswordForm({ token: 'valid-token' }));
      act(() => {
        result.current.setNewPassword('password123');
        result.current.setConfirmPassword('password123');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      act(() => { jest.advanceTimersByTime(3000); });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Property 18: Invalid token error handling', () => {
    it('should display error for expired token', async () => {
      mockResetPassword.mockRejectedValue({ status: 400, message: 'Token has expired' });
      const { result } = renderHook(() => useResetPasswordForm({ token: 'expired-token' }));
      act(() => {
        result.current.setNewPassword('password123');
        result.current.setConfirmPassword('password123');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      expect(result.current.errors.general).toContain('expired');
    });
  });

  describe('Validation', () => {
    it('should show error for empty password', async () => {
      const { result } = renderHook(() => useResetPasswordForm({ token: 'valid-token' }));
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      expect(result.current.errors.newPassword).toBe('Password is required');
    });

    it('should show error for short password', async () => {
      const { result } = renderHook(() => useResetPasswordForm({ token: 'valid-token' }));
      act(() => {
        result.current.setNewPassword('short');
        result.current.setConfirmPassword('short');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      expect(result.current.errors.newPassword).toBe('Password must be at least 8 characters');
    });

    it('should show error for mismatched passwords', async () => {
      const { result } = renderHook(() => useResetPasswordForm({ token: 'valid-token' }));
      act(() => {
        result.current.setNewPassword('password123');
        result.current.setConfirmPassword('different123');
      });
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      expect(result.current.errors.confirmPassword).toBe('Passwords do not match');
    });
  });
});
