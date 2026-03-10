/**
 * Unit Tests for ResetPasswordForm component
 * 
 * Tests rendering, password visibility toggles, submission flow, error display, and success state.
 * 
 * Requirements: 4.2, 6.1, 6.2, 7.2
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResetPasswordForm } from '../ResetPasswordForm';

// Mock the useResetPasswordForm hook
jest.mock('@/hooks/useResetPasswordForm');
import { useResetPasswordForm } from '@/hooks/useResetPasswordForm';

const mockUseResetPasswordForm = useResetPasswordForm as jest.MockedFunction<typeof useResetPasswordForm>;

describe('ResetPasswordForm', () => {
  const mockOnSuccess = jest.fn();
  const mockSetNewPassword = jest.fn();
  const mockSetConfirmPassword = jest.fn();
  const mockToggleNewPasswordVisibility = jest.fn();
  const mockToggleConfirmPasswordVisibility = jest.fn();
  const mockHandleSubmit = jest.fn((e) => e.preventDefault());

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUseResetPasswordForm.mockReturnValue({
      newPassword: '',
      setNewPassword: mockSetNewPassword,
      confirmPassword: '',
      setConfirmPassword: mockSetConfirmPassword,
      showNewPassword: false,
      toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
      showConfirmPassword: false,
      toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
      errors: {},
      isSubmitting: false,
      isSuccess: false,
      handleSubmit: mockHandleSubmit,
    });
  });

  describe('Form Rendering', () => {
    it('should render new password input field', () => {
      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);
      
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    it('should render confirm password input field', () => {
      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);
      
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should render password requirements', () => {
      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);
      
      // PasswordRequirements component should be rendered
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should render back to login link', () => {
      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);
      
      const loginLink = screen.getByRole('link', { name: /back to login/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should have noValidate on form', () => {
      const { container } = render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);
      
      const form = container.querySelector('form');
      expect(form).toHaveAttribute('noValidate');
    });
  });

  describe('Password Visibility Toggles', () => {
    it('should toggle new password visibility when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      // Find the toggle button for new password (first one)
      const toggleButtons = screen.getAllByRole('button', { name: /show password|hide password/i });
      await user.click(toggleButtons[0]);

      expect(mockToggleNewPasswordVisibility).toHaveBeenCalled();
    });

    it('should toggle confirm password visibility when button is clicked', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      // Find the toggle button for confirm password (second one)
      const toggleButtons = screen.getAllByRole('button', { name: /show password|hide password/i });
      await user.click(toggleButtons[1]);

      expect(mockToggleConfirmPasswordVisibility).toHaveBeenCalled();
    });

    it('should show new password as text when showNewPassword is true', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: 'testpassword',
        setNewPassword: mockSetNewPassword,
        confirmPassword: '',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: true,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: {},
        isSubmitting: false,
        isSuccess: false,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      expect(newPasswordInput).toHaveAttribute('type', 'text');
    });

    it('should show confirm password as text when showConfirmPassword is true', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: '',
        setNewPassword: mockSetNewPassword,
        confirmPassword: 'testpassword',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: true,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: {},
        isSubmitting: false,
        isSuccess: false,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Form Submission Flow', () => {
    it('should call handleSubmit when form is submitted', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);
      
      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('should disable form fields during submission', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: 'testpassword',
        setNewPassword: mockSetNewPassword,
        confirmPassword: 'testpassword',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: {},
        isSubmitting: true,
        isSuccess: false,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /loading/i });

      expect(newPasswordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    it('should display loading state on submit button during submission', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: 'testpassword',
        setNewPassword: mockSetNewPassword,
        confirmPassword: 'testpassword',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: {},
        isSubmitting: true,
        isSuccess: false,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /loading/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display new password validation error', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: 'short',
        setNewPassword: mockSetNewPassword,
        confirmPassword: '',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: { newPassword: 'Password must be at least 8 characters' },
        isSubmitting: false,
        isSuccess: false,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    it('should display confirm password validation error', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: 'testpassword',
        setNewPassword: mockSetNewPassword,
        confirmPassword: 'different',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: { confirmPassword: 'Passwords do not match' },
        isSubmitting: false,
        isSuccess: false,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    it('should display general error for expired token', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: '',
        setNewPassword: mockSetNewPassword,
        confirmPassword: '',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: { general: 'This reset link has expired. Please request a new one.' },
        isSubmitting: false,
        isSuccess: false,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('This reset link has expired. Please request a new one.');
    });

    it('should display general error for invalid token', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: '',
        setNewPassword: mockSetNewPassword,
        confirmPassword: '',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: { general: 'This reset link is invalid. Please request a new one.' },
        isSubmitting: false,
        isSuccess: false,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('This reset link is invalid. Please request a new one.');
    });

    it('should display link to request new reset when error mentions it', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: '',
        setNewPassword: mockSetNewPassword,
        confirmPassword: '',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: { general: 'This reset link has expired. Please request a new one.' },
        isSubmitting: false,
        isSuccess: false,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      const requestNewLink = screen.getByRole('link', { name: /request a new reset link/i });
      expect(requestNewLink).toBeInTheDocument();
      expect(requestNewLink).toHaveAttribute('href', '/forgot-password');
    });

    it('should display network error', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: '',
        setNewPassword: mockSetNewPassword,
        confirmPassword: '',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: { general: 'Unable to connect. Please check your internet connection.' },
        isSubmitting: false,
        isSuccess: false,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent('Unable to connect. Please check your internet connection.');
    });
  });

  describe('Success State Display', () => {
    it('should display success message when isSuccess is true', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: 'testpassword',
        setNewPassword: mockSetNewPassword,
        confirmPassword: 'testpassword',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: {},
        isSubmitting: false,
        isSuccess: true,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      expect(screen.getByText(/you can now log in with your new password/i)).toBeInTheDocument();
    });

    it('should hide form when success state is shown', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: 'testpassword',
        setNewPassword: mockSetNewPassword,
        confirmPassword: 'testpassword',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: {},
        isSubmitting: false,
        isSuccess: true,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      // Form elements should not be present
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reset password/i })).not.toBeInTheDocument();
    });

    it('should display redirect notice in success state', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: 'testpassword',
        setNewPassword: mockSetNewPassword,
        confirmPassword: 'testpassword',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: {},
        isSubmitting: false,
        isSuccess: true,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/redirecting to login page/i)).toBeInTheDocument();
    });

    it('should display go to login button in success state', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: 'testpassword',
        setNewPassword: mockSetNewPassword,
        confirmPassword: 'testpassword',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: {},
        isSubmitting: false,
        isSuccess: true,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      const loginLink = screen.getByRole('link', { name: /go to login now/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should have aria-live="polite" on success status', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: 'testpassword',
        setNewPassword: mockSetNewPassword,
        confirmPassword: 'testpassword',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: {},
        isSubmitting: false,
        isSuccess: true,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Accessibility', () => {
    it('should have proper autocomplete attributes', () => {
      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      expect(newPasswordInput).toHaveAttribute('autocomplete', 'new-password');
      expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password');
    });

    it('should have aria-live="assertive" on general error alert', () => {
      mockUseResetPasswordForm.mockReturnValue({
        newPassword: '',
        setNewPassword: mockSetNewPassword,
        confirmPassword: '',
        setConfirmPassword: mockSetConfirmPassword,
        showNewPassword: false,
        toggleNewPasswordVisibility: mockToggleNewPasswordVisibility,
        showConfirmPassword: false,
        toggleConfirmPasswordVisibility: mockToggleConfirmPasswordVisibility,
        errors: { general: 'An error occurred' },
        isSubmitting: false,
        isSuccess: false,
        handleSubmit: mockHandleSubmit,
      });

      render(<ResetPasswordForm token="valid-token" onSuccess={mockOnSuccess} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });
});
