import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HowItWorks from '../HowItWorks';
import { navigateToTaxPreparation, handleNavigationError } from '@/lib/navigation';

// Mock the navigation functions
jest.mock('@/lib/navigation', () => ({
  navigateToTaxPreparation: jest.fn(),
  handleNavigationError: jest.fn(),
}));

// Mock the useLoadingState hook
jest.mock('@/hooks/useLoadingState', () => ({
  useLoadingState: () => ({
    isLoading: false,
    executeAsync: jest.fn((fn) => fn()),
  }),
}));

const mockedNavigateToTaxPreparation = navigateToTaxPreparation as jest.MockedFunction<typeof navigateToTaxPreparation>;

describe('HowItWorks Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigateToTaxPreparation.mockResolvedValue({ success: true });
  });

  describe('Heading', () => {
    test('renders the heading with correct text', () => {
      render(<HowItWorks />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Complete your IRS forms in three simple steps');
    });
  });

  describe('Steps', () => {
    test('renders all 3 steps', () => {
      render(<HowItWorks />);

      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByText('Enter or upload your tax data')).toBeInTheDocument();
      expect(screen.getByText('Download completed IRS forms')).toBeInTheDocument();
    });

    test('renders steps in an ordered list', () => {
      render(<HowItWorks />);

      const list = screen.getByRole('list');
      expect(list.tagName).toBe('OL');
    });

    test('renders steps in the correct order', () => {
      render(<HowItWorks />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveTextContent('Create your account');
      expect(items[1]).toHaveTextContent('Enter or upload your tax data');
      expect(items[2]).toHaveTextContent('Download completed IRS forms');
    });
  });

  describe('CTA Button', () => {
    test('renders the CTA button', () => {
      render(<HowItWorks />);

      const button = screen.getByRole('button', { name: /get started/i });
      expect(button).toBeInTheDocument();
    });

    test('button has a descriptive accessible label', () => {
      render(<HowItWorks />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Get started — create your account');
    });

    test('calls navigateToTaxPreparation on click', async () => {
      render(<HowItWorks />);

      const button = screen.getByRole('button', { name: /get started/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockedNavigateToTaxPreparation).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility / Semantics', () => {
    test('wraps content in a section element', () => {
      render(<HowItWorks />);

      const section = screen.getByRole('region', { name: /complete your irs forms/i });
      expect(section).toBeInTheDocument();
    });

    test('section has aria-labelledby pointing to the heading id', () => {
      render(<HowItWorks />);

      const section = screen.getByRole('region', { name: /complete your irs forms/i });
      expect(section).toHaveAttribute('aria-labelledby', 'how-it-works-heading');

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveAttribute('id', 'how-it-works-heading');
    });

    test('step numbers are hidden from assistive technology', () => {
      const { container } = render(<HowItWorks />);

      const numberBadges = container.querySelectorAll('[aria-hidden="true"]');
      expect(numberBadges.length).toBeGreaterThanOrEqual(3);
    });
  });
});
