/**
 * Property-based tests for navigation functionality
 * **Feature: tax-app-landing, Property 5: Navigation functionality**
 * **Validates: Requirements 3.2**
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import Hero from './Hero';
import CallToAction from './CallToAction';
import { navigateToTaxPreparation, navigateToLearnMore, navigateToSupport } from '@/lib/navigation';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the navigation functions
jest.mock('@/lib/navigation', () => ({
  navigateToTaxPreparation: jest.fn(),
  navigateToLearnMore: jest.fn(),
  navigateToSupport: jest.fn(),
  handleNavigationError: jest.fn()
}));

const mockedNavigateToTaxPreparation = navigateToTaxPreparation as jest.MockedFunction<typeof navigateToTaxPreparation>;
const mockedNavigateToLearnMore = navigateToLearnMore as jest.MockedFunction<typeof navigateToLearnMore>;
const mockedNavigateToSupport = navigateToSupport as jest.MockedFunction<typeof navigateToSupport>;

describe('Navigation Functionality Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful navigation
    mockedNavigateToTaxPreparation.mockResolvedValue({ success: true });
    mockedNavigateToLearnMore.mockResolvedValue({ success: true });
    mockedNavigateToSupport.mockResolvedValue({ success: true });
  });

  // Use predefined unique strings to avoid collisions
  const buttonTexts = [
    'Start Now', 'Begin Process', 'Get Started', 'Continue', 'Proceed',
    'Learn More', 'Find Out', 'Discover', 'Explore', 'Read More',
    'Contact Us', 'Get Help', 'Support', 'Assistance', 'Help Center',
    'Submit', 'Apply', 'Register', 'Sign Up', 'Join Now',
    'Download', 'Access', 'View Details', 'See More', 'Check Status'
  ];

  const headlines = [
    'Welcome to Tax Preparation Service',
    'Streamline Your Tax Filing Process',
    'Professional Tax Assistance Available',
    'Simplify Your Annual Tax Returns',
    'Expert Tax Preparation Solutions'
  ];

  const subtitles = [
    'Our comprehensive tax preparation service helps you file accurately and efficiently every year',
    'Get professional assistance with all your tax filing needs from certified experts',
    'Streamline your tax preparation process with our user friendly online platform',
    'Professional tax services designed to maximize your refunds and minimize your stress',
    'Complete tax preparation solutions for individuals and businesses nationwide'
  ];

  test('Property 5: Navigation functionality - Hero CTA should trigger tax preparation navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          headline: fc.constantFrom(...headlines),
          subtitle: fc.constantFrom(...subtitles),
          ctaText: fc.constantFrom(...buttonTexts.slice(0, 5))
        }),
        async (props) => {
          const { unmount } = render(<Hero {...props} />);
          
          // Query by text content instead of accessible name
          const ctaButton = screen.getByText(props.ctaText);
          expect(ctaButton).toBeInTheDocument();
          
          fireEvent.click(ctaButton);
          
          // Wait for async navigation call
          await new Promise(resolve => setTimeout(resolve, 10));
          
          expect(mockedNavigateToTaxPreparation).toHaveBeenCalledTimes(1);
          
          // Clean up
          unmount();
          jest.clearAllMocks();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 5: Navigation functionality - CallToAction primary button should trigger tax preparation navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          primaryText: fc.constantFrom(...buttonTexts.slice(0, 8)),
          secondaryText: fc.constantFrom(...buttonTexts.slice(8, 16)),
          supportText: fc.constantFrom(...buttonTexts.slice(16, 24))
        }),
        async (props) => {
          const { unmount } = render(<CallToAction {...props} />);
          
          // Query by text content instead of accessible name
          const primaryButton = screen.getByText(props.primaryText);
          expect(primaryButton).toBeInTheDocument();
          
          fireEvent.click(primaryButton);
          
          // Wait for async navigation call
          await new Promise(resolve => setTimeout(resolve, 10));
          
          expect(mockedNavigateToTaxPreparation).toHaveBeenCalledTimes(1);
          
          // Clean up
          unmount();
          jest.clearAllMocks();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 5: Navigation functionality - CallToAction secondary button should trigger learn more navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          primaryText: fc.constantFrom(...buttonTexts.slice(0, 8)),
          secondaryText: fc.constantFrom(...buttonTexts.slice(8, 16)),
          supportText: fc.constantFrom(...buttonTexts.slice(16, 24))
        }),
        async (props) => {
          const { unmount } = render(<CallToAction {...props} />);
          
          // Query by text content instead of accessible name
          const secondaryButton = screen.getByText(props.secondaryText);
          expect(secondaryButton).toBeInTheDocument();
          
          fireEvent.click(secondaryButton);
          
          // Wait for async navigation call
          await new Promise(resolve => setTimeout(resolve, 10));
          
          expect(mockedNavigateToLearnMore).toHaveBeenCalledTimes(1);
          
          // Clean up
          unmount();
          jest.clearAllMocks();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 5: Navigation functionality - CallToAction support button should trigger support navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          primaryText: fc.constantFrom(...buttonTexts.slice(0, 8)),
          secondaryText: fc.constantFrom(...buttonTexts.slice(8, 16)),
          supportText: fc.constantFrom(...buttonTexts.slice(16, 24))
        }),
        async (props) => {
          const { unmount } = render(<CallToAction {...props} />);
          
          // Query by text content instead of accessible name
          const supportButton = screen.getByText(props.supportText);
          expect(supportButton).toBeInTheDocument();
          
          fireEvent.click(supportButton);
          
          // Wait for async navigation call
          await new Promise(resolve => setTimeout(resolve, 10));
          
          expect(mockedNavigateToSupport).toHaveBeenCalledTimes(1);
          
          // Clean up
          unmount();
          jest.clearAllMocks();
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 5: Navigation functionality - Custom handlers should override default navigation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          primaryText: fc.constantFrom(...buttonTexts.slice(0, 8)),
          secondaryText: fc.constantFrom(...buttonTexts.slice(8, 16)),
          supportText: fc.constantFrom(...buttonTexts.slice(16, 24))
        }),
        async (props) => {
          const customPrimaryAction = jest.fn();
          const customSecondaryAction = jest.fn();
          const customSupportAction = jest.fn();
          
          const { unmount } = render(
            <CallToAction 
              {...props}
              primaryAction={customPrimaryAction}
              secondaryAction={customSecondaryAction}
              supportAction={customSupportAction}
            />
          );
          
          // Query by text content instead of accessible name
          const primaryButton = screen.getByText(props.primaryText);
          const secondaryButton = screen.getByText(props.secondaryText);
          const supportButton = screen.getByText(props.supportText);
          
          fireEvent.click(primaryButton);
          fireEvent.click(secondaryButton);
          fireEvent.click(supportButton);
          
          // Wait for async calls
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // Custom handlers should be called instead of navigation functions
          expect(customPrimaryAction).toHaveBeenCalledTimes(1);
          expect(customSecondaryAction).toHaveBeenCalledTimes(1);
          expect(customSupportAction).toHaveBeenCalledTimes(1);
          
          // Navigation functions should not be called when custom handlers are provided
          expect(mockedNavigateToTaxPreparation).not.toHaveBeenCalled();
          expect(mockedNavigateToLearnMore).not.toHaveBeenCalled();
          expect(mockedNavigateToSupport).not.toHaveBeenCalled();
          
          // Clean up
          unmount();
          jest.clearAllMocks();
        }
      ),
      { numRuns: 10 }
    );
  });
});