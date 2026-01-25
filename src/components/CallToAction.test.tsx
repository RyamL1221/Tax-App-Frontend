import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CallToAction from './CallToAction';
import { navigateToTaxPreparation, navigateToLearnMore, navigateToSupport, handleNavigationError } from '@/lib/navigation';

// Mock the navigation functions
jest.mock('@/lib/navigation', () => ({
  navigateToTaxPreparation: jest.fn(),
  navigateToLearnMore: jest.fn(),
  navigateToSupport: jest.fn(),
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
const mockedNavigateToLearnMore = navigateToLearnMore as jest.MockedFunction<typeof navigateToLearnMore>;
const mockedNavigateToSupport = navigateToSupport as jest.MockedFunction<typeof navigateToSupport>;
const mockedHandleNavigationError = handleNavigationError as jest.MockedFunction<typeof handleNavigationError>;

describe('CallToAction Component Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigateToTaxPreparation.mockResolvedValue({ success: true });
    mockedNavigateToLearnMore.mockResolvedValue({ success: true });
    mockedNavigateToSupport.mockResolvedValue({ success: true });
  });

  describe('Component Rendering', () => {
    test('renders with default props', () => {
      render(<CallToAction />);
      
      expect(screen.getByRole('heading', { level: 2, name: /ready to simplify/i })).toBeInTheDocument();
      expect(screen.getByText(/join thousands of users/i)).toBeInTheDocument();
      
      expect(screen.getByRole('button', { name: /start your tax preparation now/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /learn more about our process/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument();
    });

    test('renders with custom props', () => {
      const customProps = {
        primaryText: 'Custom Primary Action',
        secondaryText: 'Custom Secondary Action',
        supportText: 'Custom Support Action'
      };

      render(<CallToAction {...customProps} />);
      
      expect(screen.getByRole('button', { name: /custom primary action/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /custom secondary action/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /custom support action/i })).toBeInTheDocument();
    });

    test('has proper semantic HTML structure', () => {
      render(<CallToAction />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-labelledby', 'cta-heading');
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveAttribute('id', 'cta-heading');
      
      const buttonGroup = screen.getByRole('group', { name: /call to action buttons/i });
      expect(buttonGroup).toBeInTheDocument();
    });

    test('has proper accessibility attributes', () => {
      render(<CallToAction />);
      
      const primaryButton = screen.getByRole('button', { name: /start your tax preparation now/i });
      const secondaryButton = screen.getByRole('button', { name: /learn more about our process/i });
      const supportButton = screen.getByRole('button', { name: /contact support/i });
      
      expect(primaryButton).toHaveAttribute('aria-describedby', 'cta-heading');
      expect(secondaryButton).toHaveAttribute('aria-describedby', 'cta-heading');
      expect(supportButton).toHaveAttribute('aria-label');
    });
  });

  describe('Trust Indicators Section', () => {
    test('renders trust indicators with proper accessibility', () => {
      render(<CallToAction />);
      
      const trustSection = screen.getByRole('complementary', { name: /trust indicators/i });
      expect(trustSection).toBeInTheDocument();
      
      const trustList = screen.getByRole('list', { name: /security and compliance features/i });
      expect(trustList).toBeInTheDocument();
      
      const trustItems = screen.getAllByRole('listitem');
      expect(trustItems).toHaveLength(3);
      
      // Check for specific trust indicators
      expect(screen.getByText('Bank-Level Security')).toBeInTheDocument();
      expect(screen.getByText('IRS Compliant')).toBeInTheDocument();
      expect(screen.getByText('24/7 Support')).toBeInTheDocument();
      
      // Check for security details
      expect(screen.getByText(/256-bit ssl encryption/i)).toBeInTheDocument();
      expect(screen.getByText(/fully compliant with all irs/i)).toBeInTheDocument();
      expect(screen.getByText(/expert support available/i)).toBeInTheDocument();
    });

    test('has proper accessibility for trust indicator icons', () => {
      render(<CallToAction />);
      
      const securityIcon = screen.getByRole('img', { name: /security lock icon/i });
      const complianceIcon = screen.getByRole('img', { name: /compliance checkmark icon/i });
      const supportIcon = screen.getByRole('img', { name: /24\/7 support icon/i });
      
      expect(securityIcon).toBeInTheDocument();
      expect(complianceIcon).toBeInTheDocument();
      expect(supportIcon).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('calls default navigation for primary button', async () => {
      render(<CallToAction />);
      
      const primaryButton = screen.getByRole('button', { name: /start your tax preparation now/i });
      fireEvent.click(primaryButton);
      
      await waitFor(() => {
        expect(mockedNavigateToTaxPreparation).toHaveBeenCalledTimes(1);
      });
    });

    test('calls default navigation for secondary button', async () => {
      render(<CallToAction />);
      
      const secondaryButton = screen.getByRole('button', { name: /learn more about our process/i });
      fireEvent.click(secondaryButton);
      
      await waitFor(() => {
        expect(mockedNavigateToLearnMore).toHaveBeenCalledTimes(1);
      });
    });

    test('calls default navigation for support button', async () => {
      render(<CallToAction />);
      
      const supportButton = screen.getByRole('button', { name: /contact support/i });
      fireEvent.click(supportButton);
      
      await waitFor(() => {
        expect(mockedNavigateToSupport).toHaveBeenCalledTimes(1);
      });
    });

    test('calls custom action handlers when provided', async () => {
      const mockPrimaryAction = jest.fn();
      const mockSecondaryAction = jest.fn();
      const mockSupportAction = jest.fn();

      render(
        <CallToAction
          primaryAction={mockPrimaryAction}
          secondaryAction={mockSecondaryAction}
          supportAction={mockSupportAction}
        />
      );
      
      const primaryButton = screen.getByRole('button', { name: /start your tax preparation now/i });
      const secondaryButton = screen.getByRole('button', { name: /learn more about our process/i });
      const supportButton = screen.getByRole('button', { name: /contact support/i });
      
      fireEvent.click(primaryButton);
      fireEvent.click(secondaryButton);
      fireEvent.click(supportButton);
      
      await waitFor(() => {
        expect(mockPrimaryAction).toHaveBeenCalledTimes(1);
        expect(mockSecondaryAction).toHaveBeenCalledTimes(1);
        expect(mockSupportAction).toHaveBeenCalledTimes(1);
        
        // Default navigation should not be called
        expect(mockedNavigateToTaxPreparation).not.toHaveBeenCalled();
        expect(mockedNavigateToLearnMore).not.toHaveBeenCalled();
        expect(mockedNavigateToSupport).not.toHaveBeenCalled();
      });
    });

    test('handles keyboard navigation for support button', () => {
      render(<CallToAction />);
      
      const supportButton = screen.getByRole('button', { name: /contact support/i });
      
      // Test Enter key
      fireEvent.keyDown(supportButton, { key: 'Enter' });
      expect(mockedNavigateToSupport).toHaveBeenCalledTimes(1);
      
      jest.clearAllMocks();
      
      // Test Space key
      fireEvent.keyDown(supportButton, { key: ' ' });
      expect(mockedNavigateToSupport).toHaveBeenCalledTimes(1);
    });

    test('ignores other keyboard events for support button', () => {
      render(<CallToAction />);
      
      const supportButton = screen.getByRole('button', { name: /contact support/i });
      
      fireEvent.keyDown(supportButton, { key: 'Tab' });
      fireEvent.keyDown(supportButton, { key: 'Escape' });
      fireEvent.keyDown(supportButton, { key: 'a' });
      
      expect(mockedNavigateToSupport).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('handles primary navigation errors gracefully', async () => {
      mockedNavigateToTaxPreparation.mockResolvedValue({ 
        success: false, 
        error: 'Primary navigation failed' 
      });

      render(<CallToAction />);
      
      const primaryButton = screen.getByRole('button', { name: /start your tax preparation now/i });
      fireEvent.click(primaryButton);
      
      await waitFor(() => {
        expect(mockedHandleNavigationError).toHaveBeenCalledWith('Primary navigation failed');
      });
    });

    test('handles secondary navigation errors gracefully', async () => {
      mockedNavigateToLearnMore.mockResolvedValue({ 
        success: false, 
        error: 'Secondary navigation failed' 
      });

      render(<CallToAction />);
      
      const secondaryButton = screen.getByRole('button', { name: /learn more about our process/i });
      fireEvent.click(secondaryButton);
      
      await waitFor(() => {
        expect(mockedHandleNavigationError).toHaveBeenCalledWith('Secondary navigation failed');
      });
    });

    test('handles support navigation errors gracefully', async () => {
      mockedNavigateToSupport.mockResolvedValue({ 
        success: false, 
        error: 'Support navigation failed' 
      });

      render(<CallToAction />);
      
      const supportButton = screen.getByRole('button', { name: /contact support/i });
      fireEvent.click(supportButton);
      
      await waitFor(() => {
        expect(mockedHandleNavigationError).toHaveBeenCalledWith('Support navigation failed');
      });
    });

    test('handles navigation exceptions', async () => {
      mockedNavigateToTaxPreparation.mockRejectedValue(new Error('Network error'));

      render(<CallToAction />);
      
      const primaryButton = screen.getByRole('button', { name: /start your tax preparation now/i });
      fireEvent.click(primaryButton);
      
      // Should not throw error and component should remain functional
      expect(primaryButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty string props', () => {
      render(<CallToAction primaryText="" secondaryText="" supportText="" />);
      
      // Should still render buttons even with empty strings
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    test('handles very long text content', () => {
      const longTexts = {
        primaryText: 'A'.repeat(100),
        secondaryText: 'B'.repeat(100),
        supportText: 'C'.repeat(100)
      };

      render(<CallToAction {...longTexts} />);
      
      expect(screen.getByRole('button', { name: new RegExp(longTexts.primaryText, 'i') })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: new RegExp(longTexts.secondaryText, 'i') })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: new RegExp(longTexts.supportText, 'i') })).toBeInTheDocument();
    });

    test('handles special characters in text', () => {
      const specialTexts = {
        primaryText: 'Start Now & Save!',
        secondaryText: 'Learn More "Details"',
        supportText: 'Get Help 24/7'
      };

      render(<CallToAction {...specialTexts} />);
      
      expect(screen.getByRole('button', { name: /start now & save!/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /learn more "details"/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /get help 24\/7/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('has responsive button layout classes', () => {
      render(<CallToAction />);
      
      const buttonGroup = screen.getByRole('group');
      expect(buttonGroup).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'gap-4');
    });

    test('has responsive trust indicators grid', () => {
      render(<CallToAction />);
      
      const trustGrid = screen.getByRole('list', { name: /security and compliance features/i });
      expect(trustGrid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    });

    test('maintains proper spacing and layout', () => {
      render(<CallToAction />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveClass('py-16', 'sm:py-24', 'bg-blue-600');
    });
  });

  describe('Component Integration', () => {
    test('integrates properly with Button components', () => {
      render(<CallToAction />);
      
      const primaryButton = screen.getByRole('button', { name: /start your tax preparation now/i });
      const secondaryButton = screen.getByRole('button', { name: /learn more about our process/i });
      
      // Primary button should have white background (custom styling)
      expect(primaryButton).toHaveClass('bg-white', 'text-blue-600');
      
      // Secondary button should have outline styling
      expect(secondaryButton).toHaveClass('border-white', 'text-white');
    });

    test('maintains consistent button sizing', () => {
      render(<CallToAction />);
      
      const buttons = screen.getAllByRole('button').slice(0, 2); // Exclude support button
      buttons.forEach((button) => {
        expect(button).toHaveClass('px-8', 'py-4', 'text-lg');
      });
    });
  });
});