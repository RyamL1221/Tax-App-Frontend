/**
 * Integration tests for Error Recovery Flow - Fix Form Submission
 * 
 * These tests validate the complete error recovery flow including:
 * - Error display when submission fails
 * - Error clearing when user corrects input
 * - Field-specific error messages
 * - Recovery after validation errors
 * - Recovery after API errors
 * 
 * Feature: fix-form-submission
 * Requirements tested: 2.4, 6.4, 6.5
 */

import { render, screen, waitFor } from '@testing-library/react';
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

describe('Error Recovery Flow - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('6.3: Error recovery flow', () => {
    describe('Login Form Error Recovery', () => {
      test('should display error and allow recovery when user corrects input', async () => {
        const mockOnSuccess = jest.fn();
        
        // First attempt: authentication fails
        const mockError = new Error('Invalid email or password');
        (mockError as any).statusCode = 401;
        (authService.login as jest.Mock).mockRejectedValueOnce(mockError);

        render(<LoginForm onSuccess={mockOnSuccess} />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        // First attempt with wrong credentials
        await userEvent.type(emailInput, 'wrong@example.com');
        await userEvent.type(passwordInput, 'wrongpass123');
        await userEvent.click(submitButton);

        // Wait for error message
        await waitFor(() => {
          expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
        });

        // Verify no redirect happened
        expect(mockOnSuccess).not.toHaveBeenCalled();

        // Clear the form
        await userEvent.clear(emailInput);
        await userEvent.clear(passwordInput);

        // Second attempt: successful authentication
        (authService.login as jest.Mock).mockResolvedValueOnce({
          token: 'mock-token',
          email: 'test@example.com',
          userId: 'user-123',
        });

        // Try again with correct credentials
        await userEvent.type(emailInput, 'test@example.com');
        await userEvent.type(passwordInput, 'SecurePass123!');
        await userEvent.click(submitButton);

        // Wait for successful redirect
        await waitFor(() => {
          expect(mockOnSuccess).toHaveBeenCalledWith('/dashboard');
        });

        // Verify error message is cleared
        expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
      });

      test('should clear validation errors when user starts typing', async () => {
        render(<LoginForm onSuccess={jest.fn()} />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);

        // Enter invalid email and trigger validation
        await userEvent.type(emailInput, 'invalid-email');
        await userEvent.tab();

        // Wait for validation error
        await waitFor(() => {
          expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
        });

        // Start typing again to correct the error
        await userEvent.type(emailInput, '@example.com');

        // Error should be cleared
        await waitFor(() => {
          expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
        });
      });

      test('should clear field-specific errors independently', async () => {
        render(<LoginForm onSuccess={jest.fn()} />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);

        // Enter invalid data in both fields
        await userEvent.type(emailInput, 'invalid');
        await userEvent.type(passwordInput, 'short');
        await userEvent.tab();

        // Wait for both validation errors
        await waitFor(() => {
          expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
          expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        });

        // Fix only the email
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, 'valid@example.com');

        // Email error should be cleared, password error should remain
        await waitFor(() => {
          expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
          expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        });

        // Fix the password
        await userEvent.clear(passwordInput);
        await userEvent.type(passwordInput, 'SecurePass123!');

        // Password error should be cleared
        await waitFor(() => {
          expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
        });
      });

      test('should recover from network errors', async () => {
        const mockOnSuccess = jest.fn();
        
        // First attempt: network error
        const networkError = new Error('Unable to connect. Please check your connection');
        (networkError as any).statusCode = 0;
        (authService.login as jest.Mock).mockRejectedValueOnce(networkError);

        render(<LoginForm onSuccess={mockOnSuccess} />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await userEvent.type(emailInput, 'test@example.com');
        await userEvent.type(passwordInput, 'SecurePass123!');
        await userEvent.click(submitButton);

        // Wait for network error message
        await waitFor(() => {
          expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
        });

        // Second attempt: successful
        (authService.login as jest.Mock).mockResolvedValueOnce({
          token: 'mock-token',
          email: 'test@example.com',
          userId: 'user-123',
        });

        // Try again
        await userEvent.click(submitButton);

        // Wait for success
        await waitFor(() => {
          expect(mockOnSuccess).toHaveBeenCalledWith('/dashboard');
        });
      });
    });

    describe('Registration Form Error Recovery', () => {
      test('should display error and allow recovery when user corrects input', async () => {
        const mockOnSuccess = jest.fn();
        
        // First attempt: email already exists
        const mockError = new Error('Email already registered');
        (mockError as any).statusCode = 409;
        (authService.register as jest.Mock).mockRejectedValueOnce(mockError);

        render(<RegistrationForm onSuccess={mockOnSuccess} />);

        const fullNameInput = screen.getByLabelText(/full name/i);
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /create account/i });

        // First attempt with existing email
        await userEvent.type(fullNameInput, 'John Doe');
        await userEvent.type(emailInput, 'existing@example.com');
        await userEvent.type(passwordInput, 'SecurePass123!');
        await userEvent.type(confirmPasswordInput, 'SecurePass123!');
        await userEvent.click(submitButton);

        // Wait for error message
        await waitFor(() => {
          expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
        });

        // Verify no success callback
        expect(mockOnSuccess).not.toHaveBeenCalled();

        // Change email to a new one
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, 'newuser@example.com');

        // Second attempt: successful registration
        (authService.register as jest.Mock).mockResolvedValueOnce({
          message: 'User registered successfully',
          email: 'newuser@example.com',
        });

        // Try again
        await userEvent.click(submitButton);

        // Wait for success
        await waitFor(() => {
          expect(mockOnSuccess).toHaveBeenCalled();
        });

        // Verify error message is cleared
        expect(screen.queryByText(/email already registered/i)).not.toBeInTheDocument();
      });

      test('should clear validation errors when user corrects password mismatch', async () => {
        render(<RegistrationForm onSuccess={jest.fn()} />);

        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        // Enter mismatched passwords
        await userEvent.type(passwordInput, 'SecurePass123!');
        await userEvent.type(confirmPasswordInput, 'DifferentPass123!');
        await userEvent.tab();

        // Wait for validation error
        await waitFor(() => {
          expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        });

        // Correct the confirm password
        await userEvent.clear(confirmPasswordInput);
        await userEvent.type(confirmPasswordInput, 'SecurePass123!');

        // Error should be cleared
        await waitFor(() => {
          expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
        });
      });

      test('should clear validation errors when user improves password strength', async () => {
        render(<RegistrationForm onSuccess={jest.fn()} />);

        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        // Enter weak password
        await userEvent.type(passwordInput, 'weak');
        await userEvent.type(confirmPasswordInput, 'weak');
        await userEvent.tab();

        // Wait for validation error
        await waitFor(() => {
          expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        });

        // Improve the password
        await userEvent.clear(passwordInput);
        await userEvent.clear(confirmPasswordInput);
        await userEvent.type(passwordInput, 'SecurePass123!');
        await userEvent.type(confirmPasswordInput, 'SecurePass123!');

        // Error should be cleared
        await waitFor(() => {
          expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
        });
      });

      test('should handle multiple validation errors and clear them independently', async () => {
        render(<RegistrationForm onSuccess={jest.fn()} />);

        const fullNameInput = screen.getByLabelText(/full name/i);
        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
        const submitButton = screen.getByRole('button', { name: /create account/i });

        // Enter invalid data in all fields
        await userEvent.type(fullNameInput, 'A'); // Too short
        await userEvent.type(emailInput, 'invalid'); // Invalid format
        await userEvent.type(passwordInput, 'weak'); // Too short
        await userEvent.type(confirmPasswordInput, 'different'); // Doesn't match
        await userEvent.click(submitButton);

        // Wait for validation errors
        await waitFor(() => {
          expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
          expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
          expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        });

        // Fix full name
        await userEvent.clear(fullNameInput);
        await userEvent.type(fullNameInput, 'John Doe');

        // Full name error should be cleared
        await waitFor(() => {
          expect(screen.queryByText(/full name must be at least 2 characters/i)).not.toBeInTheDocument();
        });

        // Fix email
        await userEvent.clear(emailInput);
        await userEvent.type(emailInput, 'valid@example.com');

        // Email error should be cleared
        await waitFor(() => {
          expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
        });

        // Fix password
        await userEvent.clear(passwordInput);
        await userEvent.clear(confirmPasswordInput);
        await userEvent.type(passwordInput, 'SecurePass123!');
        await userEvent.type(confirmPasswordInput, 'SecurePass123!');

        // Password errors should be cleared
        await waitFor(() => {
          expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
          expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
        });
      });
    });

    describe('Error Message Accessibility', () => {
      test('should announce errors to screen readers', async () => {
        const mockError = new Error('Invalid email or password');
        (mockError as any).statusCode = 401;
        (authService.login as jest.Mock).mockRejectedValueOnce(mockError);

        render(<LoginForm onSuccess={jest.fn()} />);

        const emailInput = screen.getByLabelText(/email address/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const submitButton = screen.getByRole('button', { name: /sign in/i });

        await userEvent.type(emailInput, 'test@example.com');
        await userEvent.type(passwordInput, 'wrongpass');
        await userEvent.click(submitButton);

        // Wait for error with proper ARIA attributes
        await waitFor(() => {
          const errorAlert = screen.getByRole('alert');
          expect(errorAlert).toBeInTheDocument();
          expect(errorAlert).toHaveTextContent(/invalid email or password/i);
          expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
        });
      });

      test('should associate field errors with inputs using aria-describedby', async () => {
        render(<LoginForm onSuccess={jest.fn()} />);

        const emailInput = screen.getByLabelText(/email address/i);

        // Enter invalid email
        await userEvent.type(emailInput, 'invalid');
        await userEvent.tab();

        // Wait for error
        await waitFor(() => {
          expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
        });

        // Verify ARIA attributes
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
        
        const errorElement = screen.getByText(/please enter a valid email address/i).closest('div');
        expect(errorElement).toHaveAttribute('id', 'email-error');
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });
  });
});
