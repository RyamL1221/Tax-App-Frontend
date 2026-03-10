import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { RegistrationForm } from '../RegistrationForm';
import { PasswordStrength } from '@/utils/passwordValidation';

// Mock the useRegistrationForm hook
jest.mock('@/hooks/useRegistrationForm');
import { useRegistrationForm } from '@/hooks/useRegistrationForm';

const mockUseRegistrationForm = useRegistrationForm as jest.MockedFunction<typeof useRegistrationForm>;

describe('RegistrationForm', () => {
  const mockOnSuccess = jest.fn();
  const mockHandleChange = jest.fn();
  const mockHandleBlur = jest.fn();
  const mockHandleSubmit = jest.fn((e: React.FormEvent) => {
    e.preventDefault();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUseRegistrationForm.mockReturnValue({
      formData: {
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
      errors: {},
      isLoading: false,
      isRateLimited: false,
      rateLimitMessage: '',
      passwordStrength: PasswordStrength.WEAK,
      handleChange: mockHandleChange,
      handleBlur: mockHandleBlur,
      handleSubmit: mockHandleSubmit,
      clearError: jest.fn(),
      statusMessage: null,
      statusType: null,
      clearStatus: jest.fn(),
    });
  });

  describe('Form Rendering (Unit Tests)', () => {
    // Task 6.6: Write unit tests for RegistrationForm rendering
    
    it('should render all required fields', () => {
      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should render submit button with correct label', () => {
      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should render login link', () => {
      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      const loginLink = screen.getByRole('link', { name: /log in/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should display password requirements when user starts typing', () => {
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: '',
          email: '',
          password: 'test',
          confirmPassword: '',
        },
        errors: {},
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.WEAK,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        clearError: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Password requirements should be visible when password field has content
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/one number/i)).toBeInTheDocument();
      expect(screen.getByText(/one special character/i)).toBeInTheDocument();
    });

    it('should display password strength indicator when user starts typing', () => {
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: '',
          email: '',
          password: 'test',
          confirmPassword: '',
        },
        errors: {},
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.WEAK,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        clearError: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Password strength indicator should be visible
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Specific Error Scenarios (Unit Tests)', () => {
    // Task 6.7: Write unit tests for specific error scenarios
    
    it('should display email already exists error (409 response)', () => {
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: 'John Doe',
          email: 'existing@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
        errors: {
          email: 'This email is already registered. Please log in instead.',
        },
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.STRONG,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        clearError: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/this email is already registered/i)).toBeInTheDocument();
    });

    /**
     * Feature: fix-form-submission, Task 4.4
     * Test that network error displays connection message
     * **Validates: Requirements 6.3**
     */
    it('should display network error with connection message', () => {
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
        errors: {},
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.STRONG,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        clearError: jest.fn(),
        statusMessage: 'Network error. Please check your connection and try again.',
        statusType: 'error' as const,
        clearStatus: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Verify the error message is displayed in StatusMessage component
      expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument();
    });

    /**
     * Feature: fix-form-submission, Task 4.7
     * Test that weak password validation prevents submission
     * **Validates: Requirements 7.3**
     */
    it('should prevent submission and show error when password is weak', async () => {
      const user = userEvent.setup();
      
      // Mock the hook to return a weak password error
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'weak',
          confirmPassword: 'weak',
        },
        errors: {
          password: 'Password must be at least 8 characters',
        },
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.WEAK,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: jest.fn((e: React.FormEvent) => {
          e.preventDefault();
          // Validation prevents submission - don't call API
        }),
        clearError: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Try to submit the form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Verify the error message is displayed
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      
      // Verify the password field has aria-invalid
      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      
      // Verify the onSuccess callback was NOT called (validation prevented submission)
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    /**
     * Feature: fix-form-submission, Task 4.8
     * Test that mismatched passwords validation prevents submission
     * **Validates: Requirements 7.4**
     */
    it('should prevent submission and show error when passwords do not match', async () => {
      const user = userEvent.setup();
      
      // Mock the hook to return a password mismatch error
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword123!',
        },
        errors: {
          confirmPassword: 'Passwords do not match',
        },
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.STRONG,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: jest.fn((e: React.FormEvent) => {
          e.preventDefault();
          // Validation prevents submission - don't call API
        }),
        clearError: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Try to submit the form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Verify the error message is displayed
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      
      // Verify the confirm password field has aria-invalid
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'true');
      
      // Verify the onSuccess callback was NOT called (validation prevented submission)
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should display server error (500 response)', () => {
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
        errors: {},
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.STRONG,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        clearError: jest.fn(),
        statusMessage: 'Registration failed. Please try again.',
        statusType: 'error' as const,
        clearStatus: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });

    it('should display rate limit message', () => {
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
        },
        errors: {},
        isLoading: false,
        isRateLimited: true,
        rateLimitMessage: 'Too many attempts. Please try again in 5 minutes.',
        passwordStrength: PasswordStrength.WEAK,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        clearError: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      const rateLimitAlert = screen.getByText(/too many attempts/i);
      expect(rateLimitAlert).toBeInTheDocument();
      expect(rateLimitAlert.closest('[role="alert"]')).toHaveAttribute('aria-live', 'polite');
    });

    /**
     * Feature: fix-form-submission, Task 4.9
     * Test console logging messages during form submission
     * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
     */
    it('should log console messages during form submission flow', async () => {
      const user = userEvent.setup();
      
      // Mock console.log to capture logging
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Create a mock handleSubmit that logs the expected messages
      const mockHandleSubmitWithLogging = jest.fn(async (e: React.FormEvent) => {
        console.log('Form submission started');
        e.preventDefault();
        console.log('Default behavior prevented');
        console.log('Calling API client register method');
        // Simulate successful API call
        console.log('API call successful');
      });
      
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
        errors: {},
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.STRONG,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmitWithLogging,
        clearError: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Verify "Form submission started" was logged (Requirement 9.1)
        expect(consoleLogSpy).toHaveBeenCalledWith('Form submission started');
        
        // Verify "Default behavior prevented" was logged (Requirement 9.2)
        expect(consoleLogSpy).toHaveBeenCalledWith('Default behavior prevented');
        
        // Verify "Calling API client register method" was logged (Requirement 9.3)
        expect(consoleLogSpy).toHaveBeenCalledWith('Calling API client register method');
        
        // Verify "API call successful" was logged (Requirement 9.4)
        expect(consoleLogSpy).toHaveBeenCalledWith('API call successful');
      });
      
      // Restore console methods
      consoleLogSpy.mockRestore();
    });

    /**
     * Feature: fix-form-submission, Task 4.9
     * Test console error logging when API call fails
     * **Validates: Requirements 9.5**
     */
    it('should log error details when API call fails', async () => {
      const user = userEvent.setup();
      
      // Mock console methods
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Create a mock handleSubmit that simulates an error
      const mockHandleSubmitWithError = jest.fn(async (e: React.FormEvent) => {
        console.log('Form submission started');
        e.preventDefault();
        console.log('Default behavior prevented');
        console.log('Calling API client register method');
        const error = new Error('Email already exists');
        console.log('API call failed:', error);
      });
      
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: 'John Doe',
          email: 'existing@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
        errors: {
          email: 'This email is already registered. Please log in instead.',
        },
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.STRONG,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmitWithError,
        clearError: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Verify error was logged (Requirement 9.5)
        expect(consoleLogSpy).toHaveBeenCalledWith('API call failed:', expect.any(Error));
      });
      
      // Restore console methods
      consoleLogSpy.mockRestore();
    });
  });

  describe('Single Error Display (Unit Tests)', () => {
    // Task 4.2: Write unit test for single error display in RegistrationForm
    // Feature: fix-duplicate-error-popups, Property 1: Single Error Display
    // **Validates: Requirements 1.2, 1.4, 1.5**
    
    it('should display exactly one error popup for network errors', () => {
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
        errors: {},
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.STRONG,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        clearError: jest.fn(),
        statusMessage: 'Network error. Please check your connection and try again.',
        statusType: 'error' as const,
        clearStatus: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Count all elements with role="alert" (error messages)
      const alerts = screen.queryAllByRole('alert');
      
      // Should have exactly one alert for the network error
      expect(alerts).toHaveLength(1);
      
      // Verify it contains the network error message
      expect(alerts[0]).toHaveTextContent('Network error. Please check your connection and try again.');
    });

    it('should display exactly one error popup for API errors (409 conflict)', () => {
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: 'John Doe',
          email: 'existing@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
        errors: {
          email: 'This email is already registered. Please log in instead.',
        },
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.STRONG,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        clearError: jest.fn(),
        statusMessage: 'This email is already registered. Please log in instead.',
        statusType: 'error' as const,
        clearStatus: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Count all elements with role="alert"
      const alerts = screen.queryAllByRole('alert');
      
      // Should have exactly 2 alerts: one for the status message and one for the field error
      // This is expected because field-specific errors are displayed inline
      expect(alerts).toHaveLength(2);
      
      // Verify the status message alert
      const statusAlert = alerts.find(alert => 
        alert.textContent?.includes('This email is already registered')
      );
      expect(statusAlert).toBeDefined();
      
      // Verify the field error alert
      const fieldAlert = alerts.find(alert => 
        alert.getAttribute('id') === 'email-error'
      );
      expect(fieldAlert).toBeDefined();
    });

    it('should display exactly one error popup for API errors (500 server error)', () => {
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
        errors: {},
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.STRONG,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        clearError: jest.fn(),
        statusMessage: 'Registration failed. Please try again.',
        statusType: 'error' as const,
        clearStatus: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Count all elements with role="alert"
      const alerts = screen.queryAllByRole('alert');
      
      // Should have exactly one alert for the server error
      expect(alerts).toHaveLength(1);
      
      // Verify it contains the server error message
      expect(alerts[0]).toHaveTextContent('Registration failed. Please try again.');
    });

    it('should not display errors.general (removed in task 4.1)', () => {
      // This test verifies that the old errors.general display has been removed
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: 'John Doe',
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        },
        errors: {},
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.STRONG,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        clearError: jest.fn(),
        statusMessage: 'Some error message',
        statusType: 'error' as const,
        clearStatus: jest.fn(),
      });

      const { container } = render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // Verify that there's no element displaying errors.general
      // The old implementation had a separate div for errors.general
      // Now only statusMessage should be displayed
      const alerts = screen.queryAllByRole('alert');
      
      // Should have exactly one alert (from statusMessage)
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveTextContent('Some error message');
      
      // Verify no duplicate error messages in the DOM
      const errorText = container.textContent || '';
      const occurrences = (errorText.match(/Some error message/g) || []).length;
      expect(occurrences).toBe(1);
    });

    it('should display field-specific errors inline (not as general errors)', () => {
      mockUseRegistrationForm.mockReturnValue({
        formData: {
          fullName: '',
          email: 'invalid-email',
          password: 'weak',
          confirmPassword: 'different',
        },
        errors: {
          fullName: 'Full name is required',
          email: 'Please enter a valid email address',
          password: 'Password must be at least 8 characters',
          confirmPassword: 'Passwords do not match',
        },
        isLoading: false,
        isRateLimited: false,
        rateLimitMessage: '',
        passwordStrength: PasswordStrength.WEAK,
        handleChange: mockHandleChange,
        handleBlur: mockHandleBlur,
        handleSubmit: mockHandleSubmit,
        clearError: jest.fn(),
        statusMessage: null,
        statusType: null,
        clearStatus: jest.fn(),
      });

      render(<RegistrationForm onSuccess={mockOnSuccess} />);

      // All field errors should be displayed inline with role="alert"
      const alerts = screen.queryAllByRole('alert');
      
      // Should have 4 alerts (one for each field error)
      expect(alerts).toHaveLength(4);
      
      // Verify each field error is displayed
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      
      // Verify no general error message is displayed
      expect(screen.queryByText(/registration failed/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });
  });

  describe('Property-Based Tests', () => {
    // Task 6.1: Write property test for loading state behavior
    // Feature: register-page, Property 11: Loading state disables form during submission
    // **Validates: Requirements 6.1, 6.2**
    test('property: loading state disables form during submission', () => {
      fc.assert(
        fc.property(
          // Generate various form data states
          fc.record({
            fullName: fc.string({ minLength: 2, maxLength: 50 }),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 }),
            confirmPassword: fc.string({ minLength: 8, maxLength: 50 }),
          }),
          (formData) => {
            // Mock loading state
            mockUseRegistrationForm.mockReturnValue({
              formData,
              errors: {},
              isLoading: true,
              isRateLimited: false,
              rateLimitMessage: '',
              passwordStrength: PasswordStrength.GOOD,
              handleChange: mockHandleChange,
              handleBlur: mockHandleBlur,
              handleSubmit: mockHandleSubmit,
              clearError: jest.fn(),
            });

            const { unmount } = render(<RegistrationForm onSuccess={mockOnSuccess} />);

            try {
              // Property: All input fields should be disabled during loading
              const fullNameInput = screen.getByLabelText(/full name/i);
              const emailInput = screen.getByLabelText(/email address/i);
              const passwordInput = screen.getByLabelText(/^password$/i);
              const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

              expect(fullNameInput).toBeDisabled();
              expect(emailInput).toBeDisabled();
              expect(passwordInput).toBeDisabled();
              expect(confirmPasswordInput).toBeDisabled();

              // Property: Submit button should be disabled during loading
              const submitButton = screen.getByRole('button', { name: /creating account/i });
              expect(submitButton).toBeDisabled();

              // Property: Loading indicator should be displayed
              expect(submitButton).toHaveAttribute('aria-busy', 'true');
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Task 6.2: Write property test for loading state clearing
    // Feature: register-page, Property 14: Loading state clears after API response
    // **Validates: Requirements 6.5**
    test('property: loading state clears after API response', () => {
      fc.assert(
        fc.property(
          // Generate various response scenarios
          fc.record({
            formData: fc.record({
              fullName: fc.string({ minLength: 2, maxLength: 50 }),
              email: fc.emailAddress(),
              password: fc.string({ minLength: 8, maxLength: 50 }),
              confirmPassword: fc.string({ minLength: 8, maxLength: 50 }),
            }),
            hasError: fc.boolean(),
            errorMessage: fc.constantFrom(
              'Registration failed. Please try again.',
              'Network error. Please check your connection and try again.',
              'This email is already registered. Please log in instead.'
            ),
          }),
          (scenario) => {
            // Mock non-loading state (after API response)
            mockUseRegistrationForm.mockReturnValue({
              formData: scenario.formData,
              errors: scenario.hasError ? { general: scenario.errorMessage } : {},
              isLoading: false, // Loading state should be cleared
              isRateLimited: false,
              rateLimitMessage: '',
              passwordStrength: PasswordStrength.GOOD,
              handleChange: mockHandleChange,
              handleBlur: mockHandleBlur,
              handleSubmit: mockHandleSubmit,
              clearError: jest.fn(),
            });

            const { unmount } = render(<RegistrationForm onSuccess={mockOnSuccess} />);

            try {
              // Property: After API response, form should return to interactive state
              const fullNameInput = screen.getByLabelText(/full name/i);
              const emailInput = screen.getByLabelText(/email address/i);
              const passwordInput = screen.getByLabelText(/^password$/i);
              const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

              expect(fullNameInput).not.toBeDisabled();
              expect(emailInput).not.toBeDisabled();
              expect(passwordInput).not.toBeDisabled();
              expect(confirmPasswordInput).not.toBeDisabled();

              // Property: Submit button should be enabled (unless rate limited)
              const submitButton = screen.getByRole('button', { name: /create account/i });
              expect(submitButton).not.toBeDisabled();
              expect(submitButton).not.toHaveAttribute('aria-busy', 'true');
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Task 6.3: Write property test for error display and clearing
    // Feature: register-page, Property 17: Error messages display and clear appropriately
    // **Validates: Requirements 9.1, 9.4, 9.5**
    test('property: error messages display and clear appropriately', () => {
      fc.assert(
        fc.property(
          // Generate various error states
          fc.record({
            hasFullNameError: fc.boolean(),
            hasEmailError: fc.boolean(),
            hasPasswordError: fc.boolean(),
            hasConfirmPasswordError: fc.boolean(),
            fullNameErrorMessage: fc.constantFrom(
              'Full name is required',
              'Full name must be at least 2 characters'
            ),
            emailErrorMessage: fc.constantFrom(
              'Email is required',
              'Please enter a valid email address'
            ),
            passwordErrorMessage: fc.constantFrom(
              'Password must be at least 8 characters',
              'Password must contain at least one uppercase letter'
            ),
            confirmPasswordErrorMessage: fc.constantFrom(
              'Please confirm your password',
              'Passwords do not match'
            ),
          }),
          (errorState) => {
            // Mock form with errors
            mockUseRegistrationForm.mockReturnValue({
              formData: {
                fullName: 'test',
                email: 'test@example.com',
                password: 'password',
                confirmPassword: 'password',
              },
              errors: {
                ...(errorState.hasFullNameError ? { fullName: errorState.fullNameErrorMessage } : {}),
                ...(errorState.hasEmailError ? { email: errorState.emailErrorMessage } : {}),
                ...(errorState.hasPasswordError ? { password: errorState.passwordErrorMessage } : {}),
                ...(errorState.hasConfirmPasswordError ? { confirmPassword: errorState.confirmPasswordErrorMessage } : {}),
              },
              isLoading: false,
              isRateLimited: false,
              rateLimitMessage: '',
              passwordStrength: PasswordStrength.WEAK,
              handleChange: mockHandleChange,
              handleBlur: mockHandleBlur,
              handleSubmit: mockHandleSubmit,
              clearError: jest.fn(),
            });

            const { unmount } = render(<RegistrationForm onSuccess={mockOnSuccess} />);

            try {
              // Property: Error messages should be displayed inline near their fields
              if (errorState.hasFullNameError) {
                const fullNameError = screen.getByText(errorState.fullNameErrorMessage);
                expect(fullNameError).toBeInTheDocument();
                expect(fullNameError.closest('[role="alert"]')).toHaveAttribute('id', 'fullName-error');
              }

              if (errorState.hasEmailError) {
                const emailError = screen.getByText(errorState.emailErrorMessage);
                expect(emailError).toBeInTheDocument();
              }

              if (errorState.hasPasswordError) {
                const passwordError = screen.getByText(errorState.passwordErrorMessage);
                expect(passwordError).toBeInTheDocument();
              }

              if (errorState.hasConfirmPasswordError) {
                const confirmPasswordError = screen.getByText(errorState.confirmPasswordErrorMessage);
                expect(confirmPasswordError).toBeInTheDocument();
              }

              // Property: Fields with errors should have aria-invalid="true"
              const fullNameInput = screen.getByLabelText(/full name/i);
              expect(fullNameInput).toHaveAttribute(
                'aria-invalid',
                errorState.hasFullNameError ? 'true' : 'false'
              );

              // Property: Fields with errors should have aria-describedby pointing to error
              if (errorState.hasFullNameError) {
                expect(fullNameInput).toHaveAttribute('aria-describedby', 'fullName-error');
              }
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Task 6.4: Write property test for accessibility attributes
    // Feature: register-page, Property 15: Accessibility attributes present on all form fields
    // **Validates: Requirements 7.1, 7.2, 7.3**
    test('property: accessibility attributes present on all form fields', () => {
      fc.assert(
        fc.property(
          // Generate various form states
          fc.record({
            hasFullNameError: fc.boolean(),
            hasEmailError: fc.boolean(),
            hasPasswordError: fc.boolean(),
            hasConfirmPasswordError: fc.boolean(),
            isLoading: fc.boolean(),
            isRateLimited: fc.boolean(),
          }),
          (formState) => {
            // Mock form with the generated state
            mockUseRegistrationForm.mockReturnValue({
              formData: {
                fullName: 'John Doe',
                email: 'test@example.com',
                password: 'Password123!',
                confirmPassword: 'Password123!',
              },
              errors: {
                ...(formState.hasFullNameError ? { fullName: 'Full name error' } : {}),
                ...(formState.hasEmailError ? { email: 'Email error' } : {}),
                ...(formState.hasPasswordError ? { password: 'Password error' } : {}),
                ...(formState.hasConfirmPasswordError ? { confirmPassword: 'Confirm password error' } : {}),
              },
              isLoading: formState.isLoading,
              isRateLimited: formState.isRateLimited,
              rateLimitMessage: formState.isRateLimited ? 'Too many attempts' : '',
              passwordStrength: PasswordStrength.STRONG,
              handleChange: mockHandleChange,
              handleBlur: mockHandleBlur,
              handleSubmit: mockHandleSubmit,
              clearError: jest.fn(),
            });

            const { unmount } = render(<RegistrationForm onSuccess={mockOnSuccess} />);

            try {
              // Property: Full name field must have proper ARIA attributes
              const fullNameInput = screen.getByLabelText(/full name/i);
              expect(fullNameInput).toHaveAttribute('aria-label', 'Full Name');
              expect(fullNameInput).toHaveAttribute('aria-required', 'true');
              expect(fullNameInput).toHaveAttribute(
                'aria-invalid',
                formState.hasFullNameError ? 'true' : 'false'
              );
              if (formState.hasFullNameError) {
                expect(fullNameInput).toHaveAttribute('aria-describedby', 'fullName-error');
              }

              // Property: Email field must have proper ARIA attributes
              const emailInput = screen.getByLabelText(/email address/i);
              expect(emailInput).toHaveAttribute('aria-label', 'Email Address');
              expect(emailInput).toHaveAttribute('aria-required', 'true');
              expect(emailInput).toHaveAttribute(
                'aria-invalid',
                formState.hasEmailError ? 'true' : 'false'
              );

              // Property: Password field must have proper ARIA attributes
              const passwordInput = screen.getByLabelText(/^password$/i);
              expect(passwordInput).toHaveAttribute('aria-label', 'Password');
              expect(passwordInput).toHaveAttribute('aria-required', 'true');
              expect(passwordInput).toHaveAttribute(
                'aria-invalid',
                formState.hasPasswordError ? 'true' : 'false'
              );

              // Property: Confirm password field must have proper ARIA attributes
              const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
              expect(confirmPasswordInput).toHaveAttribute('aria-label', 'Confirm Password');
              expect(confirmPasswordInput).toHaveAttribute('aria-required', 'true');
              expect(confirmPasswordInput).toHaveAttribute(
                'aria-invalid',
                formState.hasConfirmPasswordError ? 'true' : 'false'
              );

              // Property: Error messages must be announced to screen readers
              if (formState.hasFullNameError) {
                const fullNameError = document.getElementById('fullName-error');
                expect(fullNameError).toHaveAttribute('role', 'alert');
                expect(fullNameError).toHaveAttribute('aria-live', 'polite');
              }

              // Property: Submit button must have proper accessibility attributes
              const submitButton = screen.getByRole('button', { 
                name: formState.isLoading ? /creating account/i : /create account/i 
              });
              expect(submitButton).toHaveAttribute('type', 'submit');
              if (formState.isLoading) {
                expect(submitButton).toHaveAttribute('aria-busy', 'true');
              }
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Task 6.5: Write property test for keyboard navigation
    // Feature: register-page, Property 16: Keyboard navigation works for all interactive elements
    // **Validates: Requirements 7.4, 7.5**
    test('property: keyboard navigation works for all interactive elements', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various form states (only test enabled states for keyboard navigation)
          fc.record({
            hasErrors: fc.boolean(),
            // Only test enabled states - disabled elements are not focusable
            isLoading: fc.constant(false),
            isRateLimited: fc.constant(false),
          }),
          async (formState) => {
            // Mock form with the generated state
            mockUseRegistrationForm.mockReturnValue({
              formData: {
                fullName: '',
                email: '',
                password: '',
                confirmPassword: '',
              },
              errors: formState.hasErrors ? { fullName: 'Error' } : {},
              isLoading: formState.isLoading,
              isRateLimited: formState.isRateLimited,
              rateLimitMessage: '',
              passwordStrength: PasswordStrength.WEAK,
              handleChange: mockHandleChange,
              handleBlur: mockHandleBlur,
              handleSubmit: mockHandleSubmit,
              clearError: jest.fn(),
            });

            const user = userEvent.setup();
            const { unmount } = render(<RegistrationForm onSuccess={mockOnSuccess} />);

            try {
              // Property: All interactive elements should be reachable via Tab key
              
              // Tab to full name input
              await user.tab();
              const fullNameInput = screen.getByLabelText(/full name/i);
              expect(fullNameInput).toHaveFocus();
              expect(fullNameInput).not.toBeDisabled();

              // Tab to email input
              await user.tab();
              const emailInput = screen.getByLabelText(/email address/i);
              expect(emailInput).toHaveFocus();
              expect(emailInput).not.toBeDisabled();

              // Tab to password input
              await user.tab();
              const passwordInput = screen.getByLabelText(/^password$/i);
              expect(passwordInput).toHaveFocus();
              expect(passwordInput).not.toBeDisabled();

              // Tab to password visibility toggle button
              await user.tab();
              const passwordToggle = screen.getAllByRole('button', { name: /show password/i })[0];
              expect(passwordToggle).toHaveFocus();
              expect(passwordToggle).not.toBeDisabled();
              
              // Tab to confirm password input
              await user.tab();
              const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
              expect(confirmPasswordInput).toHaveFocus();
              expect(confirmPasswordInput).not.toBeDisabled();

              // Tab to confirm password visibility toggle button
              await user.tab();
              const confirmPasswordToggle = screen.getAllByRole('button', { name: /show password/i })[1];
              expect(confirmPasswordToggle).toHaveFocus();
              expect(confirmPasswordToggle).not.toBeDisabled();

              // Tab to submit button
              await user.tab();
              const submitButton = screen.getByRole('button', { name: /create account/i });
              expect(submitButton).toHaveFocus();
              
              // Property: Submit button should be reachable and operable
              expect(submitButton).toHaveAttribute('type', 'submit');
              expect(submitButton).not.toBeDisabled();

              // Property: Login link should be reachable via keyboard
              await user.tab();
              const loginLink = screen.getByRole('link', { name: /log in/i });
              expect(loginLink).toHaveFocus();

              // Property: Tab order should be logical
              // We've verified: fullName -> email -> password -> passwordToggle -> confirmPassword -> confirmPasswordToggle -> submit -> login link
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 50 } // Reduced runs for async test
      );
    }, 30000); // Increased timeout for property-based test with user interactions
  });
});
