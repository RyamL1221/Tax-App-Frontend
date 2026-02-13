/**
 * Tests for useLoginForm hook
 * 
 * Covers:
 * - Form registration and validation
 * - Password visibility toggle
 * - Form submission handling
 * - Rate limiting integration
 * - Authentication API calls via authService
 * - Loading and error states
 * - Field error clearing
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useLoginForm } from './useLoginForm';
import { AuthResponse } from '@/types/auth';

// Mock the useRateLimit hook
jest.mock('./useRateLimit', () => ({
  useRateLimit: jest.fn(),
}));

// Mock the API client
jest.mock('@/lib/api', () => ({
  authService: {
    login: jest.fn(),
  },
  isApiError: jest.fn(),
}));

// Import the mocked modules to access mock functions
import { useRateLimit } from './useRateLimit';
import { authService, isApiError } from '@/lib/api';

/**
 * Helper function to mock authService.login with status callback support
 */
function mockLoginWithStatus(result: any) {
  return (authService.login as jest.MockedFunction<typeof authService.login>).mockImplementation(
    async (data, onStatusChange) => {
      if (result.success) {
        onStatusChange?.({ state: 'authenticating', message: 'Authenticating...' });
        onStatusChange?.({ state: 'success', message: 'Login successful!' });
      } else {
        onStatusChange?.({ state: 'error', message: result.error });
      }
      return result;
    }
  );
}

describe('useLoginForm', () => {
  // Mock authService.login
  const mockLogin = authService.login as jest.MockedFunction<typeof authService.login>;
  const mockIsApiError = isApiError as jest.MockedFunction<typeof isApiError>;
  
  beforeEach(() => {
    mockLogin.mockClear();
    mockIsApiError.mockClear();
    jest.clearAllMocks();
    
    // Reset useRateLimit mock to default state
    (useRateLimit as jest.Mock).mockReturnValue({
      isLocked: false,
      remainingTime: 0,
      attempts: 0,
      recordAttempt: jest.fn(),
      reset: jest.fn(),
    });
    
    // Default isApiError to return false (network errors)
    mockIsApiError.mockReturnValue(false);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('Form Registration and Validation', () => {
    it('should initialize with empty form state', () => {
      const { result } = renderHook(() => useLoginForm());
      
      expect(result.current.errors).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.status).toEqual({ state: 'idle', message: '' });
    });
    
    it('should provide register function for form fields', () => {
      const { result } = renderHook(() => useLoginForm());
      
      expect(result.current.register).toBeDefined();
      expect(typeof result.current.register).toBe('function');
    });
    
    it('should provide handleSubmit function', () => {
      const { result } = renderHook(() => useLoginForm());
      
      expect(result.current.handleSubmit).toBeDefined();
      expect(typeof result.current.handleSubmit).toBe('function');
    });
  });
  
  describe('Password Visibility Toggle', () => {
    it('should initialize with password hidden', () => {
      const { result } = renderHook(() => useLoginForm());
      
      expect(result.current.showPassword).toBe(false);
    });
    
    it('should toggle password visibility', () => {
      const { result } = renderHook(() => useLoginForm());
      
      expect(result.current.showPassword).toBe(false);
      
      act(() => {
        result.current.togglePasswordVisibility();
      });
      
      expect(result.current.showPassword).toBe(true);
      
      act(() => {
        result.current.togglePasswordVisibility();
      });
      
      expect(result.current.showPassword).toBe(false);
    });
  });
  
  describe('Form Submission - Successful Authentication', () => {
    it('should call authService.login with correct credentials', async () => {
      mockLogin.mockResolvedValueOnce({
        success: true,
        token: 'mock-jwt-token',
        email: 'test@example.com',
        userId: 'user-123',
      });
      
      const { result } = renderHook(() => useLoginForm());
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'password123',
        });
      });
      
      expect(mockLogin).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'password123',
        },
        expect.any(Function),
        expect.any(String) // traceId
      );
    });
    
    it('should call onSuccess callback with /dashboard on successful authentication', async () => {
      jest.useFakeTimers();
      
      mockLogin.mockResolvedValueOnce({
        success: true,
        token: 'mock-jwt-token',
        email: 'test@example.com',
        userId: 'user-123',
      });
      
      const onSuccess = jest.fn();
      const { result } = renderHook(() => useLoginForm({ onSuccess }));
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'password123',
        });
      });
      
      // Wait for the 500ms delay before redirect
      act(() => {
        jest.advanceTimersByTime(500);
      });
      
      expect(onSuccess).toHaveBeenCalledWith('/dashboard');
      
      jest.useRealTimers();
    });
    
    it('should reset rate limit on successful authentication', async () => {
      const mockReset = jest.fn();
      (useRateLimit as jest.Mock).mockReturnValue({
        isLocked: false,
        remainingTime: 0,
        attempts: 0,
        recordAttempt: jest.fn(),
        reset: mockReset,
      });
      
      mockLogin.mockResolvedValueOnce({
        success: true,
        token: 'mock-jwt-token',
        email: 'test@example.com',
        userId: 'user-123',
      });
      
      const { result } = renderHook(() => useLoginForm());
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'password123',
        });
      });
      
      expect(mockReset).toHaveBeenCalled();
    });
  });
  
  describe('Form Submission - Failed Authentication', () => {
    it('should set status with error message on authentication failure', async () => {
      const loginResult = {
        success: false,
        error: 'Invalid email or password',
      };
      
      // Mock login to call the status callback with error
      mockLogin.mockImplementation(async (data, onStatusChange) => {
        onStatusChange?.({ state: 'error', message: 'Invalid email or password' });
        return loginResult;
      });
      
      const { result } = renderHook(() => useLoginForm());
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      });
      
      expect(result.current.status).toEqual({
        state: 'error',
        message: 'Invalid email or password'
      });
    });
    
    it('should call onError callback on authentication failure', async () => {
      const loginResult = {
        success: false,
        error: 'Invalid email or password',
      };
      
      mockLogin.mockResolvedValueOnce(loginResult);
      
      const onError = jest.fn();
      const { result } = renderHook(() => useLoginForm({ onError }));
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      });
      
      expect(onError).toHaveBeenCalledWith({
        type: 'authentication',
        message: 'Invalid email or password',
      });
    });
    
    it('should record attempt on authentication failure (401 error)', async () => {
      const mockRecordAttempt = jest.fn();
      (useRateLimit as jest.Mock).mockReturnValue({
        isLocked: false,
        remainingTime: 0,
        attempts: 0,
        recordAttempt: mockRecordAttempt,
        reset: jest.fn(),
      });
      
      const loginResult = {
        success: false,
        error: 'Invalid email or password',
      };
      
      mockLogin.mockResolvedValueOnce(loginResult);
      
      const { result } = renderHook(() => useLoginForm());
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      });
      
      expect(mockRecordAttempt).toHaveBeenCalled();
    });
  });
  
  describe('Form Submission - Network Errors', () => {
    it('should set status with connection error message when network fails', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Network error'));
      mockIsApiError.mockReturnValue(false);
      
      const { result } = renderHook(() => useLoginForm());
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'password123',
        });
      });
      
      expect(result.current.status).toEqual({
        state: 'error',
        message: 'Unable to connect. Please check your connection and try again'
      });
    });
    
    it('should call onError callback on network error', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Network error'));
      mockIsApiError.mockReturnValue(false);
      
      const onError = jest.fn();
      const { result } = renderHook(() => useLoginForm({ onError }));
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'password123',
        });
      });
      
      expect(onError).toHaveBeenCalledWith({
        type: 'network',
        message: 'Unable to connect. Please check your connection and try again',
      });
    });
  });
  
  /**
   * Unit Tests for Authentication Scenarios (Task 5.4)
   * 
   * These tests specifically validate Requirements 1.2, 1.3, and 1.4
   * for authentication flow handling.
   */
  describe('Authentication Scenarios (Requirements 1.2, 1.3, 1.4)', () => {
    /**
     * Requirement 1.2: Successful authentication flow
     * WHEN authentication succeeds, THE Login_Page SHALL redirect the user 
     * to the dashboard or home page
     */
    describe('Successful Authentication (Requirement 1.2)', () => {
      it('should redirect to dashboard on successful authentication', async () => {
        jest.useFakeTimers();
        
        mockLogin.mockResolvedValueOnce({
          success: true,
          token: 'mock-jwt-token',
          email: 'user@example.com',
          userId: 'user-123',
        });
        
        const onSuccess = jest.fn();
        const { result } = renderHook(() => useLoginForm({ onSuccess }));
        
        await act(async () => {
          await result.current.onSubmit({
            email: 'user@example.com',
            password: 'validpassword',
          });
        });
        
        // Wait for the 500ms delay before redirect
        act(() => {
          jest.advanceTimersByTime(500);
        });
        
        // Verify redirect URL is passed to onSuccess callback
        expect(onSuccess).toHaveBeenCalledWith('/dashboard');
        expect(onSuccess).toHaveBeenCalledTimes(1);
        
        jest.useRealTimers();
      });
      
      it('should clear any previous errors on successful authentication', async () => {
        // First attempt - fail
        const loginResult = {
          success: false,
          error: 'Invalid email or password',
        };
        
        mockLoginWithStatus(loginResult);
        
        const { result } = renderHook(() => useLoginForm());
        
        await act(async () => {
          await result.current.onSubmit({
            email: 'user@example.com',
            password: 'wrongpassword',
          });
        });
        
        expect(result.current.status).toEqual({
          state: 'error',
          message: 'Invalid email or password'
        });
        
        // Second attempt - succeed
        mockLoginWithStatus({
          success: true,
          token: 'mock-jwt-token',
          email: 'user@example.com',
          userId: 'user-123',
        });
        
        await act(async () => {
          await result.current.onSubmit({
            email: 'user@example.com',
            password: 'correctpassword',
          });
        });
        
        // Status should be set to success (not error)
        expect(result.current.status.state).not.toBe('error');
      });
    });
    
    /**
     * Requirement 1.3: Failed authentication error display
     * WHEN authentication fails, THE Login_Page SHALL display an error message 
     * indicating invalid credentials
     */
    describe('Failed Authentication (Requirement 1.3)', () => {
      it('should set status with error message on authentication failure', async () => {
        const loginResult = {
          success: false,
          error: 'Invalid email or password',
        };
        
        mockLoginWithStatus(loginResult);
        
        const { result } = renderHook(() => useLoginForm());
        
        await act(async () => {
          await result.current.onSubmit({
            email: 'user@example.com',
            password: 'wrongpassword',
          });
        });
        
        // Verify status is set with error
        expect(result.current.status).toEqual({
          state: 'error',
          message: 'Invalid email or password'
        });
      });
      
      it('should trigger onError callback with authentication error details', async () => {
        const loginResult = {
          success: false,
          error: 'Invalid email or password',
        };
        
        mockLogin.mockResolvedValueOnce(loginResult);
        
        const onError = jest.fn();
        const { result } = renderHook(() => useLoginForm({ onError }));
        
        await act(async () => {
          await result.current.onSubmit({
            email: 'user@example.com',
            password: 'wrongpassword',
          });
        });
        
        // Verify onError callback receives correct error object
        expect(onError).toHaveBeenCalledWith({
          type: 'authentication',
          message: 'Invalid email or password',
        });
        expect(onError).toHaveBeenCalledTimes(1);
      });
      
      it('should not clear status until user starts typing or submits again', async () => {
        const loginResult = {
          success: false,
          error: 'Invalid email or password',
        };
        
        mockLoginWithStatus(loginResult);
        
        const { result } = renderHook(() => useLoginForm());
        
        await act(async () => {
          await result.current.onSubmit({
            email: 'user@example.com',
            password: 'wrongpassword',
          });
        });
        
        // Status should persist
        expect(result.current.status).toEqual({
          state: 'error',
          message: 'Invalid email or password'
        });
        
        // Status should still be there after some time
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(result.current.status).toEqual({
          state: 'error',
          message: 'Invalid email or password'
        });
      });
    });
    
    /**
     * Requirement 1.4: Network error handling
     * WHEN the Authentication_System is unavailable, THE Login_Page SHALL 
     * display an error message indicating a connection problem
     */
    describe('Network Error Handling (Requirement 1.4)', () => {
      it('should set status with connection error message when network fails', async () => {
        mockLogin.mockRejectedValueOnce(new Error('Failed to fetch'));
        mockIsApiError.mockReturnValue(false);
        
        const { result } = renderHook(() => useLoginForm());
        
        await act(async () => {
          await result.current.onSubmit({
            email: 'user@example.com',
            password: 'password123',
          });
        });
        
        // Verify status is set with connection error
        expect(result.current.status).toEqual({
          state: 'error',
          message: 'Unable to connect. Please check your connection and try again'
        });
      });
      
      it('should set status with connection error message when server is unavailable', async () => {
        mockLogin.mockRejectedValueOnce(new Error('Network request failed'));
        mockIsApiError.mockReturnValue(false);
        
        const { result } = renderHook(() => useLoginForm());
        
        await act(async () => {
          await result.current.onSubmit({
            email: 'user@example.com',
            password: 'password123',
          });
        });
        
        // Verify status is set with connection error
        expect(result.current.status).toEqual({
          state: 'error',
          message: 'Unable to connect. Please check your connection and try again'
        });
      });
      
      it('should trigger onError callback with network error details', async () => {
        mockLogin.mockRejectedValueOnce(new Error('Connection timeout'));
        mockIsApiError.mockReturnValue(false);
        
        const onError = jest.fn();
        const { result } = renderHook(() => useLoginForm({ onError }));
        
        await act(async () => {
          await result.current.onSubmit({
            email: 'user@example.com',
            password: 'password123',
          });
        });
        
        // Verify onError callback receives correct error object
        expect(onError).toHaveBeenCalledWith({
          type: 'network',
          message: 'Unable to connect. Please check your connection and try again',
        });
        expect(onError).toHaveBeenCalledTimes(1);
      });
    });
  });
  
  describe('Rate Limiting Integration', () => {
    it('should prevent submission when rate limited', async () => {
      (useRateLimit as jest.Mock).mockReturnValue({
        isLocked: true,
        remainingTime: 45,
        attempts: 5,
        recordAttempt: jest.fn(),
        reset: jest.fn(),
      });
      
      const { result } = renderHook(() => useLoginForm());
      
      expect(result.current.isRateLimited).toBe(true);
      expect(result.current.rateLimitRemainingTime).toBe(45);
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'password123',
        });
      });
      
      // Should not call authService.login when rate limited
      expect(mockLogin).not.toHaveBeenCalled();
      
      // Should set status with rate limit error
      expect(result.current.status.state).toBe('error');
      expect(result.current.status.message).toContain('Too many attempts');
      expect(result.current.status.message).toContain('45 seconds');
    });
    
    it('should call onError callback when rate limited', async () => {
      (useRateLimit as jest.Mock).mockReturnValue({
        isLocked: true,
        remainingTime: 30,
        attempts: 5,
        recordAttempt: jest.fn(),
        reset: jest.fn(),
      });
      
      const onError = jest.fn();
      const { result } = renderHook(() => useLoginForm({ onError }));
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'password123',
        });
      });
      
      expect(onError).toHaveBeenCalledWith({
        type: 'rate_limit',
        message: 'Too many attempts. Please wait 30 seconds before trying again',
      });
    });
  });
  
  describe('Field Error Clearing', () => {
    it('should provide clearFieldError function', () => {
      const { result } = renderHook(() => useLoginForm());
      
      expect(result.current.clearFieldError).toBeDefined();
      expect(typeof result.current.clearFieldError).toBe('function');
    });
    
    it('should clear status when clearFieldError is called', async () => {
      const loginResult = {
        success: false,
        error: 'Invalid email or password',
      };
      
      mockLoginWithStatus(loginResult);
      
      const { result } = renderHook(() => useLoginForm());
      
      // Submit form to generate error
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      });
      
      expect(result.current.status).toEqual({
        state: 'error',
        message: 'Invalid email or password'
      });
      
      // Clear field error
      act(() => {
        result.current.clearFieldError('email');
      });
      
      expect(result.current.status).toEqual({ state: 'idle', message: '' });
    });
  });
  
  describe('Loading State Management', () => {
    it('should manage isSubmitting state during form submission', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockLogin.mockReturnValue(promise as any);
      
      const { result } = renderHook(() => useLoginForm());
      
      expect(result.current.isSubmitting).toBe(false);
      
      // Start submission
      act(() => {
        result.current.handleSubmit(result.current.onSubmit)({
          preventDefault: jest.fn(),
        } as any);
      });
      
      // Should be submitting
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });
      
      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          token: 'mock-jwt-token',
          email: 'test@example.com',
          userId: 'user-123',
        });
      });
      
      // Should no longer be submitting
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });
  });
  
  describe('Error State Clearing', () => {
    it('should clear previous status on new submission', async () => {
      // First submission - fails
      const loginResult = {
        success: false,
        error: 'Invalid email or password',
      };
      
      mockLoginWithStatus(loginResult);
      
      const { result } = renderHook(() => useLoginForm());
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      });
      
      expect(result.current.status).toEqual({
        state: 'error',
        message: 'Invalid email or password'
      });
      
      // Second submission - succeeds
      mockLoginWithStatus({
        success: true,
        token: 'mock-jwt-token',
        email: 'test@example.com',
        userId: 'user-123',
      });
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'correctpassword',
        });
      });
      
      // Status should not be in error state
      expect(result.current.status.state).not.toBe('error');
    });
  });
});

/**
 * Property-Based Tests for useLoginForm
 * 
 * These tests verify universal properties that should hold true
 * across all possible inputs and execution paths.
 */
describe('useLoginForm Property-Based Tests', () => {
  // Mock authService.login
  const mockLogin = authService.login as jest.MockedFunction<typeof authService.login>;
  const mockIsApiError = isApiError as jest.MockedFunction<typeof isApiError>;
  
  beforeEach(() => {
    mockLogin.mockClear();
    mockIsApiError.mockClear();
    jest.clearAllMocks();
    
    // Reset useRateLimit mock to default state
    (useRateLimit as jest.Mock).mockReturnValue({
      isLocked: false,
      remainingTime: 0,
      attempts: 0,
      recordAttempt: jest.fn(),
      reset: jest.fn(),
    });
    
    // Default isApiError to return false (network errors)
    mockIsApiError.mockReturnValue(false);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  // Feature: login-page, Property 6: Form submission state management
  // **Validates: Requirements 3.1, 3.2, 3.3**
  test('property: form submission state transitions correctly for any submission outcome', async () => {
    const fc = require('fast-check');
    
    // Suppress console errors for this test since errors are expected
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    try {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary email and password
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 100 }),
          // Generate arbitrary submission outcome (success or failure)
          fc.boolean(), // true = success, false = failure
          fc.boolean(), // if failure, true = API error, false = network error
          async (email, password, isSuccess, isApiError) => {
            // Setup: Mock the authService response
            if (isSuccess) {
              mockLogin.mockResolvedValueOnce({
                success: true,
                token: 'mock-jwt-token',
                email: email,
                userId: 'user-123',
              });
            } else if (isApiError) {
              mockLogin.mockResolvedValueOnce({
                success: false,
                error: 'Invalid email or password',
              });
            } else {
              // Network error - throw exception
              mockLogin.mockRejectedValueOnce({ message: 'Network error' });
            }
            
            const { result } = renderHook(() => useLoginForm());
            
            // Property: Before submission, form should not be submitting
            expect(result.current.isSubmitting).toBe(false);
            
            // Submit the form
            await act(async () => {
              await result.current.onSubmit({
                email,
                password,
              });
            });
            
            // Property: After submission completes (success or failure),
            // form should no longer be submitting
            expect(result.current.isSubmitting).toBe(false);
            
            // Cleanup
            mockLogin.mockClear();
            mockIsApiError.mockClear();
          }
        ),
        { numRuns: 50 } // Reduced runs for faster execution
      );
    } finally {
      // Restore console.error
      consoleErrorSpy.mockRestore();
    }
  });
  
  // Feature: login-page, Property 7: Field error clearing on input
  // **Validates: Requirements 3.4**
  test('property: typing in a field with an error clears status', async () => {
    const fc = require('fast-check');
    
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary field to clear ('email' or 'password')
        fc.constantFrom('email' as const, 'password' as const),
        async (fieldToClear) => {
          // Setup: Create a hook instance with an authentication error
          const loginResult = {
            success: false,
            error: 'Invalid email or password',
          };
          
          mockLoginWithStatus(loginResult);
          
          const { result } = renderHook(() => useLoginForm());
          
          // Submit form to generate an authentication error
          await act(async () => {
            await result.current.onSubmit({
              email: 'test@example.com',
              password: 'password123',
            });
          });
          
          // Property: After failed submission, status should be in error state
          expect(result.current.status.state).toBe('error');
          expect(result.current.status.message).toBe('Invalid email or password');
          
          // Simulate user typing in the specified field by calling clearFieldError
          act(() => {
            result.current.clearFieldError(fieldToClear);
          });
          
          // Property: After clearing a field error, the status should be cleared
          expect(result.current.status).toEqual({ state: 'idle', message: '' });
          
          // Cleanup
          mockLogin.mockClear();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Unit Tests for Task 1.4: Single Error State
 * 
 * These tests verify that useLoginForm uses only the status state
 * for error display, and that authError is no longer in the return type.
 * 
 * **Validates: Requirements 2.3**
 */
describe('useLoginForm Single Error State (Task 1.4)', () => {
  const mockLogin = authService.login as jest.MockedFunction<typeof authService.login>;
  const mockIsApiError = isApiError as jest.MockedFunction<typeof isApiError>;
  
  beforeEach(() => {
    mockLogin.mockClear();
    mockIsApiError.mockClear();
    jest.clearAllMocks();
    
    (useRateLimit as jest.Mock).mockReturnValue({
      isLocked: false,
      remainingTime: 0,
      attempts: 0,
      recordAttempt: jest.fn(),
      reset: jest.fn(),
    });
    
    mockIsApiError.mockReturnValue(false);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('Return Type Verification', () => {
    it('should not include authError in return type', () => {
      const { result } = renderHook(() => useLoginForm());
      
      // Verify authError is not in the return object
      expect('authError' in result.current).toBe(false);
      
      // Verify status is in the return object
      expect('status' in result.current).toBe(true);
      expect(result.current.status).toBeDefined();
    });
    
    it('should include status with correct structure', () => {
      const { result } = renderHook(() => useLoginForm());
      
      expect(result.current.status).toHaveProperty('state');
      expect(result.current.status).toHaveProperty('message');
      expect(result.current.status.state).toBe('idle');
      expect(result.current.status.message).toBe('');
    });
  });
  
  describe('Error Handling with Status Only', () => {
    it('should set only status (not authError) when authentication fails', async () => {
      const loginResult = {
        success: false,
        error: 'Invalid email or password',
      };
      
      mockLoginWithStatus(loginResult);
      
      const { result } = renderHook(() => useLoginForm());
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      });
      
      // Verify status is set
      expect(result.current.status).toEqual({
        state: 'error',
        message: 'Invalid email or password'
      });
      
      // Verify authError does not exist
      expect('authError' in result.current).toBe(false);
    });
    
    it('should set only status (not authError) when network error occurs', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Network error'));
      mockIsApiError.mockReturnValue(false);
      
      const { result } = renderHook(() => useLoginForm());
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'password123',
        });
      });
      
      // Verify status is set
      expect(result.current.status).toEqual({
        state: 'error',
        message: 'Unable to connect. Please check your connection and try again'
      });
      
      // Verify authError does not exist
      expect('authError' in result.current).toBe(false);
    });
    
    it('should set only status (not authError) when rate limited', async () => {
      (useRateLimit as jest.Mock).mockReturnValue({
        isLocked: true,
        remainingTime: 30,
        attempts: 5,
        recordAttempt: jest.fn(),
        reset: jest.fn(),
      });
      
      const { result } = renderHook(() => useLoginForm());
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'password123',
        });
      });
      
      // Verify status is set
      expect(result.current.status.state).toBe('error');
      expect(result.current.status.message).toContain('Too many attempts');
      
      // Verify authError does not exist
      expect('authError' in result.current).toBe(false);
    });
  });
  
  describe('Error Clearing with Status', () => {
    it('should clear status when clearFieldError is called', async () => {
      const loginResult = {
        success: false,
        error: 'Invalid email or password',
      };
      
      mockLoginWithStatus(loginResult);
      
      const { result } = renderHook(() => useLoginForm());
      
      // Generate error
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      });
      
      // Verify error is set
      expect(result.current.status.state).toBe('error');
      
      // Clear field error
      act(() => {
        result.current.clearFieldError('email');
      });
      
      // Verify status is cleared
      expect(result.current.status).toEqual({ state: 'idle', message: '' });
    });
    
    it('should clear status on new submission', async () => {
      // First submission - fails
      mockLoginWithStatus({
        success: false,
        error: 'Invalid email or password',
      });
      
      const { result } = renderHook(() => useLoginForm());
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'wrongpassword',
        });
      });
      
      // Verify error is set
      expect(result.current.status.state).toBe('error');
      
      // Second submission - succeeds
      mockLoginWithStatus({
        success: true,
        token: 'mock-jwt-token',
        email: 'test@example.com',
        userId: 'user-123',
      });
      
      await act(async () => {
        await result.current.onSubmit({
          email: 'test@example.com',
          password: 'correctpassword',
        });
      });
      
      // Verify status is no longer in error state
      expect(result.current.status.state).not.toBe('error');
    });
  });
});
