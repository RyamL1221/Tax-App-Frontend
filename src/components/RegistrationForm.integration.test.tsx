/**
 * Integration tests for RegistrationForm component - Fix Form Submission
 * 
 * These tests validate the complete form submission flow including:
 * - preventDefault behavior to prevent default HTML form submission
 * - API client integration for registration
 * - Navigation after successful submission
 * - Error handling and display
 * - Rate limiting integration
 * 
 * Feature: fix-form-submission
 * Requirements tested: 1.2, 2.2, 2.3, 4.2
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('RegistrationForm - Integration Tests (Fix Form Submission)', () => {
  let mockOnSuccess: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess = jest.fn();
    
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

  describe('6.2: Registration form submission flow', () => {
    test('should complete full flow from button click to API call to navigation', async () => {
      // Mock successful registration with a slight delay
      const mockRegisterResponse = {
        message: 'User registered successfully',
        email: 'newuser@example.com',
      };
      (authService.register as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockRegisterResponse), 50))
      );

      // Render the form
      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Verify form elements are present
      const fullNameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      expect(fullNameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(confirmPasswordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');

      // Fill in the form with valid data
      await userEvent.type(fullNameInput, 'John Doe');
      await userEvent.type(emailInput, 'newuser@example.com');
      await userEvent.type(passwordInput, 'SecurePass123!');
      await userEvent.type(confirmPasswordInput, 'SecurePass123!');

      // Verify form data is entered
      expect(fullNameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('newuser@example.com');
      expect(passwordInput).toHaveValue('SecurePass123!');
      expect(confirmPasswordInput).toHaveValue('SecurePass123!');

      // Click the submit button
      await userEvent.click(submitButton);

      // Verify API client was called with correct data
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'newuser@example.com',
          password: 'SecurePass123!',
        });
      });

      // Verify success callback was called (which triggers navigation)
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    test('should prevent default form submission behavior', async () => {
      // Mock successful registration
      (authService.register as jest.Mock).mockResolvedValueOnce({
        message: 'User registered successfully',
        email: 'test@example.com',
      });

      // Render the form
      const { container } = render(<RegistrationForm onSuccess={mockOnSuccess} />);
      const form = container.querySelector('form');
      
      // Create a mock submit event
      const mockPreventDefault = jest.fn();
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      Object.defineProperty(submitEvent, 'preventDefault', {
        value: mockPreventDefault,
        writable: true,
      });

      // Fill in the form
      const fullNameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(fullNameInput, 'John Doe');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'SecurePass123!');
      await userEvent.type(confirmPasswordInput, 'SecurePass123!');

      // Dispatch the submit event
      form?.dispatchEvent(submitEvent);

      // Verify preventDefault was called
      await waitFor(() => {
        expect(mockPreventDefault).toHaveBeenCalled();
      });

      // Verify API was called (form submitted via JavaScript)
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalled();
      });
    });

    test('should trigger form submission when submit button is clicked', async () => {
      // Mock successful registration
      (authService.register as jest.Mock).mockResolvedValueOnce({
        message: 'User registered successfully',
        email: 'test@example.com',
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Fill in the form
      const fullNameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await userEvent.type(fullNameInput, 'John Doe');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'SecurePass123!');
      await userEvent.type(confirmPasswordInput, 'SecurePass123!');

      // Click the submit button (should trigger form's onSubmit event)
      await userEvent.click(submitButton);

      // Verify the form submission was triggered and API was called
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });
      });

      // Verify success callback was called
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    test('should handle API errors and display error message', async () => {
      // Mock failed registration (email already exists)
      const mockError = new Error('Email already registered');
      (mockError as any).statusCode = 409;
      (authService.register as jest.Mock).mockRejectedValue(mockError);

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Fill in the form
      const fullNameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await userEvent.type(fullNameInput, 'John Doe');
      await userEvent.type(emailInput, 'existing@example.com');
      await userEvent.type(passwordInput, 'SecurePass123!');
      await userEvent.type(confirmPasswordInput, 'SecurePass123!');
      await userEvent.click(submitButton);

      // Verify API was called
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalled();
      });

      // Verify error is displayed (check for any error alert)
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
      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Fill in form with invalid data (passwords don't match)
      const fullNameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await userEvent.type(fullNameInput, 'John Doe');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'SecurePass123!');
      await userEvent.type(confirmPasswordInput, 'DifferentPass123!');
      
      // Trigger validation by blurring
      await userEvent.tab();

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // Try to submit
      await userEvent.click(submitButton);

      // Verify API was NOT called
      await waitFor(() => {
        expect(authService.register).not.toHaveBeenCalled();
      }, { timeout: 1000 });

      // Verify success callback was not called
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('should disable button and show loading state during submission', async () => {
      // Mock a delayed response
      (authService.register as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            message: 'User registered successfully',
            email: 'test@example.com',
          }), 100)
        )
      );

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      const fullNameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await userEvent.type(fullNameInput, 'John Doe');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'SecurePass123!');
      await userEvent.type(confirmPasswordInput, 'SecurePass123!');
      await userEvent.click(submitButton);

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Wait for completion
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    test('should prevent duplicate submissions while processing', async () => {
      // Mock a delayed response
      (authService.register as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            message: 'User registered successfully',
            email: 'test@example.com',
          }), 200)
        )
      );

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      const fullNameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await userEvent.type(fullNameInput, 'John Doe');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'SecurePass123!');
      await userEvent.type(confirmPasswordInput, 'SecurePass123!');
      
      // Click submit button multiple times rapidly
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);

      // Wait for completion
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 2000 });

      // Verify API was only called once
      expect(authService.register).toHaveBeenCalledTimes(1);
    });

    test('should validate password strength before submission', async () => {
      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      const fullNameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      // Enter weak password
      await userEvent.type(fullNameInput, 'John Doe');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'weak');
      await userEvent.type(confirmPasswordInput, 'weak');
      
      // Trigger validation by blurring
      await userEvent.tab();

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      // Try to submit
      await userEvent.click(submitButton);

      // Verify API was NOT called
      await waitFor(() => {
        expect(authService.register).not.toHaveBeenCalled();
      }, { timeout: 1000 });

      // Verify success callback was not called
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('should show password strength indicator when user types', async () => {
      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      const passwordInput = screen.getByLabelText(/^password$/i);

      // Start typing password
      await userEvent.type(passwordInput, 'SecurePass123!');

      // Verify password strength indicator appears (it may show as an aria-label or text)
      await waitFor(() => {
        // Check for password strength indicator by aria-label or text content
        const strengthIndicator = screen.queryByLabelText(/password strength/i) || 
                                  screen.queryByText(/password strength/i);
        expect(strengthIndicator).toBeInTheDocument();
      });
    });
  });
});
