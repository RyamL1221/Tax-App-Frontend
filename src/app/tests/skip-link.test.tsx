/**
 * Tests for Skip Link Accessibility Feature
 *
 * Validates that the skip link on the landing page is properly implemented
 * for keyboard navigation and accessibility compliance.
 *
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => {
  return function mockDynamic(importFn: () => Promise<{ default: React.ComponentType }>) {
    // Return a simple mock component
    return function MockComponent() {
      return <div data-testid="mock-dynamic-component">Mock Component</div>;
    };
  };
});

// Mock the ErrorBoundary component
jest.mock('@/components/ErrorBoundary', () => {
  return function MockErrorBoundary({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

// Mock the fallback components
jest.mock('@/components/fallbacks/ComponentFallback', () => {
  return function MockComponentFallback() {
    return <div>Component Fallback</div>;
  };
});

jest.mock('@/components/fallbacks/LoadingFallback', () => {
  return function MockLoadingFallback() {
    return <div>Loading...</div>;
  };
});

// Import the page component after mocks are set up
import Home from '../page';

describe('Skip Link Accessibility', () => {
  describe('Skip Link Element', () => {
    /**
     * Test that skip link renders with correct class
     * **Validates: Requirements 4.1, 4.2**
     */
    it('should render skip link with correct "skip-link" class', () => {
      render(<Home />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('skip-link');
    });

    /**
     * Test that skip link has correct href attribute
     * **Validates: Requirements 4.1**
     */
    it('should have correct href="#main-content"', () => {
      render(<Home />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    /**
     * Test that skip link has accessible text
     * **Validates: Requirements 4.3**
     */
    it('should have accessible text "Skip to main content"', () => {
      render(<Home />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink.textContent).toBe('Skip to main content');
    });

    /**
     * Test that skip link has aria-label for screen readers
     * **Validates: Requirements 4.3**
     */
    it('should have aria-label="Skip to main content"', () => {
      render(<Home />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('aria-label', 'Skip to main content');
    });

    /**
     * Test that skip link is an anchor element
     * **Validates: Requirements 4.1**
     */
    it('should be an anchor element', () => {
      render(<Home />);

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink.tagName).toBe('A');
    });
  });

  describe('Main Content Target', () => {
    /**
     * Test that main content target element exists with correct id
     * **Validates: Requirements 4.1, 4.2**
     */
    it('should have main content element with id="main-content"', () => {
      render(<Home />);

      const mainContent = document.getElementById('main-content');
      expect(mainContent).toBeInTheDocument();
    });

    /**
     * Test that main content element is a main element
     * **Validates: Requirements 4.2**
     */
    it('should have main element as the target', () => {
      render(<Home />);

      const mainContent = document.getElementById('main-content');
      expect(mainContent?.tagName).toBe('MAIN');
    });

    /**
     * Test that main content has proper role attribute
     * **Validates: Requirements 4.2**
     */
    it('should have role="main" on the main content element', () => {
      render(<Home />);

      const mainContent = document.getElementById('main-content');
      expect(mainContent).toHaveAttribute('role', 'main');
    });

    /**
     * Test that main content has aria-label for accessibility
     * **Validates: Requirements 4.3**
     */
    it('should have aria-label on the main content element', () => {
      render(<Home />);

      const mainContent = document.getElementById('main-content');
      expect(mainContent).toHaveAttribute('aria-label', 'Tax App landing page');
    });
  });

  describe('Skip Link and Target Relationship', () => {
    /**
     * Test that skip link href matches main content id
     * **Validates: Requirements 4.1, 4.2**
     */
    it('should have skip link href matching main content id', () => {
      render(<Home />);

      const skipLink = screen.getByText('Skip to main content');
      const mainContent = document.getElementById('main-content');

      const hrefValue = skipLink.getAttribute('href');
      const targetId = mainContent?.getAttribute('id');

      expect(hrefValue).toBe(`#${targetId}`);
    });
  });
});
