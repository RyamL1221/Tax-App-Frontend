/**
 * Integration tests for form data restoration on login page
 * 
 * Tests requirements:
 * - Requirement 8.3: Restore form data after successful login
 * - Requirement 8.4: Display notification if form data exists
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPageClient from '../LoginPageClient';

// Mock FormDataPreserver module
const mockHasSavedFormData = jest.fn();
const mockGetFormDataMetadata = jest.fn();
const mockRestoreFormData = jest.fn();
const mockClearFormData = jest.fn();

jest.mock('@/lib/auth/FormDataPreserver', () => ({
  hasSavedFormData: (...args: any[]) => mockHasSavedFormData(...args),
  getFormDataMetadata: (...args: any[]) => mockGetFormDataMetadata(...args),
  restoreFormData: (...args: any[]) => mockRestoreFormData(...args),
  clearFormData: (...args: any[]) => mockClearFormData(...args),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock LoginForm component
jest.mock('@/components/LoginForm', () => ({
  LoginForm: ({ onSuccess }: any) => (
    <div data-testid="login-form">
      <button
        data-testid="mock-login-button"
        onClick={() => onSuccess('/dashboard')}
      >
        Sign In
      </button>
    </div>
  ),
}));

// Mock ErrorBoundary component
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <div>{children}</div>,
}));

// Mock Card components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
}));

describe('LoginPageClient - Form Data Restoration', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Requirement 8.4: Display notification if form data exists', () => {
    test('should display notification when saved form data exists', async () => {
      // Mock saved form data
      mockHasSavedFormData.mockReturnValue(true);
      mockGetFormDataMetadata.mockReturnValue({
        savedAt: Date.now(),
        formType: '1099-DIV',
        dataSize: 1024,
        expiresAt: Date.now() + 3600000,
        returnUrl: '/forms/1099-div',
      });

      render(<LoginPageClient />);

      // Wait for the notification to appear
      await waitFor(() => {
        expect(screen.getByText(/Your form data has been saved/i)).toBeInTheDocument();
      });

      // Verify the notification contains the form type
      expect(screen.getByText(/1099-DIV/i)).toBeInTheDocument();
      expect(screen.getByText(/will be restored after you log in/i)).toBeInTheDocument();
    });

    test('should not display notification when no saved form data exists', () => {
      // Mock no saved form data
      mockHasSavedFormData.mockReturnValue(false);

      render(<LoginPageClient />);

      // Verify notification is not displayed
      expect(screen.queryByText(/Your form data has been saved/i)).not.toBeInTheDocument();
    });
  });

  describe('Requirement 8.3: Restore form data after successful login', () => {
    test('should restore form data and redirect to form page on successful login', async () => {
      const mockFormData = {
        calendarYear: '2024',
        payerName: 'Test Corp',
        payerTIN: '12-3456789',
        recipientName: 'John Doe',
        recipientTIN: '123-45-6789',
        totalOrdinaryDividends: '1000.00',
      };

      // Mock saved form data
      mockHasSavedFormData.mockReturnValue(true);
      mockGetFormDataMetadata.mockReturnValue({
        savedAt: Date.now(),
        formType: '1099-DIV',
        dataSize: 1024,
        expiresAt: Date.now() + 3600000,
        returnUrl: '/forms/1099-div',
      });
      mockRestoreFormData.mockReturnValue(mockFormData);

      const { getByTestId } = render(<LoginPageClient />);

      // Simulate successful login
      const loginButton = getByTestId('mock-login-button');
      loginButton.click();

      // Wait for redirect
      await waitFor(() => {
        expect(mockRestoreFormData).toHaveBeenCalledWith('1099-DIV');
        expect(mockPush).toHaveBeenCalledWith('/forms/1099-div');
      });
    });

    test('should redirect to dashboard when form data restoration fails', async () => {
      // Mock saved form data but restoration fails
      mockHasSavedFormData.mockReturnValue(true);
      mockGetFormDataMetadata.mockReturnValue({
        savedAt: Date.now(),
        formType: '1099-DIV',
        dataSize: 1024,
        expiresAt: Date.now() + 3600000,
        returnUrl: '/forms/1099-div',
      });
      mockRestoreFormData.mockReturnValue(null); // Restoration fails

      const { getByTestId } = render(<LoginPageClient />);

      // Simulate successful login
      const loginButton = getByTestId('mock-login-button');
      loginButton.click();

      // Wait for redirect
      await waitFor(() => {
        expect(mockRestoreFormData).toHaveBeenCalledWith('1099-DIV');
        expect(mockClearFormData).toHaveBeenCalledWith('1099-DIV');
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('should redirect to dashboard when no saved form data exists', async () => {
      // Mock no saved form data
      mockHasSavedFormData.mockReturnValue(false);

      const { getByTestId } = render(<LoginPageClient />);

      // Simulate successful login
      const loginButton = getByTestId('mock-login-button');
      loginButton.click();

      // Wait for redirect
      await waitFor(() => {
        expect(mockRestoreFormData).not.toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('should respect callbackUrl when no saved form data exists', async () => {
      // Mock no saved form data
      mockHasSavedFormData.mockReturnValue(false);

      const { getByTestId } = render(<LoginPageClient callbackUrl="/custom-page" />);

      // Simulate successful login
      const loginButton = getByTestId('mock-login-button');
      loginButton.click();

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/custom-page');
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle metadata without returnUrl', async () => {
      // Mock saved form data without returnUrl
      mockHasSavedFormData.mockReturnValue(true);
      mockGetFormDataMetadata.mockReturnValue({
        savedAt: Date.now(),
        formType: '1099-DIV',
        dataSize: 1024,
        expiresAt: Date.now() + 3600000,
        // returnUrl is undefined
      });
      mockRestoreFormData.mockReturnValue({ test: 'data' });

      const { getByTestId } = render(<LoginPageClient />);

      // Simulate successful login
      const loginButton = getByTestId('mock-login-button');
      loginButton.click();

      // Should use default form URL
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/forms/1099-div');
      });
    });

    test('should handle null metadata gracefully', async () => {
      // Mock saved form data but null metadata
      mockHasSavedFormData.mockReturnValue(true);
      mockGetFormDataMetadata.mockReturnValue(null);

      render(<LoginPageClient />);

      // Should not display notification
      expect(screen.queryByText(/Your form data has been saved/i)).not.toBeInTheDocument();
    });
  });
});
