/**
 * Property-Based Tests for useForgotPasswordForm hook
 * 
 * Tests correctness properties 1, 2, 3 from the password-recovery design document.
 * Uses fast-check for property-based testing.
 */

import { renderHook, act } from '@testing-library/react';
import fc from 'fast-check';
import { useForgotPasswordForm } from '../useForgotPasswordForm';

// Mock the authService
jest.mock('@/lib/api', () => ({
  authService: {
    forgotPassword: jest.fn(),
  },
}));

import { authService } from '@/lib/api';

const mockForgotPassword = authService.forgotPassword as jest.MockedFunction<typeof authService.forgotPassword>;

describe('useForgotPasswordForm Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: password-recovery, Property 1: Email validation rejects invalid formats
   * 
   * For any string input in the email field that does not match standard email format
   * (e.g., missing @, missing domain), the validator should reject it and display
   * an appropriate error message.
   * 
   * **Validates: Requirements 2.1, 2.2**
   */
  describe('Property 1: Email validation rejects invalid formats', () => {
    test('emails without @ symbol are rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@') && s.trim().length > 0),
          async (invalidEmail) => {
            const { result } = renderHook(() => useForgotPasswordForm());
            
            // Set the invalid email
            act(() => {
              result.current.setEmail(invalidEmail);
            });
            
            // Submit the form
            await act(async () => {
              await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
            });
            
            // Should have validation error
            expect(result.current.error).toBe('Please enter a valid email address');
            expect(result.current.isSuccess).toBe(false);
            expect(mockForgotPassword).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('emails without domain are rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@') && !s.includes('.') && s.trim().length > 0),
          async (localPart) => {
            const invalidEmail = `${localPart}@`;
            const { result } = renderHook(() => useForgotPasswordForm());
            
            act(() => {
              result.current.setEmail(invalidEmail);
            });
            
            await act(async () => {
              await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
            });
            
            expect(result.current.error).toBe('Please enter a valid email address');
            expect(result.current.isSuccess).toBe(false);
            expect(mockForgotPassword).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('empty emails are rejected with required message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', '   ', '\t', '\n'),
          async (emptyEmail) => {
            const { result } = renderHook(() => useForgotPasswordForm());
            
            act(() => {
              result.current.setEmail(emptyEmail);
            });
            
            await act(async () => {
              await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
            });
            
            expect(result.current.error).toBe('Email is required');
            expect(result.current.isSuccess).toBe(false);
            expect(mockForgotPassword).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 10 }
      );
    });

    test('valid emails are accepted', async () => {
      mockForgotPassword.mockResolvedValue({ message: 'Email sent' });
      
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (validEmail) => {
            const { result } = renderHook(() => useForgotPasswordForm());
            
            act(() => {
              result.current.setEmail(validEmail);
            });
            
            await act(async () => {
              await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
            });
            
            // Should not have validation error
            expect(result.current.error).toBeUndefined();
            // API should have been called
            expect(mockForgotPassword).toHaveBeenCalledWith({ email: validEmail });
            
            mockForgotPassword.mockClear();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: password-recovery, Property 2: Error messages clear when user corrects input
   * 
   * For any form field with a validation error, when the user begins typing in that field,
   * the error message for that specific field should be cleared immediately.
   * 
   * **Validates: Requirements 2.4, 11.5**
   */
  describe('Property 2: Error messages clear when user corrects input', () => {
    test('error clears when user types after validation error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@')),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (invalidEmail, newInput) => {
            const { result } = renderHook(() => useForgotPasswordForm());
            
            // Set invalid email and submit to trigger error
            act(() => {
              result.current.setEmail(invalidEmail);
            });
            
            await act(async () => {
              await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
            });
            
            // Should have error
            expect(result.current.error).toBeDefined();
            
            // User starts typing (correcting input)
            act(() => {
              result.current.setEmail(newInput);
            });
            
            // Error should be cleared
            expect(result.current.error).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: password-recovery, Property 3: Rate limit handling displays appropriate feedback
   * 
   * For any 429 response from the API, the form should display a rate limit message
   * including the retry time, and the submit button should be disabled until the
   * rate limit expires.
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3**
   */
  describe('Property 3: Rate limit handling displays appropriate feedback', () => {
    test('429 response triggers rate limit state with retry time', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.integer({ min: 60, max: 7200 }), // retryAfter in seconds (1 min to 2 hours)
          async (email, retryAfter) => {
            // Mock 429 response
            mockForgotPassword.mockRejectedValueOnce({
              status: 429,
              retryAfter,
            });
            
            const { result } = renderHook(() => useForgotPasswordForm());
            
            act(() => {
              result.current.setEmail(email);
            });
            
            await act(async () => {
              await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
            });
            
            // Should be rate limited
            expect(result.current.isRateLimited).toBe(true);
            
            // Rate limit message should include time
            const expectedMinutes = Math.ceil(retryAfter / 60);
            expect(result.current.rateLimitMessage).toContain(`${expectedMinutes}`);
            expect(result.current.rateLimitMessage).toContain('minute');
            
            // Should not show success
            expect(result.current.isSuccess).toBe(false);
            
            mockForgotPassword.mockClear();
          }
        ),
        { numRuns: 50 }
      );
    });

    test('rate limited state prevents form submission', async () => {
      // First request triggers rate limit
      mockForgotPassword.mockRejectedValueOnce({
        status: 429,
        retryAfter: 3600,
      });
      
      const { result } = renderHook(() => useForgotPasswordForm());
      
      act(() => {
        result.current.setEmail('test@example.com');
      });
      
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      expect(result.current.isRateLimited).toBe(true);
      
      // Clear mock to track new calls
      mockForgotPassword.mockClear();
      
      // Try to submit again while rate limited
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
      });
      
      // API should NOT have been called
      expect(mockForgotPassword).not.toHaveBeenCalled();
    });
  });
});
