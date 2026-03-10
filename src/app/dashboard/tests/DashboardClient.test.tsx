/**
 * Unit tests for DashboardClient component
 * 
 * Tests dashboard layout and integration requirements:
 * - Requirements 1.1: Display tax form selection interface for authenticated users
 * - Requirements 5.3: Follow existing React component architecture patterns
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardClient from '../DashboardClient';

// Mock TaxFormSelector component
jest.mock('@/components/TaxFormSelector', () => ({
  TaxFormSelector: () => <div data-testid="tax-form-selector">Tax Form Selector</div>,
}));

// Mock LogoutButton component
jest.mock('@/components/LogoutButton', () => ({
  LogoutButton: () => <button data-testid="logout-button">Log Out</button>,
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

describe('DashboardClient', () => {
  describe('Component Rendering - Requirement 1.1', () => {
    it('should render with form selector', () => {
      render(<DashboardClient />);

      // Verify TaxFormSelector is rendered
      const formSelector = screen.getByTestId('tax-form-selector');
      expect(formSelector).toBeInTheDocument();
    });

    it('should display page title', () => {
      render(<DashboardClient />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Tax Form Dashboard');
    });

    it('should display page description', () => {
      render(<DashboardClient />);

      const description = screen.getByText(/Select a tax form to begin filling out your information/i);
      expect(description).toBeInTheDocument();
    });

    it('should display help center link', () => {
      render(<DashboardClient />);

      const helpLink = screen.getByRole('link', { name: /Visit our help center/i });
      expect(helpLink).toBeInTheDocument();
      expect(helpLink).toHaveAttribute('href', '/help');
    });

    it('should render logout button - Requirement 2.1', () => {
      render(<DashboardClient />);

      const logoutButton = screen.getByTestId('logout-button');
      expect(logoutButton).toBeInTheDocument();
    });
  });

  describe('Layout Structure - Requirement 5.3', () => {
    it('should wrap content in ErrorBoundary', () => {
      render(<DashboardClient />);

      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toBeInTheDocument();
    });

    it('should render Card with elevated variant', () => {
      render(<DashboardClient />);

      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-variant', 'elevated');
      expect(card).toHaveClass('shadow-xl');
    });

    it('should render CardHeader with proper styling', () => {
      render(<DashboardClient />);

      const cardHeader = screen.getByTestId('card-header');
      expect(cardHeader).toBeInTheDocument();
      expect(cardHeader).toHaveClass('space-y-2', 'pb-6');
    });

    it('should render CardContent with proper styling', () => {
      render(<DashboardClient />);

      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toBeInTheDocument();
      expect(cardContent).toHaveClass('pb-8');
    });

    it('should render all layout components in correct hierarchy', () => {
      render(<DashboardClient />);

      // Verify hierarchy: ErrorBoundary > Container > Card > Header + Content
      const errorBoundary = screen.getByTestId('error-boundary');
      const card = screen.getByTestId('card');
      const cardHeader = screen.getByTestId('card-header');
      const cardContent = screen.getByTestId('card-content');
      const formSelector = screen.getByTestId('tax-form-selector');

      expect(errorBoundary).toContainElement(card);
      expect(card).toContainElement(cardHeader);
      expect(card).toContainElement(cardContent);
      expect(cardContent).toContainElement(formSelector);
    });

    it('should have main container with proper layout classes', () => {
      const { container } = render(<DashboardClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass(
        'min-h-screen',
        'flex',
        'items-center',
        'justify-center',
        'bg-gray-50'
      );
    });

    it('should have responsive container with proper width constraints', () => {
      const { container } = render(<DashboardClient />);

      const responsiveContainer = container.querySelector('.w-full.max-w-2xl');
      expect(responsiveContainer).toBeInTheDocument();
      expect(responsiveContainer).toHaveClass('w-full', 'max-w-2xl');
    });
  });

  describe('Responsive Design - Requirement 5.3', () => {
    it('should have responsive padding on main container', () => {
      const { container } = render(<DashboardClient />);

      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('px-4', 'py-12', 'sm:px-6', 'lg:px-8');
    });

    it('should have responsive text size for title', () => {
      render(<DashboardClient />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-2xl', 'sm:text-3xl');
    });

    it('should have responsive text size for description', () => {
      render(<DashboardClient />);

      const description = screen.getByText(/Select a tax form to begin filling out your information/i);
      expect(description).toHaveClass('text-sm', 'sm:text-base');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<DashboardClient />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible link with proper styling', () => {
      render(<DashboardClient />);

      const helpLink = screen.getByRole('link', { name: /Visit our help center/i });
      expect(helpLink).toHaveClass(
        'font-medium',
        'text-blue-600',
        'hover:text-blue-500',
        'focus:outline-none',
        'focus:underline',
        'transition-colors'
      );
    });

    it('should have proper color contrast for text elements', () => {
      render(<DashboardClient />);

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-gray-900');

      const description = screen.getByText(/Select a tax form to begin filling out your information/i);
      expect(description).toHaveClass('text-gray-600');
    });
  });

  describe('Component Integration', () => {
    it('should integrate TaxFormSelector within CardContent', () => {
      render(<DashboardClient />);

      const cardContent = screen.getByTestId('card-content');
      const formSelector = screen.getByTestId('tax-form-selector');

      expect(cardContent).toContainElement(formSelector);
    });

    it('should render help section below card', () => {
      const { container } = render(<DashboardClient />);

      const helpSection = container.querySelector('.mt-6.text-center');
      expect(helpSection).toBeInTheDocument();
      expect(helpSection).toHaveClass('mt-6', 'text-center');
    });

    it('should position logout button in CardHeader - Requirement 2.2', () => {
      render(<DashboardClient />);

      const cardHeader = screen.getByTestId('card-header');
      const logoutButton = screen.getByTestId('logout-button');

      expect(cardHeader).toContainElement(logoutButton);
    });

    it('should have flex layout with title centered and logout button on right - Requirement 2.2', () => {
      const { container } = render(<DashboardClient />);

      // Find the flex container
      const flexContainer = container.querySelector('.flex.items-start.justify-between');
      expect(flexContainer).toBeInTheDocument();

      // Verify title container is centered
      const titleContainer = container.querySelector('.flex-1.text-center');
      expect(titleContainer).toBeInTheDocument();
      expect(flexContainer).toContainElement(titleContainer!);
    });
  });
});
