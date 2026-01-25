import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Hero from './Hero';
import { navigateToTaxPreparation, handleNavigationError } from '@/lib/navigation';

// Mock the navigation functions
jest.mock('@/lib/navigation', () => ({
  navigateToTaxPreparation: jest.fn(),
  handleNavigationError: jest.fn()
}));

// Mock the useLoadingState hook
jest.mock('@/hooks/useLoadingState', () => ({
  useLoadingState: () => ({
    isLoading: false,
    executeAsync: jest.fn((fn) => fn())
  })
}));

const mockedNavigateToTaxPreparation = navigateToTaxPreparation as jest.MockedFunction<typeof navigateToTaxPreparation>;
const mockedHandleNavigationError = handleNavigationError as jest.MockedFunction<typeof handleNavigationError>;

describe('Hero Component Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigateToTaxPreparation.mockResolvedValue({ success: true });
  });

  describe('Component Rendering', () => {
    test('renders with default props', () => {
      render(<Hero />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByText(/streamline your tax preparation/i)).toBeInTheDocument();
      expect(screen.getByText(/simplify irs form preparation/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start your tax preparation/i })).toBeInTheDocument();
    });

    test('renders with custom props', () => {
      const customProps = {
        headline: 'Custom Tax Headline',
        subtitle: 'Custom tax subtitle with details',
        ctaText: 'Custom CTA Button'
      };

      render(<Hero {...customProps} />);
      
      expect(screen.getByText('Custom Tax Headline')).toBeInTheDocument();
      expect(screen.getByText('Custom tax subtitle with details')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /custom cta button/i })).toBeInTheDocument();
    });

    test('has proper semantic HTML structure', () => {
      render(<Hero />);
      
      const section = screen.getByRole('banner');
      expect(section).toHaveAttribute('aria-labelledby', 'hero-heading');
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveAttribute('id', 'hero-heading');
      
      const paragraph = screen.getByText(/simplify irs form preparation/i);
      expect(paragraph).toHaveAttribute('aria-describedby', 'hero-heading');
    });

    test('has proper accessibility attributes', () => {
      render(<Hero />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'hero-heading');
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toContain('Begin your tax preparation process');
    });
  });

  describe('User Interactions', () => {
    test('calls default navigation when CTA is clicked', async () => {
      render(<Hero />);
      
      const ctaButton = screen.getByRole('button');
      fireEvent.click(ctaButton);
      
      await waitFor(() => {
        expect(mockedNavigateToTaxPreparation).toHaveBeenCalledTimes(1);
      });
    });

    test('calls custom onCtaClick when provided', async () => {
      const mockOnCtaClick = jest.fn();
      render(<Hero onCtaClick={mockOnCtaClick} />);
      
      const ctaButton = screen.getByRole('button');
      fireEvent.click(ctaButton);
      
      await waitFor(() => {
        expect(mockOnCtaClick).toHaveBeenCalledTimes(1);
        expect(mockedNavigateToTaxPreparation).not.toHaveBeenCalled();
      });
    });

    test('handles keyboard navigation', () => {
      render(<Hero />);
      
      const ctaButton = screen.getByRole('button');
      expect(ctaButton).not.toHaveAttribute('tabindex', '-1');
      
      // Test focus
      ctaButton.focus();
      expect(ctaButton).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    test('handles navigation errors gracefully', async () => {
      mockedNavigateToTaxPreparation.mockResolvedValue({ 
        success: false, 
        error: 'Navigation failed' 
      });

      render(<Hero />);
      
      const ctaButton = screen.getByRole('button');
      fireEvent.click(ctaButton);
      
      await waitFor(() => {
        expect(mockedHandleNavigationError).toHaveBeenCalledWith('Navigation failed');
      });
    });

    test('handles navigation exceptions', async () => {
      mockedNavigateToTaxPreparation.mockRejectedValue(new Error('Network error'));

      render(<Hero />);
      
      const ctaButton = screen.getByRole('button');
      fireEvent.click(ctaButton);
      
      // Should not throw error and component should remain functional
      expect(ctaButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty string props', () => {
      render(<Hero headline="" subtitle="" ctaText="" />);
      
      // Should still render structure even with empty strings
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('handles very long text content', () => {
      const longHeadline = 'A'.repeat(200);
      const longSubtitle = 'B'.repeat(500);
      const longCtaText = 'C'.repeat(100);

      render(<Hero headline={longHeadline} subtitle={longSubtitle} ctaText={longCtaText} />);
      
      expect(screen.getByText(longHeadline)).toBeInTheDocument();
      expect(screen.getByText(longSubtitle)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: new RegExp(longCtaText, 'i') })).toBeInTheDocument();
    });

    test('handles special characters in text', () => {
      const specialHeadline = 'Tax & IRS Forms: 100% Secure!';
      const specialSubtitle = 'File your taxes with confidence - we\'ve got you covered.';
      const specialCtaText = 'Start Now →';

      render(<Hero headline={specialHeadline} subtitle={specialSubtitle} ctaText={specialCtaText} />);
      
      expect(screen.getByText(specialHeadline)).toBeInTheDocument();
      expect(screen.getByText(specialSubtitle)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: new RegExp(specialCtaText.replace('→', ''), 'i') })).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('integrates properly with Button component', () => {
      render(<Hero />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600'); // Primary variant
      expect(button).toHaveClass('h-12'); // Large size
      expect(button).toHaveClass('px-8'); // Custom padding
    });

    test('maintains responsive design classes', () => {
      render(<Hero />);
      
      const section = screen.getByRole('banner');
      expect(section).toHaveClass('py-16', 'sm:py-24');
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-4xl', 'sm:text-5xl', 'lg:text-6xl');
    });
  });
});