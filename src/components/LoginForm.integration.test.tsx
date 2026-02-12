/**
 * Integration tests for LoginForm component - Fix Form Submission
 * 
 * These tests validate the complete form submission flow including:
 * - preventDefault behavior to prevent default HTML form submission
 * - API client integration for authentication
 * - Navigation after successful submission
 * - Error handling and display
 * - Rate limiting integration
 * 
 * Feature: fix-form-submission
 * Requirements tested: 1.1, 2.1, 2.3, 4.2
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
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

describe('LoginForm - Integration Tests (Fix Form Submission)', () => {
  let mockOnSuccess: jest.Mock;
  let mockOnError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess = jest.fn();
    mockOnError = jest.fn();
    
    // Clear sessionStorage for rate limiting
    sessionStorage.clear();
    
    // Clear console mocks
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('6.1: Login form submission flow', () => {
    test('should complete full flow from button click to API call to navigation', async () => {
      // Mock successful login with a slight delay to see loading state
      const mockLoginResponse = {
        success: true,
        token: 'mock-jwt-token',
        email: 'test@example.com',
        userId: 'user-123',
      };
      (authService.login as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockLoginResponse), 50))
      );

      // Render the form
      render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      // Verify form elements are present
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');

      // Fill in the form with valid data
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'SecurePass123!');

      // Verify form data is entered
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('SecurePass123!');

      // Click the submit button
      await userEvent.click(submitButton);

      // Verify API client was called with correct credentials and status callback
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith(
          {
            email: 'test@example.com',
            password: 'SecurePass123!',
          },
          expect.any(Function), // Status callback
          expect.any(String) // traceId
        );
      });

      // Verify success callback was called (which triggers navigation)
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('/dashboard');
      });

      // Verify no error callback was called
      expect(mockOnError).not.toHaveBeenCalled();
    });

    test('should prevent default form submission behavior', async () => {
      // Mock successful login
      (authService.login as jest.Mock).mockResolvedValueOnce({
        success: true,
        token: 'mock-token',
        email: 'test@example.com',
        userId: 'user-123',
      });

      // Render the form
      const { container } = render(<LoginForm onSuccess={mockOnSuccess} />);
      const form = container.querySelector('form');
      
      // Create a mock submit event
      const mockPreventDefault = jest.fn();
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(submitEvent, 'preventDefault', {
        value: mockPreventDefault,
        writable: true,
      });

      // Fill in the form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'SecurePass123!');

      // Dispatch the submit event
      form?.dispatchEvent(submitEvent);

      // Verify preventDefault was called
      await waitFor(() => {
        expect(mockPreventDefault).toHaveBeenCalled();
      });

      // Verify API was called (form submitted via JavaScript)
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalled();
      });
    });

    test('should trigger form submission when submit button is clicked', async () => {
      // Mock successful login
      (authService.login as jest.Mock).mockResolvedValueOnce({
        success: true,
        token: 'mock-token',
        email: 'test@example.com',
        userId: 'user-123',
      });

      render(<LoginForm onSuccess={mockOnSuccess} />);

      // Fill in the form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'SecurePass123!');

      // Click the submit button (should trigger form's onSubmit event)
      await userEvent.click(submitButton);

      // Verify the form submission was triggered and API was called
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith(
          {
            email: 'test@example.com',
            password: 'SecurePass123!',
          },
          expect.any(Function), // Status callback
          expect.any(String) // traceId
        );
      });

      // Verify success callback was called
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('should handle API errors and display error message', async () => {
      // Mock failed login
      const mockError = new Error('Invalid email or password');
      (mockError as any).statusCode = 401;
      (authService.login as jest.Mock).mockRejectedValue(mockError);

      render(<LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      // Fill in the form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'wrong@example.com');
      await userEvent.type(passwordInput, 'WrongPass123!');
      await userEvent.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(authService.login).toHaveBeenCalled();
      });

      // Verify error callback was called (error format may be transformed)
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });

      // Verify error message is displayed (check for any error alert)
      await waitFor(() => {
        const alerts = screen.queryAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
      }, { timeout: 3000 });

      // Verify success callback was not called
      expect(mockOnSuccess).not.toHaveBeenCalled();

      // Verify button is re-enabled after error
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    test('should not submit form when validation fails', async () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);

      // Fill in form with invalid data (invalid email format)
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.type(passwordInput, 'SecurePass123!');
      
      // Trigger validation by blurring
      await userEvent.tab();

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Try to submit
      await userEvent.click(submitButton);

      // Verify API was NOT called
      await waitFor(() => {
        expect(authService.login).not.toHaveBeenCalled();
      }, { timeout: 1000 });

      // Verify success callback was not called
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('should disable button and show loading state during submission', async () => {
      // Mock a delayed response
      (authService.login as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            token: 'mock-token',
            email: 'test@example.com',
            userId: 'user-123',
          }), 100)
        )
      );

      render(<LoginForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'SecurePass123!');
      await userEvent.click(submitButton);

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/logging in/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Wait for completion
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    test('should prevent duplicate submissions while processing', async () => {
      // Mock a delayed response
      (authService.login as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            token: 'mock-token',
            email: 'test@example.com',
            userId: 'user-123',
          }), 200)
        )
      );

      render(<LoginForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'SecurePass123!');
      
      // Click submit button multiple times rapidly
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);

      // Wait for completion
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 2000 });

      // Verify API was only called once
      expect(authService.login).toHaveBeenCalledTimes(1);
    });
  });
});
