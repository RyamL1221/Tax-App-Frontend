/**
 * Unit tests for LoginPageClient responsive layout
 * 
 * Tests responsive design requirements:
 * - Requirements 6.1: Mobile layout (width < 768px)
 * - Requirements 6.2: Desktop layout (width >= 768px)
 * - Requirements 6.4: Touch-friendly button sizes
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPageClient from './LoginPageClient';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock LoginForm component
jest.mock('@/components/LoginForm', () => ({
  LoginForm: ({ onSuccess, onError }: any) => (
    <div data-testid="login-form">
      <button
        data-testid="mock-submit-button"
        onClick={() => onSuccess('/dashboard')}
      >
        Sign In
      </button>
    </div>
  ),
}));

// Mock ErrorBoundary component
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock Card components
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children, className, variant }: any) => (
    <div data-testid="card" className={className} data-variant={variant}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
}));

describe('LoginPageClient - Responsive Layout', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  describe('Mobile Layout (width < 768px) - Requirement 6.1', () => {
    test('should display centered single-column layout on mobile', () => {
      const { container } = render(<LoginPageClient />);

      // Find the main container
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center');

      // Find the responsive container
      const responsiveContainer = container.querySelector('.w-full.max-w-md');
      expect(responsiveContainer).toBeInTheDocument();
      expect(responsiveContainer).toHaveClass('w-full', 'max-w-md');

      // Verify card is rendered
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
    });

    test('should have proper mobile padding', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('px-4', 'py-12');
    });

    test('should display page title with responsive text size', () => {
      render(<LoginPageClient />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Sign in to your account');
      
      // Check for responsive text classes (text-2xl on mobile, sm:text-3xl on larger screens)
      expect(title).toHaveClass('text-2xl', 'sm:text-3xl');
    });

    test('should display page description with responsive text size', () => {
      render(<LoginPageClient />);

      const description = screen.getByText(/Enter your credentials to access your tax preparation dashboard/i);
      expect(description).toBeInTheDocument();
      
      // Check for responsive text classes (text-sm on mobile, sm:text-base on larger screens)
      expect(description).toHaveClass('text-sm', 'sm:text-base');
    });
  });

  describe('Desktop Layout (width >= 768px) - Requirement 6.2', () => {
    test('should display centered card layout on desktop', () => {
      const { container } = render(<LoginPageClient />);

      // Verify the card has elevated variant for desktop
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('data-variant', 'elevated');
      expect(card).toHaveClass('shadow-xl');
    });

    test('should have proper desktop padding', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      // Desktop padding classes: sm:px-6 lg:px-8
      expect(mainContainer).toHaveClass('sm:px-6', 'lg:px-8');
    });

    test('should constrain width with max-w-md on desktop', () => {
      const { container } = render(<LoginPageClient />);

      const responsiveContainer = container.querySelector('.max-w-md');
      expect(responsiveContainer).toBeInTheDocument();
      expect(responsiveContainer).toHaveClass('max-w-md');
    });

    test('should center content vertically and horizontally', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Touch-Friendly Button Sizes - Requirement 6.4', () => {
    test('should render LoginForm which contains touch-friendly buttons', () => {
      render(<LoginPageClient />);

      // Verify LoginForm is rendered (which contains the touch-friendly buttons)
      const loginForm = screen.getByTestId('login-form');
      expect(loginForm).toBeInTheDocument();
    });

    test('should have proper spacing for touch targets', () => {
      const { container } = render(<LoginPageClient />);

      // Verify CardContent has proper padding for touch targets
      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toHaveClass('pb-8');
    });

    test('should have proper spacing in CardHeader', () => {
      render(<LoginPageClient />);

      const cardHeader = screen.getByTestId('card-header');
      expect(cardHeader).toHaveClass('space-y-2', 'text-center', 'pb-6');
    });
  });

  describe('Layout Structure', () => {
    test('should wrap content in ErrorBoundary', () => {
      render(<LoginPageClient />);

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toBeInTheDocument();
    });

    test('should render all layout components in correct hierarchy', () => {
      render(<LoginPageClient />);

      // Verify hierarchy: ErrorBoundary > Container > Card > Header + Content
      const errorBoundary = screen.getByTestId('error-boundary');
      const card = screen.getByTestId('card');
      const cardHeader = screen.getByTestId('card-header');
      const cardContent = screen.getByTestId('card-content');
      const loginForm = screen.getByTestId('login-form');

      expect(errorBoundary).toContainElement(card);
      expect(card).toContainElement(cardHeader);
      expect(card).toContainElement(cardContent);
      expect(cardContent).toContainElement(loginForm);
    });

    test('should display signup link with proper styling', () => {
      render(<LoginPageClient />);

      const signupLink = screen.getByRole('link', { name: /sign up/i });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute('href', '/signup');
      expect(signupLink).toHaveClass(
        'font-medium',
        'text-blue-600',
        'hover:text-blue-500',
        'focus:outline-none',
        'focus:underline',
        'transition-colors'
      );
    });

    test('should have proper background color', () => {
      const { container } = render(<LoginPageClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('bg-gray-50');
    });
  });

  describe('Callback URL Handling', () => {
    test('should pass callbackUrl to success handler', () => {
      const callbackUrl = '/protected-page';
      render(<LoginPageClient callbackUrl={callbackUrl} />);

      const submitButton = screen.getByTestId('mock-submit-button');
      submitButton.click();

      expect(mockPush).toHaveBeenCalledWith(callbackUrl);
    });

    test('should use default redirect when no callbackUrl provided', () => {
      render(<LoginPageClient />);

      const submitButton = screen.getByTestId('mock-submit-button');
      submitButton.click();

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Session Expiration Message - Requirement 5.3', () => {
    test('should display expiration message when expired parameter is true', () => {
      render(<LoginPageClient expired={true} />);

      const message = screen.getByText(/Your session has expired. Please log in again./i);
      expect(message).toBeInTheDocument();
      
      // Verify it's styled as an informational message (blue)
      const messageContainer = message.closest('div[role="alert"]');
      expect(messageContainer).toHaveClass('bg-blue-50', 'border-blue-200');
    });

    test('should not display expiration message when expired parameter is false', () => {
      render(<LoginPageClient expired={false} />);

      const message = screen.queryByText(/Your session has expired. Please log in again./i);
      expect(message).not.toBeInTheDocument();
    });

    test('should not display expiration message when expired parameter is not provided', () => {
      render(<LoginPageClient />);

      const message = screen.queryByText(/Your session has expired. Please log in again./i);
      expect(message).not.toBeInTheDocument();
    });

    test('should allow dismissing the expiration message', () => {
      render(<LoginPageClient expired={true} />);

      // Message should be visible initially
      let message = screen.getByText(/Your session has expired. Please log in again./i);
      expect(message).toBeInTheDocument();

      // Find and click the dismiss button
      const dismissButton = screen.getByLabelText('Dismiss message');
      
      act(() => {
        dismissButton.click();
      });

      // Message should be removed
      message = screen.queryByText(/Your session has expired. Please log in again./i);
      expect(message).not.toBeInTheDocument();
    });

    test('should have proper accessibility attributes', () => {
      render(<LoginPageClient expired={true} />);

      const messageContainer = screen.getByRole('alert');
      expect(messageContainer).toBeInTheDocument();

      const dismissButton = screen.getByLabelText('Dismiss message');
      expect(dismissButton).toHaveAttribute('type', 'button');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss message');
    });

    test('should display info icon with expiration message', () => {
      const { container } = render(<LoginPageClient expired={true} />);

      // Find the alert container
      const alert = screen.getByRole('alert');
      
      // Verify the info icon SVG is present
      const infoIcon = alert.querySelector('svg.text-blue-400');
      expect(infoIcon).toBeInTheDocument();
    });

    test('should display close icon on dismiss button', () => {
      const { container } = render(<LoginPageClient expired={true} />);

      const dismissButton = screen.getByLabelText('Dismiss message');
      
      // Verify the close icon SVG is present
      const closeIcon = dismissButton.querySelector('svg');
      expect(closeIcon).toBeInTheDocument();
    });
  });
});
