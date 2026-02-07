/**
 * Integration tests for Rate Limiting Flow - Fix Form Submission
 * 
 * These tests validate the complete rate limiting flow including:
 * - Rate limiting activation after failed attempts
 * - Countdown display to user
 * - Button disabled state during rate limiting
 * - Rate limit reset after successful submission
 * - Rate limit counter increment on failed attempts
 * 
 * Feature: fix-form-submission
 * Requirements tested: 8.1, 8.2, 8.4, 8.5
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { RegistrationForm } from './RegistrationForm';
import { authService } from '@/lib/api';

// Mock the auth service
jest.mock('@/lib/api', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
  isApiError: jest.fn(),
}));

describe('Rate Limiting Flow - Integration Tests', () => {
  // Increase timeout for rate limiting tests as they involve multiple submissions
  jest.setTimeout(15000);

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sessionStorage.clear();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('6.4: Rate limiting flow', () => {
    describe('Login Form Rate Limiting', () => {
      test('should activate rate limiting after 5 failed attempts', async () => {
        const mockOnSuccess = jest.fn();
        
        render(<LoginForm onSuccess={mockOnSuccess} />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        // Make 5 failed attempts
        for (let i = 0; i < 5; i++) {
          // Mock failed authentication
          const mockError = new Error('Invalid email or password');
          (mockError as any).statusCode = 401;
          (authService.login as jest.Mock).mockRejectedValueOnce(mockError);

          // Clear and fill form
          await userEvent.clear(emailInput);
          await userEvent.clear(passwordInput);
          await userEvent.type(emailInput, `attempt${i}@example.com`);
          await userEvent.type(passwordInput, 'wrongpass');
          
          await act(async () => {
            await userEvent.click(submitButton);
          });

          // Wait for error
          await waitFor(() => {
            const alerts = screen.queryAllByRole('alert');
            expect(alerts.length).toBeGreaterThan(0);
          });
        }

        // Verify rate limit is now active
        await waitFor(() => {
          expect(submitButton).toBeDisabled();
          expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
        });

        // Verify API was called 5 times
        expect(authService.login).toHaveBeenCalledTimes(5);

        // Try to submit again - should be prevented
        await act(async () => {
          await userEvent.click(submitButton);
        });

        // API should still only have been called 5 times
        expect(authService.login).toHaveBeenCalledTimes(5);
      }, 10000);

      test('should display countdown timer during rate limiting', async () => {
        const mockOnSuccess = jest.fn();
        
        render(<LoginForm onSuccess={mockOnSuccess} />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        // Make 5 failed attempts to trigger rate limiting
        for (let i = 0; i < 5; i++) {
          const mockError = new Error('Invalid email or password');
          (mockError as any).statusCode = 401;
          (authService.login as jest.Mock).mockRejectedValueOnce(mockError);

          await userEvent.clear(emailInput);
          await userEvent.clear(passwordInput);
          await userEvent.type(emailInput, `test${i}@example.com`);
          await userEvent.type(passwordInput, 'wrongpass');
          
          await act(async () => {
            await userEvent.click(submitButton);
          });

          await waitFor(() => {
            expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
          });
        }

        // Verify rate limit message with countdown is displayed
        await waitFor(() => {
          expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
          expect(screen.getByText(/\d+ seconds/i)).toBeInTheDocument();
        });

        // Advance time by 10 seconds
        act(() => {
          jest.advanceTimersByTime(10000);
        });

        // Countdown should update
        await waitFor(() => {
          const countdownText = screen.getByText(/\d+ seconds/i).textContent;
          expect(countdownText).toMatch(/\d+ seconds/);
        });
      });

      test('should disable submit button during rate limiting', async () => {
        const mockOnSuccess = jest.fn();
        
        render(<LoginForm onSuccess={mockOnSuccess} />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        // Verify button is initially enabled
        expect(submitButton).not.toBeDisabled();

        // Make 5 failed attempts
        for (let i = 0; i < 5; i++) {
          const mockError = new Error('Invalid email or password');
          (mockError as any).statusCode = 401;
          (authService.login as jest.Mock).mockRejectedValueOnce(mockError);

          await userEvent.clear(emailInput);
          await userEvent.clear(passwordInput);
          await userEvent.type(emailInput, `test${i}@example.com`);
          await userEvent.type(passwordInput, 'wrongpass');
          
          await act(async () => {
            await userEvent.click(submitButton);
          });

          await waitFor(() => {
            expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
          });
        }

        // Verify button is now disabled
        await waitFor(() => {
          expect(submitButton).toBeDisabled();
        });

        // Verify inputs are also disabled
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
      });

      test('should increment rate limit counter on each failed attempt', async () => {
        const mockOnSuccess = jest.fn();
        
        render(<LoginForm onSuccess={mockOnSuccess} />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        // Make failed attempts and verify counter increments
        for (let i = 1; i <= 5; i++) {
          const mockError = new Error('Invalid email or password');
          (mockError as any).statusCode = 401;
          (authService.login as jest.Mock).mockRejectedValueOnce(mockError);

          await userEvent.clear(emailInput);
          await userEvent.clear(passwordInput);
          await userEvent.type(emailInput, `test${i}@example.com`);
          await userEvent.type(passwordInput, 'wrongpass');
          
          await act(async () => {
            await userEvent.click(submitButton);
          });

          await waitFor(() => {
            expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
          });

          // Check sessionStorage for rate limit data
          const rateLimitData = sessionStorage.getItem('loginAttempts');
          expect(rateLimitData).toBeTruthy();
          
          if (rateLimitData) {
            const data = JSON.parse(rateLimitData);
            expect(data.count).toBe(i);
          }
        }

        // After 5 attempts, rate limiting should be active
        await waitFor(() => {
          expect(submitButton).toBeDisabled();
          expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
        });
      });

      test('should reset rate limit counter after successful submission', async () => {
        const mockOnSuccess = jest.fn();
        
        render(<LoginForm onSuccess={mockOnSuccess} />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        // Make 3 failed attempts
        for (let i = 0; i < 3; i++) {
          const mockError = new Error('Invalid email or password');
          (mockError as any).statusCode = 401;
          (authService.login as jest.Mock).mockRejectedValueOnce(mockError);

          await userEvent.clear(emailInput);
          await userEvent.clear(passwordInput);
          await userEvent.type(emailInput, `test${i}@example.com`);
          await userEvent.type(passwordInput, 'wrongpass');
          
          await act(async () => {
            await userEvent.click(submitButton);
          });

          await waitFor(() => {
            expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
          });
        }

        // Verify counter is at 3
        const rateLimitData = sessionStorage.getItem('loginAttempts');
        expect(rateLimitData).toBeTruthy();
        if (rateLimitData) {
          const data = JSON.parse(rateLimitData);
          expect(data.count).toBe(3);
        }

        // Now make a successful attempt
        (authService.login as jest.Mock).mockResolvedValueOnce({
          token: 'mock-token',
          email: 'test@example.com',
          userId: 'user-123',
        });

        await userEvent.clear(emailInput);
        await userEvent.clear(passwordInput);
        await userEvent.type(emailInput, 'test@example.com');
        await userEvent.type(passwordInput, 'SecurePass123!');
        
        await act(async () => {
          await userEvent.click(submitButton);
        });

        // Wait for success
        await waitFor(() => {
          expect(mockOnSuccess).toHaveBeenCalledWith('/dashboard');
        });

        // Verify rate limit counter is reset
        const resetData = sessionStorage.getItem('loginAttempts');
        if (resetData) {
          const data = JSON.parse(resetData);
          expect(data.count).toBe(0);
        }
      });

      test('should allow submission after rate limit expires', async () => {
        const mockOnSuccess = jest.fn();
        
        render(<LoginForm onSuccess={mockOnSuccess} />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        // Make 5 failed attempts to trigger rate limiting
        for (let i = 0; i < 5; i++) {
          const mockError = new Error('Invalid email or password');
          (mockError as any).statusCode = 401;
          (authService.login as jest.Mock).mockRejectedValueOnce(mockError);

          await userEvent.clear(emailInput);
          await userEvent.clear(passwordInput);
          await userEvent.type(emailInput, `test${i}@example.com`);
          await userEvent.type(passwordInput, 'wrongpass');
          
          await act(async () => {
            await userEvent.click(submitButton);
          });

          await waitFor(() => {
            expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
          });
        }

        // Verify rate limiting is active
        await waitFor(() => {
          expect(submitButton).toBeDisabled();
          expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
        });

        // Advance time past the rate limit duration (60 seconds)
        act(() => {
          jest.advanceTimersByTime(61000);
        });

        // Wait for rate limit to expire
        await waitFor(() => {
          expect(submitButton).not.toBeDisabled();
          expect(screen.queryByText(/too many attempts/i)).not.toBeInTheDocument();
        });

        // Now should be able to submit again
        (authService.login as jest.Mock).mockResolvedValueOnce({
          token: 'mock-token',
          email: 'test@example.com',
          userId: 'user-123',
        });

        await userEvent.clear(emailInput);
        await userEvent.clear(passwordInput);
        await userEvent.type(emailInput, 'test@example.com');
        await userEvent.type(passwordInput, 'SecurePass123!');
        
        await act(async () => {
          await userEvent.click(submitButton);
        });

        // Verify submission succeeds
        await waitFor(() => {
          expect(mockOnSuccess).toHaveBeenCalledWith('/dashboard');
        });
      });
    });

    describe('Registration Form Rate Limiting', () => {
      test('should activate rate limiting after multiple failed attempts', async () => {
        const mockOnSuccess = jest.fn();
        
        render(<RegistrationForm onSuccess={mockOnSuccess} />);

        const fullNameInput = screen.getByLabelText(/full name/i);
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /create account/i });

        // Make 5 failed attempts
        for (let i = 0; i < 5; i++) {
          const mockError = new Error('Registration failed');
          (mockError as any).statusCode = 500;
          (authService.register as jest.Mock).mockRejectedValueOnce(mockError);

          await userEvent.clear(fullNameInput);
          await userEvent.clear(emailInput);
          await userEvent.clear(passwordInput);
          await userEvent.clear(confirmPasswordInput);
          
          await userEvent.type(fullNameInput, `User ${i}`);
          await userEvent.type(emailInput, `test${i}@example.com`);
          await userEvent.type(passwordInput, 'SecurePass123!');
          await userEvent.type(confirmPasswordInput, 'SecurePass123!');
          
          await act(async () => {
            await userEvent.click(submitButton);
          });

          await waitFor(() => {
            expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
          });
        }

        // Verify rate limit is active
        await waitFor(() => {
          expect(submitButton).toBeDisabled();
          expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
        });
      });

      test('should display countdown during rate limiting', async () => {
        const mockOnSuccess = jest.fn();
        
        render(<RegistrationForm onSuccess={mockOnSuccess} />);

        const fullNameInput = screen.getByLabelText(/full name/i);
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /create account/i });

        // Make 5 failed attempts
        for (let i = 0; i < 5; i++) {
          const mockError = new Error('Registration failed');
          (mockError as any).statusCode = 500;
          (authService.register as jest.Mock).mockRejectedValueOnce(mockError);

          await userEvent.clear(fullNameInput);
          await userEvent.clear(emailInput);
          await userEvent.clear(passwordInput);
          await userEvent.clear(confirmPasswordInput);
          
          await userEvent.type(fullNameInput, `User ${i}`);
          await userEvent.type(emailInput, `test${i}@example.com`);
          await userEvent.type(passwordInput, 'SecurePass123!');
          await userEvent.type(confirmPasswordInput, 'SecurePass123!');
          
          await act(async () => {
            await userEvent.click(submitButton);
          });

          await waitFor(() => {
            expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
          });
        }

        // Verify countdown is displayed
        await waitFor(() => {
          expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
          expect(screen.getByText(/\d+ seconds/i)).toBeInTheDocument();
        });
      });

      test('should reset rate limit after successful registration', async () => {
        const mockOnSuccess = jest.fn();
        
        render(<RegistrationForm onSuccess={mockOnSuccess} />);

        const fullNameInput = screen.getByLabelText(/full name/i);
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /create account/i });

        // Make 2 failed attempts
        for (let i = 0; i < 2; i++) {
          const mockError = new Error('Registration failed');
          (mockError as any).statusCode = 500;
          (authService.register as jest.Mock).mockRejectedValueOnce(mockError);

          await userEvent.clear(fullNameInput);
          await userEvent.clear(emailInput);
          await userEvent.clear(passwordInput);
          await userEvent.clear(confirmPasswordInput);
          
          await userEvent.type(fullNameInput, `User ${i}`);
          await userEvent.type(emailInput, `test${i}@example.com`);
          await userEvent.type(passwordInput, 'SecurePass123!');
          await userEvent.type(confirmPasswordInput, 'SecurePass123!');
          
          await act(async () => {
            await userEvent.click(submitButton);
          });

          await waitFor(() => {
            expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
          });
        }

        // Now make a successful attempt
        (authService.register as jest.Mock).mockResolvedValueOnce({
          message: 'User registered successfully',
          email: 'success@example.com',
        });

        await userEvent.clear(fullNameInput);
        await userEvent.clear(emailInput);
        await userEvent.clear(passwordInput);
        await userEvent.clear(confirmPasswordInput);
        
        await userEvent.type(fullNameInput, 'Success User');
        await userEvent.type(emailInput, 'success@example.com');
        await userEvent.type(passwordInput, 'SecurePass123!');
        await userEvent.type(confirmPasswordInput, 'SecurePass123!');
        
        await act(async () => {
          await userEvent.click(submitButton);
        });

        // Wait for success
        await waitFor(() => {
          expect(mockOnSuccess).toHaveBeenCalled();
        });

        // Verify rate limit counter is reset
        const resetData = sessionStorage.getItem('registrationAttempts');
        if (resetData) {
          const data = JSON.parse(resetData);
          expect(data.count).toBe(0);
        }
      });
    });
  });
});
