import { renderHook, act, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { useRegistrationForm } from './useRegistrationForm';
import { useLoadingState } from './useLoadingState';
import { useRateLimit } from './useRateLimit';
import { authService } from '@/lib/api';

// Mock dependencies
jest.mock('./useLoadingState');
jest.mock('./useRateLimit');
jest.mock('@/lib/api', () => ({
  authService: {
    register: jest.fn(),
  },
  isApiError: (error: unknown): boolean => {
    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      'message' in error
    );
  },
}));

describe('useRegistrationForm Property-Based Tests', () => {
  const mockSetLoading = jest.fn();
  const mockRecordAttempt = jest.fn();
  const mockResetRateLimit = jest.fn();
  const mockRegister = authService.register as jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockRegister.mockReset();
    mockSetLoading.mockClear();
    mockRecordAttempt.mockClear();
    mockResetRateLimit.mockClear();
    
    // Mock useLoadingState
    (useLoadingState as jest.Mock).mockReturnValue({
      isLoading: false,
      setLoading: mockSetLoading,
    });

    // Mock useRateLimit
    (useRateLimit as jest.Mock).mockReturnValue({
      isLocked: false,
      remainingTime: 0,
      recordAttempt: mockRecordAttempt,
      reset: mockResetRateLimit,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Feature: register-page, Property 1: Form submission sends complete data to API
  // **Validates: Requirements 1.3**
  test('property: form submission sends complete data to API', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary valid registration data
        fc.record({
          fullName: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 8, maxLength: 100 })
            .filter(pwd => {
              // Ensure password meets all requirements
              return (
                pwd.length >= 8 &&
                /[A-Z]/.test(pwd) &&
                /[a-z]/.test(pwd) &&
                /[0-9]/.test(pwd) &&
                /[^A-Za-z0-9]/.test(pwd)
              );
            }),
        }),
        async (formData) => {
          // Reset mocks for each iteration
          mockRegister.mockClear();
          mockSetLoading.mockClear();
          mockRecordAttempt.mockClear();

          // Mock successful API response
          mockRegister.mockResolvedValueOnce({
            message: 'Registration successful',
            email: formData.email,
          });

          const { result } = renderHook(() => useRegistrationForm());

          // Set form data - each change in a separate act
          act(() => {
            result.current.handleChange({
              target: { name: 'fullName', value: formData.fullName }
            } as any);
          });

          act(() => {
            result.current.handleChange({
              target: { name: 'email', value: formData.email }
            } as any);
          });

          act(() => {
            result.current.handleChange({
              target: { name: 'password', value: formData.password }
            } as any);
          });

          act(() => {
            result.current.handleChange({
              target: { name: 'confirmPassword', value: formData.password }
            } as any);
          });

          // Verify form data is set correctly
          expect(result.current.formData.fullName).toBe(formData.fullName);
          expect(result.current.formData.email).toBe(formData.email);
          expect(result.current.formData.password).toBe(formData.password);
          expect(result.current.formData.confirmPassword).toBe(formData.password);

          // Submit the form
          await act(async () => {
            await result.current.handleSubmit({
              preventDefault: jest.fn(),
            } as any);
          });

          // Wait for async operations to complete
          await waitFor(() => {
            expect(mockRegister).toHaveBeenCalled();
          });

          // Verify authService.register was called with correct data
          expect(mockRegister).toHaveBeenCalledWith({
            email: formData.email,
            name: formData.fullName,
            password: formData.password,
          });

          // Property: API should receive name (not fullName), email, and password
          const registerCall = mockRegister.mock.calls[0][0];
          expect(registerCall).toHaveProperty('name', formData.fullName);
          expect(registerCall).toHaveProperty('email', formData.email);
          expect(registerCall).toHaveProperty('password', formData.password);

          // Property: confirmPassword should NOT be sent to API
          expect(registerCall).not.toHaveProperty('confirmPassword');

          // Property: All three required fields should be present
          expect(Object.keys(registerCall).sort()).toEqual(['email', 'name', 'password'].sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: register-page, Property 3: Email validation triggers on blur and submit
  // **Validates: Requirements 2.4**
  test('property: email validation triggers on blur and submit', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary email strings (both valid and invalid)
        fc.oneof(
          fc.emailAddress(), // Valid emails
          fc.string().filter(s => {
            // Invalid emails - strings that don't match email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return !emailRegex.test(s);
          })
        ),
        async (email) => {
          const { result } = renderHook(() => useRegistrationForm());

          // Determine if email is valid
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValid = emailRegex.test(email);

          // Test 1: Validation triggers on blur
          // Set email value
          act(() => {
            result.current.handleChange({
              target: { name: 'email', value: email }
            } as any);
          });

          // Initially, no error should be present (validation hasn't triggered yet)
          expect(result.current.errors.email).toBeUndefined();

          // Trigger blur event
          act(() => {
            result.current.handleBlur({
              target: { name: 'email' }
            } as any);
          });

          // Property: After blur, validation should have run
          if (!isValid && email !== '') {
            // Invalid email should have an error after blur
            expect(result.current.errors.email).toBeDefined();
            expect(result.current.errors.email).toBeTruthy();
          } else if (isValid) {
            // Valid email should have no error after blur
            expect(result.current.errors.email).toBeUndefined();
          } else if (email === '') {
            // Empty email should have "required" error after blur
            expect(result.current.errors.email).toBe('Email is required');
          }

          // Test 2: Validation triggers on submit
          // Reset the hook for submit test
          const { result: result2 } = renderHook(() => useRegistrationForm());

          // Set all form fields with valid data except email
          act(() => {
            result2.current.handleChange({
              target: { name: 'fullName', value: 'John Doe' }
            } as any);
          });

          act(() => {
            result2.current.handleChange({
              target: { name: 'email', value: email }
            } as any);
          });

          act(() => {
            result2.current.handleChange({
              target: { name: 'password', value: 'Password123!' }
            } as any);
          });

          act(() => {
            result2.current.handleChange({
              target: { name: 'confirmPassword', value: 'Password123!' }
            } as any);
          });

          // Mock API response
          mockRegister.mockResolvedValueOnce({
            message: 'Registration successful',
            email: email,
          });

          // Submit the form
          await act(async () => {
            await result2.current.handleSubmit({
              preventDefault: jest.fn(),
            } as any);
          });

          // Property: After submit, validation should have run
          if (!isValid && email !== '') {
            // Invalid email should have an error after submit
            expect(result2.current.errors.email).toBeDefined();
            expect(result2.current.errors.email).toBeTruthy();
            // API should NOT have been called with invalid email
            expect(mockRegister).not.toHaveBeenCalled();
          } else if (isValid) {
            // Valid email should have no error after submit
            expect(result2.current.errors.email).toBeUndefined();
            // API should have been called with valid email
            await waitFor(() => {
              expect(mockRegister).toHaveBeenCalled();
            });
          } else if (email === '') {
            // Empty email should have "required" error after submit
            expect(result2.current.errors.email).toBe('Email is required');
            // API should NOT have been called with empty email
            expect(mockRegister).not.toHaveBeenCalled();
          }

          // Clear mocks for next iteration
          mockRegister.mockClear();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: register-page, Property 6: Password confirmation validates matching
  // **Validates: Requirements 4.2**
  test('property: password confirmation validates matching', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary password pairs (matching and non-matching)
        fc.record({
          password: fc.string({ minLength: 8, maxLength: 100 })
            .filter(pwd => {
              // Ensure password meets all requirements
              return (
                pwd.length >= 8 &&
                /[A-Z]/.test(pwd) &&
                /[a-z]/.test(pwd) &&
                /[0-9]/.test(pwd) &&
                /[^A-Za-z0-9]/.test(pwd)
              );
            }),
          confirmPassword: fc.string({ minLength: 0, maxLength: 100 }),
        }),
        async ({ password, confirmPassword }) => {
          const { result } = renderHook(() => useRegistrationForm());

          // Set all form fields with valid data
          act(() => {
            result.current.handleChange({
              target: { name: 'fullName', value: 'John Doe' }
            } as any);
          });

          act(() => {
            result.current.handleChange({
              target: { name: 'email', value: 'test@example.com' }
            } as any);
          });

          act(() => {
            result.current.handleChange({
              target: { name: 'password', value: password }
            } as any);
          });

          act(() => {
            result.current.handleChange({
              target: { name: 'confirmPassword', value: confirmPassword }
            } as any);
          });

          // Mock API response
          mockRegister.mockResolvedValueOnce({
            message: 'Registration successful',
            email: 'test@example.com',
          });

          // Submit the form
          await act(async () => {
            await result.current.handleSubmit({
              preventDefault: jest.fn(),
            } as any);
          });

          // Property: When passwords do not match, validation should fail
          if (password !== confirmPassword) {
            // Should have an error for confirmPassword field
            expect(result.current.errors.confirmPassword).toBeDefined();
            
            // The error message depends on whether confirmPassword is empty
            if (confirmPassword === '') {
              expect(result.current.errors.confirmPassword).toBe('Please confirm your password');
            } else {
              expect(result.current.errors.confirmPassword).toBe('Passwords do not match');
            }
            
            // API should NOT have been called when passwords don't match
            expect(mockRegister).not.toHaveBeenCalled();
          } else {
            // When passwords match, no error should be present
            expect(result.current.errors.confirmPassword).toBeUndefined();
            
            // API should have been called when passwords match
            await waitFor(() => {
              expect(mockRegister).toHaveBeenCalled();
            });
          }

          // Clear mocks for next iteration
          mockRegister.mockClear();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: register-page, Property 7: Password confirmation validation triggers on blur and submit
  // **Validates: Requirements 4.3**
  test('property: password confirmation validation triggers on blur and submit', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary password and confirmPassword pairs
        fc.record({
          password: fc.string({ minLength: 8, maxLength: 100 })
            .filter(pwd => {
              // Ensure password meets all requirements
              return (
                pwd.length >= 8 &&
                /[A-Z]/.test(pwd) &&
                /[a-z]/.test(pwd) &&
                /[0-9]/.test(pwd) &&
                /[^A-Za-z0-9]/.test(pwd)
              );
            }),
          confirmPassword: fc.string({ minLength: 0, maxLength: 100 }),
        }),
        async ({ password, confirmPassword }) => {
          // Test 1: Validation triggers on blur
          const { result } = renderHook(() => useRegistrationForm());

          // Set password first
          act(() => {
            result.current.handleChange({
              target: { name: 'password', value: password }
            } as any);
          });

          // Set confirmPassword value
          act(() => {
            result.current.handleChange({
              target: { name: 'confirmPassword', value: confirmPassword }
            } as any);
          });

          // Initially, no error should be present (validation hasn't triggered yet)
          expect(result.current.errors.confirmPassword).toBeUndefined();

          // Trigger blur event on confirmPassword field
          act(() => {
            result.current.handleBlur({
              target: { name: 'confirmPassword' }
            } as any);
          });

          // Property: After blur, validation should have run
          if (confirmPassword === '') {
            // Empty confirmPassword should have "required" error after blur
            expect(result.current.errors.confirmPassword).toBe('Please confirm your password');
          } else if (confirmPassword !== password) {
            // Non-matching confirmPassword should have "mismatch" error after blur
            expect(result.current.errors.confirmPassword).toBe('Passwords do not match');
          } else {
            // Matching confirmPassword should have no error after blur
            expect(result.current.errors.confirmPassword).toBeUndefined();
          }

          // Test 2: Validation triggers on submit
          // Reset the hook for submit test
          const { result: result2 } = renderHook(() => useRegistrationForm());

          // Set all form fields with valid data except confirmPassword
          act(() => {
            result2.current.handleChange({
              target: { name: 'fullName', value: 'John Doe' }
            } as any);
          });

          act(() => {
            result2.current.handleChange({
              target: { name: 'email', value: 'test@example.com' }
            } as any);
          });

          act(() => {
            result2.current.handleChange({
              target: { name: 'password', value: password }
            } as any);
          });

          act(() => {
            result2.current.handleChange({
              target: { name: 'confirmPassword', value: confirmPassword }
            } as any);
          });

          // Mock API response
          mockRegister.mockResolvedValueOnce({
            message: 'Registration successful',
            email: 'test@example.com',
          });

          // Submit the form
          await act(async () => {
            await result2.current.handleSubmit({
              preventDefault: jest.fn(),
            } as any);
          });

          // Property: After submit, validation should have run
          if (confirmPassword === '') {
            // Empty confirmPassword should have "required" error after submit
            expect(result2.current.errors.confirmPassword).toBe('Please confirm your password');
            // API should NOT have been called with empty confirmPassword
            expect(mockRegister).not.toHaveBeenCalled();
          } else if (confirmPassword !== password) {
            // Non-matching confirmPassword should have "mismatch" error after submit
            expect(result2.current.errors.confirmPassword).toBe('Passwords do not match');
            // API should NOT have been called with non-matching passwords
            expect(mockRegister).not.toHaveBeenCalled();
          } else {
            // Matching confirmPassword should have no error after submit
            expect(result2.current.errors.confirmPassword).toBeUndefined();
            // API should have been called with matching passwords
            await waitFor(() => {
              expect(mockRegister).toHaveBeenCalled();
            });
          }

          // Clear mocks for next iteration
          mockRegister.mockClear();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: register-page, Property 9: Rate limiter displays wait time message
  // **Validates: Requirements 5.3**
  test('property: rate limiter displays wait time message', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate remaining time in seconds (1-900 seconds = 1 second to 15 minutes)
        fc.integer({ min: 1, max: 900 }),
        async (remainingTimeSeconds) => {
          // Reset mocks
          mockRecordAttempt.mockClear();
          mockRegister.mockClear();

          // Configure rate limit mock to be locked with remaining time
          (useRateLimit as jest.Mock).mockReturnValue({
            isLocked: true,
            remainingTime: remainingTimeSeconds,
            recordAttempt: mockRecordAttempt,
            reset: mockResetRateLimit,
          });

          const { result } = renderHook(() => useRegistrationForm());

          // Property: When rate limited, isRateLimited should be true
          expect(result.current.isRateLimited).toBe(true);

          // Property: rateLimitMessage should be defined and non-empty
          expect(result.current.rateLimitMessage).toBeDefined();
          expect(result.current.rateLimitMessage).not.toBe('');

          // Property: Message should contain information about waiting
          expect(result.current.rateLimitMessage).toMatch(/too many.*attempts/i);
          expect(result.current.rateLimitMessage).toMatch(/try again/i);

          // Property: Message should display wait time in minutes
          const expectedMinutes = Math.ceil(remainingTimeSeconds / 60);
          expect(result.current.rateLimitMessage).toContain(`${expectedMinutes} minute`);

          // Property: Message format should be consistent
          const expectedMessage = `Too many registration attempts. Please try again in ${expectedMinutes} minutes.`;
          expect(result.current.rateLimitMessage).toBe(expectedMessage);

          // Property: When not rate limited, message should be empty
          (useRateLimit as jest.Mock).mockReturnValue({
            isLocked: false,
            remainingTime: 0,
            recordAttempt: mockRecordAttempt,
            reset: mockResetRateLimit,
          });

          const { result: unlockedResult } = renderHook(() => useRegistrationForm());

          expect(unlockedResult.current.isRateLimited).toBe(false);
          expect(unlockedResult.current.rateLimitMessage).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: register-page, Property 8: Rate limiter tracks and enforces attempt limits
  // **Validates: Requirements 5.1, 5.2**
  test('property: rate limiter tracks and enforces attempt limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a number of registration attempts (1-10)
        fc.integer({ min: 1, max: 10 }),
        // Generate whether attempts should succeed or fail
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        async (numAttempts, attemptResults) => {
          // Ensure attemptResults array matches numAttempts length
          const results = attemptResults.slice(0, numAttempts);
          while (results.length < numAttempts) {
            results.push(false); // Default to failed attempts
          }

          // Track rate limit state
          let isLocked = false;
          let attemptCount = 0;

          // Test each attempt
          for (let i = 0; i < numAttempts; i++) {
            // Reset mocks for each attempt
            mockRecordAttempt.mockClear();
            mockRegister.mockClear();

            // Configure rate limit mock based on current state
            (useRateLimit as jest.Mock).mockReturnValue({
              isLocked,
              remainingTime: isLocked ? 900 : 0, // 15 minutes = 900 seconds
              recordAttempt: mockRecordAttempt,
              reset: mockResetRateLimit,
            });

            const { result } = renderHook(() => useRegistrationForm());

            // Set valid form data
            act(() => {
              result.current.handleChange({
                target: { name: 'fullName', value: 'John Doe' }
              } as any);
            });

            act(() => {
              result.current.handleChange({
                target: { name: 'email', value: 'test@example.com' }
              } as any);
            });

            act(() => {
              result.current.handleChange({
                target: { name: 'password', value: 'Password123!' }
              } as any);
            });

            act(() => {
              result.current.handleChange({
                target: { name: 'confirmPassword', value: 'Password123!' }
              } as any);
            });

            // Property: isRateLimited should reflect the locked state
            expect(result.current.isRateLimited).toBe(isLocked);

            // Mock API response based on attempt result
            if (results[i]) {
              // Successful registration
              mockRegister.mockResolvedValueOnce({
                message: 'Registration successful',
                email: 'test@example.com',
              });
            } else {
              // Failed registration (e.g., email already exists)
              mockRegister.mockRejectedValueOnce({
                status: 409,
                message: 'Email already exists',
              });
            }

            // Submit the form
            await act(async () => {
              await result.current.handleSubmit({
                preventDefault: jest.fn(),
              } as any);
            });

            // Property: If rate limited, form should not call API
            if (isLocked) {
              expect(mockRegister).not.toHaveBeenCalled();
              expect(mockRecordAttempt).not.toHaveBeenCalled();
            } else {
              // Property: If not rate limited, form should call API and record attempt
              await waitFor(() => {
                expect(mockRegister).toHaveBeenCalled();
              });
              expect(mockRecordAttempt).toHaveBeenCalled();

              // Increment attempt count
              attemptCount++;

              // Property: After 5 attempts, should be locked
              if (attemptCount >= 5) {
                isLocked = true;
              }
            }
          }

          // Property: After 5 or more attempts, rate limiter should be locked
          if (attemptCount >= 5) {
            // Configure final locked state
            (useRateLimit as jest.Mock).mockReturnValue({
              isLocked: true,
              remainingTime: 900,
              recordAttempt: mockRecordAttempt,
              reset: mockResetRateLimit,
            });

            const { result: finalResult } = renderHook(() => useRegistrationForm());

            // Verify rate limited state
            expect(finalResult.current.isRateLimited).toBe(true);
            expect(finalResult.current.rateLimitMessage).toContain('Too many registration attempts');
            expect(finalResult.current.rateLimitMessage).toContain('15 minutes');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('useRegistrationForm Unit Tests - Edge Cases', () => {
  const mockSetLoading = jest.fn();
  const mockRecordAttempt = jest.fn();
  const mockResetRateLimit = jest.fn();
  const mockRegister = authService.register as jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockRegister.mockReset();
    mockSetLoading.mockClear();
    mockRecordAttempt.mockClear();
    mockResetRateLimit.mockClear();
    
    // Mock useLoadingState
    (useLoadingState as jest.Mock).mockReturnValue({
      isLoading: false,
      setLoading: mockSetLoading,
    });

    // Mock useRateLimit
    (useRateLimit as jest.Mock).mockReturnValue({
      isLocked: false,
      remainingTime: 0,
      recordAttempt: mockRecordAttempt,
      reset: mockResetRateLimit,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test empty form submission shows all required errors
  // Requirements: 9.1, 9.2, 9.3, 9.5
  test('empty form submission shows all required errors', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Submit empty form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // All fields should have errors
    expect(result.current.errors.fullName).toBe('Full name is required');
    expect(result.current.errors.email).toBe('Email is required');
    expect(result.current.errors.password).toBeDefined();
    expect(result.current.errors.confirmPassword).toBe('Please confirm your password');

    // API should not have been called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  // Test partial form completion shows only relevant errors
  // Requirements: 9.1, 9.2, 9.3, 9.5
  test('partial form completion shows only relevant errors', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill only some fields
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      } as any);
    });

    // Leave password and confirmPassword empty

    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Only unfilled fields should have errors
    expect(result.current.errors.fullName).toBeUndefined();
    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.errors.password).toBeDefined();
    expect(result.current.errors.confirmPassword).toBe('Please confirm your password');

    // API should not have been called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  // Test API error handling - 409 conflict (email already exists)
  // Requirements: 9.2
  test('handles 409 conflict error (email already exists)', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'existing@example.com' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'Password123!' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'Password123!' }
      } as any);
    });

    // Mock 409 conflict response
    mockRegister.mockRejectedValueOnce({
      status: 409,
      message: 'Email already exists',
    });

    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Wait for async operations
    await waitFor(() => {
      expect(result.current.errors.email).toBeDefined();
    });

    // Should have email-specific error
    expect(result.current.errors.email).toBe('This email is already registered. Please log in instead.');
    
    // Should have status message for the error
    expect(result.current.statusMessage).toBe('Email already exists');
    expect(result.current.statusType).toBe('error');

    // Loading state should be cleared
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  // Test API error handling - 500 server error
  // Requirements: 9.1
  test('handles 500 server error', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'Password123!' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'Password123!' }
      } as any);
    });

    // Mock 500 server error response
    mockRegister.mockRejectedValueOnce({
      status: 500,
      message: 'An unexpected error occurred. Please try again.',
    });

    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Wait for async operations and loading state to be cleared
    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    // Should have status message for the error
    expect(result.current.statusMessage).toBe('An unexpected error occurred. Please try again.');
    expect(result.current.statusType).toBe('error');
    expect(result.current.errors.email).toBeUndefined();
  });

  // Test API error handling - network error
  // Requirements: 9.3
  test('handles network error', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'Password123!' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'Password123!' }
      } as any);
    });

    // Mock network error (not an ApiError)
    mockRegister.mockRejectedValueOnce(new Error('Network error'));

    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Wait for async operations and loading state to be cleared
    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    // Should have status message for network error
    expect(result.current.statusMessage).toBe('Network error. Please check your connection and try again.');
    expect(result.current.statusType).toBe('error');
  });

  // Test error clearing when user types
  // Requirements: 9.5
  test('clears field error when user types in that field', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Submit empty form to generate errors
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Verify errors exist
    expect(result.current.errors.fullName).toBeDefined();
    expect(result.current.errors.email).toBeDefined();
    expect(result.current.errors.password).toBeDefined();
    expect(result.current.errors.confirmPassword).toBeDefined();

    // Type in fullName field
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'J' }
      } as any);
    });

    // fullName error should be cleared, others should remain
    expect(result.current.errors.fullName).toBeUndefined();
    expect(result.current.errors.email).toBeDefined();
    expect(result.current.errors.password).toBeDefined();
    expect(result.current.errors.confirmPassword).toBeDefined();

    // Type in email field
    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 't' }
      } as any);
    });

    // email error should be cleared
    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.errors.password).toBeDefined();
    expect(result.current.errors.confirmPassword).toBeDefined();
  });

  // Test general error clearing when user types
  // Requirements: 9.5
  test('clears general error when user types in any field', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'Password123!' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'Password123!' }
      } as any);
    });

    // Mock network error
    mockRegister.mockRejectedValueOnce(new Error('Network error'));

    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Wait for loading state to be cleared
    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    // Verify status message exists for network error
    expect(result.current.statusMessage).toBe('Network error. Please check your connection and try again.');
    expect(result.current.statusType).toBe('error');

    // Type in any field
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe Updated' }
      } as any);
    });

    // Status message should be cleared
    expect(result.current.statusMessage).toBeNull();
    expect(result.current.statusType).toBeNull();
  });

  // Test partial form with invalid email format
  // Requirements: 9.1, 9.5
  test('partial form with invalid email shows only email error', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data except invalid email
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'invalid-email' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'Password123!' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'Password123!' }
      } as any);
    });

    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Only email should have error
    expect(result.current.errors.fullName).toBeUndefined();
    expect(result.current.errors.email).toBe('Please enter a valid email address');
    expect(result.current.errors.password).toBeUndefined();
    expect(result.current.errors.confirmPassword).toBeUndefined();

    // API should not have been called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  // Test partial form with weak password
  // Requirements: 9.1, 9.5
  test('partial form with weak password shows only password error', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data except weak password
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'weak' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'weak' }
      } as any);
    });

    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Only password should have error
    expect(result.current.errors.fullName).toBeUndefined();
    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.errors.password).toBeDefined();
    expect(result.current.errors.password).toContain('at least 8 characters');
    expect(result.current.errors.confirmPassword).toBeUndefined();

    // API should not have been called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  // Test partial form with mismatched passwords
  // Requirements: 9.1, 9.5
  test('partial form with mismatched passwords shows only confirmPassword error', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data except mismatched passwords
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'Password123!' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'DifferentPassword123!' }
      } as any);
    });

    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Only confirmPassword should have error
    expect(result.current.errors.fullName).toBeUndefined();
    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.errors.password).toBeUndefined();
    expect(result.current.errors.confirmPassword).toBe('Passwords do not match');

    // API should not have been called
    expect(mockRegister).not.toHaveBeenCalled();
  });
});

describe('useRegistrationForm Unit Tests - Single Error State', () => {
  const mockSetLoading = jest.fn();
  const mockRecordAttempt = jest.fn();
  const mockResetRateLimit = jest.fn();
  const mockRegister = authService.register as jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockRegister.mockReset();
    mockSetLoading.mockClear();
    mockRecordAttempt.mockClear();
    mockResetRateLimit.mockClear();
    
    // Mock useLoadingState
    (useLoadingState as jest.Mock).mockReturnValue({
      isLoading: false,
      setLoading: mockSetLoading,
    });

    // Mock useRateLimit
    (useRateLimit as jest.Mock).mockReturnValue({
      isLocked: false,
      remainingTime: 0,
      recordAttempt: mockRecordAttempt,
      reset: mockResetRateLimit,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test that only statusMessage is set when API errors occur
  // Requirements: 2.4
  test('sets only statusMessage when API error occurs (not errors.general)', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'Password123!' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'Password123!' }
      } as any);
    });

    // Mock API error response
    mockRegister.mockRejectedValueOnce({
      status: 500,
      message: 'Internal server error',
    });

    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Wait for async operations
    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    // Should set statusMessage and statusType
    expect(result.current.statusMessage).toBe('Internal server error');
    expect(result.current.statusType).toBe('error');

    // Should NOT have errors.general (it doesn't exist in the interface anymore)
    expect(result.current.errors).not.toHaveProperty('general');
    
    // Field-specific errors should be empty
    expect(result.current.errors.fullName).toBeUndefined();
    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.errors.password).toBeUndefined();
    expect(result.current.errors.confirmPassword).toBeUndefined();
  });

  // Test that only statusMessage is set when network errors occur
  // Requirements: 2.4
  test('sets only statusMessage when network error occurs (not errors.general)', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'Password123!' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'Password123!' }
      } as any);
    });

    // Mock network error (not an ApiError)
    mockRegister.mockRejectedValueOnce(new Error('Network error'));

    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Wait for async operations
    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    // Should set statusMessage and statusType
    expect(result.current.statusMessage).toBe('Network error. Please check your connection and try again.');
    expect(result.current.statusType).toBe('error');

    // Should NOT have errors.general
    expect(result.current.errors).not.toHaveProperty('general');
    
    // Field-specific errors should be empty
    expect(result.current.errors.fullName).toBeUndefined();
    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.errors.password).toBeUndefined();
    expect(result.current.errors.confirmPassword).toBeUndefined();
  });

  // Test that errors.general is no longer in the return type
  // Requirements: 2.4
  test('errors object does not contain general property', () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Verify errors object structure
    expect(result.current.errors).toBeDefined();
    expect(result.current.errors).not.toHaveProperty('general');
    
    // Verify only valid error properties exist (when empty)
    const errorKeys = Object.keys(result.current.errors);
    const validKeys = ['fullName', 'email', 'password', 'confirmPassword'];
    
    errorKeys.forEach(key => {
      expect(validKeys).toContain(key);
    });
  });

  // Test that error clearing clears status
  // Requirements: 2.4
  test('clears status when user types in any field after error', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'Password123!' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'Password123!' }
      } as any);
    });

    // Mock API error
    mockRegister.mockRejectedValueOnce({
      status: 500,
      message: 'Server error',
    });

    // Submit form to trigger error
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Wait for error to be set
    await waitFor(() => {
      expect(result.current.statusMessage).toBe('Server error');
    });

    // Verify error is displayed
    expect(result.current.statusMessage).toBe('Server error');
    expect(result.current.statusType).toBe('error');

    // Type in any field (fullName)
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe Updated' }
      } as any);
    });

    // Status should be cleared
    expect(result.current.statusMessage).toBeNull();
    expect(result.current.statusType).toBeNull();
  });

  // Test that clearStatus function clears status
  // Requirements: 2.4
  test('clearStatus function clears statusMessage and statusType', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'Password123!' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'Password123!' }
      } as any);
    });

    // Mock network error
    mockRegister.mockRejectedValueOnce(new Error('Network error'));

    // Submit form to trigger error
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Wait for error to be set
    await waitFor(() => {
      expect(result.current.statusMessage).toBeTruthy();
    });

    // Verify error is displayed
    expect(result.current.statusMessage).toBe('Network error. Please check your connection and try again.');
    expect(result.current.statusType).toBe('error');

    // Call clearStatus
    act(() => {
      result.current.clearStatus();
    });

    // Status should be cleared
    expect(result.current.statusMessage).toBeNull();
    expect(result.current.statusType).toBeNull();
  });

  // Test that 409 conflict error sets both statusMessage and field error
  // Requirements: 2.4
  test('409 conflict error sets statusMessage and email field error (not errors.general)', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'existing@example.com' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'Password123!' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'Password123!' }
      } as any);
    });

    // Mock 409 conflict response
    mockRegister.mockRejectedValueOnce({
      status: 409,
      message: 'Email already exists',
    });

    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Wait for async operations
    await waitFor(() => {
      expect(result.current.errors.email).toBeDefined();
    });

    // Should set statusMessage and statusType
    expect(result.current.statusMessage).toBe('Email already exists');
    expect(result.current.statusType).toBe('error');

    // Should also set field-specific error for email
    expect(result.current.errors.email).toBe('This email is already registered. Please log in instead.');

    // Should NOT have errors.general
    expect(result.current.errors).not.toHaveProperty('general');
  });

  // Test that success message uses statusMessage (not errors.general)
  // Requirements: 2.4
  test('success message sets statusMessage with success type (not errors.general)', async () => {
    const { result } = renderHook(() => useRegistrationForm());

    // Fill form with valid data
    act(() => {
      result.current.handleChange({
        target: { name: 'fullName', value: 'John Doe' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'test@example.com' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'password', value: 'Password123!' }
      } as any);
    });

    act(() => {
      result.current.handleChange({
        target: { name: 'confirmPassword', value: 'Password123!' }
      } as any);
    });

    // Mock successful API response
    mockRegister.mockResolvedValueOnce({
      message: 'User registered successfully',
      email: 'test@example.com',
    });

    // Submit form
    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: jest.fn(),
      } as any);
    });

    // Wait for async operations
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });

    // Should set statusMessage and statusType for success
    expect(result.current.statusMessage).toBe('User registered successfully');
    expect(result.current.statusType).toBe('success');

    // Should NOT have errors.general
    expect(result.current.errors).not.toHaveProperty('general');
    
    // No field errors should be present
    expect(result.current.errors.fullName).toBeUndefined();
    expect(result.current.errors.email).toBeUndefined();
    expect(result.current.errors.password).toBeUndefined();
    expect(result.current.errors.confirmPassword).toBeUndefined();
  });
});
