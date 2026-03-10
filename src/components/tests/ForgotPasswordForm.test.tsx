/**
 * Unit Tests for ForgotPasswordForm component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForgotPasswordForm } from '../ForgotPasswordForm';

jest.mock('@/hooks/useForgotPasswordForm');
import { useForgotPasswordForm } from '@/hooks/useForgotPasswordForm';

const mockUseForgotPasswordForm = useForgotPasswordForm as jest.MockedFunction<typeof useForgotPasswordForm>;

describe('ForgotPasswordForm', () => {
  const mockSetEmail = jest.fn();
  const mockHandleSubmit = jest.fn((e) => e.preventDefault());

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseForgotPasswordForm.mockReturnValue({
      email: '',
      setEmail: mockSetEmail,
      error: undefined,
      isSubmitting: false,
      isSuccess: false,
      isRateLimited: false,
      rateLimitMessage: '',
      handleSubmit: mockHandleSubmit,
    });
  });

  describe('Form Rendering', () => {
    it('should render email input field', () => {
      render(<ForgotPasswordForm />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<ForgotPasswordForm />);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should render back to login link', () => {
      render(<ForgotPasswordForm />);
      const loginLink = screen.getByRole('link', { name: /back to login/i });
      expect(loginLink).toBeInTheDocument();
    });
  });

  describe('Form Submission Flow', () => {
    it('should call handleSubmit when form is submitted', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordForm />);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);
      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('should disable form fields during submission', () => {
      mockUseForgotPasswordForm.mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        error: undefined,
        isSubmitting: true,
        isSuccess: false,
        isRateLimited: false,
        rateLimitMessage: '',
        handleSubmit: mockHandleSubmit,
      });
      render(<ForgotPasswordForm />);
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeDisabled();
    });

    it('should display loading state on submit button during submission', () => {
      mockUseForgotPasswordForm.mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        error: undefined,
        isSubmitting: true,
        isSuccess: false,
        isRateLimited: false,
        rateLimitMessage: '',
        handleSubmit: mockHandleSubmit,
      });
      render(<ForgotPasswordForm />);
      expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display rate limit message when rate limited', () => {
      mockUseForgotPasswordForm.mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        error: undefined,
        isSubmitting: false,
        isSuccess: false,
        isRateLimited: true,
        rateLimitMessage: 'Too many requests.',
        handleSubmit: mockHandleSubmit,
      });
      render(<ForgotPasswordForm />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Too many requests.');
    });
  });

  describe('Success State Display', () => {
    it('should display success message when isSuccess is true', () => {
      mockUseForgotPasswordForm.mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        error: undefined,
        isSubmitting: false,
        isSuccess: true,
        isRateLimited: false,
        rateLimitMessage: '',
        handleSubmit: mockHandleSubmit,
      });
      render(<ForgotPasswordForm />);
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    it('should hide form when success state is shown', () => {
      mockUseForgotPasswordForm.mockReturnValue({
        email: 'test@example.com',
        setEmail: mockSetEmail,
        error: undefined,
        isSubmitting: false,
        isSuccess: true,
        isRateLimited: false,
        rateLimitMessage: '',
        handleSubmit: mockHandleSubmit,
      });
      render(<ForgotPasswordForm />);
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper autocomplete attribute on email input', () => {
      render(<ForgotPasswordForm />);
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
    });
  });
});
