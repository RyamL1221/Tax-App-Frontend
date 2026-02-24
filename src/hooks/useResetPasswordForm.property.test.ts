/**
 * Property-Based Tests for useResetPasswordForm hook
 * 
 * Tests correctness properties 4, 5, 6, 7 from the password-recovery design document.
 * Uses fast-check for property-based testing.
 */

import { renderHook, act } from '@testing-library/react';
import fc from 'fast-check';
import { useResetPasswordForm } from './useResetPasswordForm';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the authService
jest.mock('@/lib/api', () => ({
  authService: {
    resetPassword: jest.fn(),
  },
}));

import { authService } from '@/lib/api';

const mockResetPassword = authService.resetPassword as jest.MockedFunction<typeof authService.resetPassword>;

describe('useResetPasswordForm Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Feature: password-recovery, Property 4: Password length validation enforces minimum
   * 
   * For any password string shorter than 8 characters, the validator should reject it
   * and display a minimum length error message.
   * 
   * **Validates: Requirements 5.1, 5.2**
   */
  describe('Property 4: Password length validation enforces minimum', () => {
    test('passwords shorter than 8 characters are rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 7 }),
          async (shortPassword) => {
            const { result } = renderHook(() => 
              useResetPasswordForm({ token: 'valid-token' })
            );
            
            // Set short password and matching confirm
            act(() => {
              result.current.setNewPassword(shortPassword);
              result.current.setConfirmPassword(shortPassword);
            });
            
            // Submit the form
            await act(async () => {
              await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
            });
            
            // Should have password length error
            expect(result.current.errors.newPassword).toBe('Password must be at least 8 characters');
            expect(result.current.isSuccess).toBe(false);
            expect(mockResetPassword).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('passwords of 8 or more characters pass length validation', async () => {
      mockResetPassword.mockResolvedValue({ message: 'Password reset successful' });
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 50 }),
          async (validPassword) => {
            const { result } = renderHook(() => 
              useResetPasswordForm({ token: 'valid-token' })
            );
            
            // Set valid password and matching confirm
            act(() => {
              result.current.setNewPassword(validPassword);
              result.current.setConfirmPassword(validPassword);
            });
            
            // Submit the form
            await act(async () => {
              await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
            });
            
            // Should not have password length error
            expect(result.current.errors.newPassword).toBeUndefined();
            // API should have been called
            expect(mockResetPassword).toHaveBeenCalled();
            
            mockResetPassword.mockClear();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('empty password shows required error', async () => {
      const { result } = renderHook(() => 
        useResetPasswordForm({ token: 'valid-token' })
      );
      
      // Leave password empty
      act(() => {
        result.current.setNewPassword('');
        result.current.setConfirmPassword('');
      });
      
      // Submit the form
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(result.current.errors.newPassword).toBe('Password is required');
      expect(mockResetPassword).not.toHaveBeenCalled();
    });
  });

  /**
   * Feature: password-recovery, Property 5: Password confirmation validates matching
   * 
   * For any pair of new password and confirm password values where they do not match,
   * the validator should display a password mismatch error and prevent form submission.
   * 
   * **Validates: Requirements 5.3**
   */
  describe('Property 5: Password confirmation validates matching', () => {
    test('mismatched passwords show error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 50 }),
          fc.string({ minLength: 8, maxLength: 50 }),
          async (password1, password2) => {
            // Ensure passwords are different
            fc.pre(password1 !== password2);
            
            const { result } = renderHook(() => 
              useResetPasswordForm({ token: 'valid-token' })
            );
            
            // Set different passwords
            act(() => {
              result.current.setNewPassword(password1);
              result.current.setConfirmPassword(password2);
            });
            
            // Submit the form
            await act(async () => {
              await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
            });
            
            // Should have mismatch error
            expect(result.current.errors.confirmPassword).toBe('Passwords do not match');
            expect(result.current.isSuccess).toBe(false);
            expect(mockResetPassword).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('matching passwords pass validation', async () => {
      mockResetPassword.mockResolvedValue({ message: 'Password reset successful' });
      
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 50 }),
          async (password) => {
            const { result } = renderHook(() => 
              useResetPasswordForm({ token: 'valid-token' })
            );
            
            // Set matching passwords
            act(() => {
              result.current.setNewPassword(password);
              result.current.setConfirmPassword(password);
            });
            
            // Submit the form
            await act(async () => {
              await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
            });
            
            // Should not have mismatch error
            expect(result.current.errors.confirmPassword).toBeUndefined();
            
            mockResetPassword.mockClear();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('empty confirm password shows required error', async () => {
      const { result } = renderHook(() => 
        useResetPasswordForm({ token: 'valid-token' })
      );
      
      act(() => {
        result.current.setNewPassword('validpassword123');
        result.current.setConfirmPassword('');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(result.current.errors.confirmPassword).toBe('Please confirm your password');
      expect(mockResetPassword).not.toHaveBeenCalled();
    });
  });

  /**
   * Feature: password-recovery, Property 6: Validation errors prevent form submission
   * 
   * For any form state with one or more validation errors, attempting to submit the form
   * should be blocked and the errors should remain displayed.
   * 
   * **Validates: Requirements 5.5**
   */
  describe('Property 6: Validation errors prevent form submission', () => {
    test('form with validation errors does not call API', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 7 }), // Short password
          fc.string({ minLength: 8, maxLength: 50 }), // Different confirm
          async (shortPassword, differentConfirm) => {
            const { result } = renderHook(() => 
              useResetPasswordForm({ token: 'valid-token' })
            );
            
            // Set invalid form state
            act(() => {
              result.current.setNewPassword(shortPassword);
              result.current.setConfirmPassword(differentConfirm);
            });
            
            // Submit the form
            await act(async () => {
              await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
            });
            
            // API should NOT have been called
            expect(mockResetPassword).not.toHaveBeenCalled();
            
            // Errors should be displayed
            expect(
              result.current.errors.newPassword || result.current.errors.confirmPassword
            ).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: password-recovery, Property 7: Password visibility toggle round-trip
   * 
   * For any password field, clicking the visibility toggle should switch between
   * masked and visible text, and clicking again should return to the original state.
   * The icon should always reflect the current visibility state.
   * 
   * **Validates: Requirements 6.3, 6.4**
   */
  describe('Property 7: Password visibility toggle round-trip', () => {
    test('new password visibility toggles correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // Number of toggles
          async (toggleCount) => {
            const { result } = renderHook(() => 
              useResetPasswordForm({ token: 'valid-token' })
            );
            
            // Initial state should be hidden
            expect(result.current.showNewPassword).toBe(false);
            
            // Toggle the specified number of times
            for (let i = 0; i < toggleCount; i++) {
              act(() => {
                result.current.toggleNewPasswordVisibility();
              });
            }
            
            // After even number of toggles, should be hidden
            // After odd number of toggles, should be visible
            const expectedState = toggleCount % 2 === 1;
            expect(result.current.showNewPassword).toBe(expectedState);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('confirm password visibility toggles correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // Number of toggles
          async (toggleCount) => {
            const { result } = renderHook(() => 
              useResetPasswordForm({ token: 'valid-token' })
            );
            
            // Initial state should be hidden
            expect(result.current.showConfirmPassword).toBe(false);
            
            // Toggle the specified number of times
            for (let i = 0; i < toggleCount; i++) {
              act(() => {
                result.current.toggleConfirmPasswordVisibility();
              });
            }
            
            // After even number of toggles, should be hidden
            // After odd number of toggles, should be visible
            const expectedState = toggleCount % 2 === 1;
            expect(result.current.showConfirmPassword).toBe(expectedState);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('new and confirm password visibility are independent', async () => {
      const { result } = renderHook(() => 
        useResetPasswordForm({ token: 'valid-token' })
      );
      
      // Toggle new password visibility
      act(() => {
        result.current.toggleNewPasswordVisibility();
      });
      
      expect(result.current.showNewPassword).toBe(true);
      expect(result.current.showConfirmPassword).toBe(false);
      
      // Toggle confirm password visibility
      act(() => {
        result.current.toggleConfirmPasswordVisibility();
      });
      
      expect(result.current.showNewPassword).toBe(true);
      expect(result.current.showConfirmPassword).toBe(true);
      
      // Toggle new password back
      act(() => {
        result.current.toggleNewPasswordVisibility();
      });
      
      expect(result.current.showNewPassword).toBe(false);
      expect(result.current.showConfirmPassword).toBe(true);
    });
  });
});
