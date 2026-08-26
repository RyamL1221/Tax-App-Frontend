import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../page';

// Mock the section components
jest.mock('@/components/HowItWorks', () => {
  return function MockHowItWorks() {
    return (
      <section aria-labelledby="how-it-works-heading" data-testid="how-it-works">
        <h2 id="how-it-works-heading">Complete your IRS forms in three simple steps</h2>
      </section>
    );
  };
});

jest.mock('@/components/Security', () => {
  return function MockSecurity() {
    return (
      <section aria-labelledby="security-heading" data-testid="security">
        <h2 id="security-heading">Your Data is Secure</h2>
      </section>
    );
  };
});

describe('Home Page', () => {
  describe('Component Rendering', () => {
    test('renders main page structure', () => {
      render(<Home />);

      expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('renders HowItWorks section', () => {
      render(<Home />);

      expect(screen.getByTestId('how-it-works')).toBeInTheDocument();
    });

    test('renders Security section', () => {
      render(<Home />);

      expect(screen.getByTestId('security')).toBeInTheDocument();
    });

    test('renders sections in correct order (HowItWorks then Security)', () => {
      render(<Home />);

      const main = screen.getByRole('main');
      const sections = main.querySelectorAll('[data-testid]');

      expect(sections[0]).toHaveAttribute('data-testid', 'how-it-works');
      expect(sections[1]).toHaveAttribute('data-testid', 'security');
    });
  });

  describe('Old sections are removed', () => {
    test('does not render Hero', () => {
      render(<Home />);

      expect(screen.queryByTestId('hero-component')).not.toBeInTheDocument();
      expect(screen.queryByText('Hero Component')).not.toBeInTheDocument();
    });

    test('does not render Features', () => {
      render(<Home />);

      expect(screen.queryByTestId('features-component')).not.toBeInTheDocument();
    });

    test('does not render Benefits', () => {
      render(<Home />);

      expect(screen.queryByTestId('benefits-component')).not.toBeInTheDocument();
    });

    test('does not render CallToAction', () => {
      render(<Home />);

      expect(screen.queryByTestId('cta-component')).not.toBeInTheDocument();
    });

    test('does not render Footer', () => {
      render(<Home />);

      expect(screen.queryByTestId('footer-component')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has skip to main content link', () => {
      render(<Home />);

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink).toHaveAttribute('aria-label', 'Skip to main content');
      expect(skipLink).toHaveClass('skip-link');
    });

    test('main content has proper ARIA attributes', () => {
      render(<Home />);

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
      expect(main).toHaveAttribute('role', 'main');
      expect(main).toHaveAttribute('aria-label', 'Tax App landing page');
    });
  });

  describe('Layout and Styling', () => {
    test('main element has proper CSS classes', () => {
      render(<Home />);

      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen', 'bg-white');
    });

    test('skip link has proper styling class', () => {
      render(<Home />);

      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toHaveClass('skip-link');
    });
  });
});
