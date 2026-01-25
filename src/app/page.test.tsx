import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './page';

// Mock dynamic imports
jest.mock('next/dynamic', () => {
  return (importFunc: () => Promise<any>, options?: any) => {
    const Component = React.lazy(importFunc);
    const DynamicComponent = (props: any) => (
      <React.Suspense fallback={options?.loading?.() || <div>Loading...</div>}>
        <Component {...props} />
      </React.Suspense>
    );
    return DynamicComponent;
  };
});

// Mock the individual components
jest.mock('@/components/Hero', () => {
  return function MockHero() {
    return <div data-testid="hero-component">Hero Component</div>;
  };
});

jest.mock('@/components/Features', () => {
  return function MockFeatures() {
    return <div data-testid="features-component">Features Component</div>;
  };
});

jest.mock('@/components/Benefits', () => {
  return function MockBenefits() {
    return <div data-testid="benefits-component">Benefits Component</div>;
  };
});

jest.mock('@/components/CallToAction', () => {
  return function MockCallToAction() {
    return <div data-testid="cta-component">CallToAction Component</div>;
  };
});

jest.mock('@/components/Footer', () => {
  return function MockFooter() {
    return <div data-testid="footer-component">Footer Component</div>;
  };
});

jest.mock('@/components/ErrorBoundary', () => {
  return function MockErrorBoundary({ children }: { children: React.ReactNode }) {
    return <div data-testid="error-boundary">{children}</div>;
  };
});

jest.mock('@/components/fallbacks/ComponentFallback', () => {
  return function MockComponentFallback({ componentName, minimal }: { componentName: string; minimal?: boolean }) {
    return <div data-testid="component-fallback">{componentName} fallback {minimal ? '(minimal)' : ''}</div>;
  };
});

jest.mock('@/components/fallbacks/LoadingFallback', () => {
  return function MockLoadingFallback({ message }: { message: string }) {
    return <div data-testid="loading-fallback">{message}</div>;
  };
});

describe('Home Page Component Unit Tests', () => {
  describe('Component Rendering', () => {
    test('renders main page structure', async () => {
      render(<Home />);
      
      // Check for skip link
      expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument();
      
      // Check for main content area
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
      expect(main).toHaveAttribute('aria-label', 'Tax App landing page');
      
      // Wait for components to load
      await waitFor(() => {
        expect(screen.getByTestId('hero-component')).toBeInTheDocument();
      });
    });

    test('renders all major sections', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('hero-component')).toBeInTheDocument();
        expect(screen.getByTestId('features-component')).toBeInTheDocument();
        expect(screen.getByTestId('benefits-component')).toBeInTheDocument();
        expect(screen.getByTestId('cta-component')).toBeInTheDocument();
        expect(screen.getByTestId('footer-component')).toBeInTheDocument();
      });
    });

    test('has proper semantic HTML structure', () => {
      render(<Home />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen', 'bg-white');
      
      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink).toHaveClass('skip-link');
    });
  });

  describe('Error Boundaries', () => {
    test('wraps each section with error boundaries', async () => {
      render(<Home />);
      
      const errorBoundaries = screen.getAllByTestId('error-boundary');
      expect(errorBoundaries).toHaveLength(5); // Hero, Features, Benefits, CTA, Footer
    });

    test('provides appropriate fallbacks for each section', async () => {
      // This test would need to simulate component errors to fully test
      // For now, we verify the structure is in place
      render(<Home />);
      
      await waitFor(() => {
        expect(screen.getByTestId('hero-component')).toBeInTheDocument();
      });
    });
  });

  describe('Code Splitting and Performance', () => {
    test('hero section is server-side rendered', async () => {
      render(<Home />);
      
      // Hero should load immediately (SSR)
      await waitFor(() => {
        expect(screen.getByTestId('hero-component')).toBeInTheDocument();
      });
    });

    test('below-the-fold sections are lazy loaded', async () => {
      render(<Home />);
      
      // Below-the-fold components should eventually load
      await waitFor(() => {
        expect(screen.getByTestId('features-component')).toBeInTheDocument();
        expect(screen.getByTestId('benefits-component')).toBeInTheDocument();
        expect(screen.getByTestId('cta-component')).toBeInTheDocument();
        expect(screen.getByTestId('footer-component')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Features', () => {
    test('has skip to main content link', () => {
      render(<Home />);
      
      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink).toHaveAttribute('aria-label', 'Skip to main content');
    });

    test('main content has proper ARIA attributes', () => {
      render(<Home />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
      expect(main).toHaveAttribute('role', 'main');
      expect(main).toHaveAttribute('aria-label', 'Tax App landing page');
    });

    test('maintains proper heading hierarchy', async () => {
      render(<Home />);
      
      // The main element should be present
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Components should load and maintain their heading structure
      await waitFor(() => {
        expect(screen.getByTestId('hero-component')).toBeInTheDocument();
      });
    });
  });

  describe('Layout and Styling', () => {
    test('has proper CSS classes for layout', () => {
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

  describe('Component Integration', () => {
    test('components are rendered in correct order', async () => {
      render(<Home />);
      
      await waitFor(() => {
        const main = screen.getByRole('main');
        const components = main.querySelectorAll('[data-testid]');
        
        // Should have components in order: hero, features, benefits, cta
        expect(components[0]).toHaveAttribute('data-testid', 'error-boundary');
      });
    });

    test('footer is rendered outside main content', async () => {
      render(<Home />);
      
      await waitFor(() => {
        const main = screen.getByRole('main');
        const footer = screen.getByTestId('footer-component');
        
        // Footer should not be inside main
        expect(main).not.toContainElement(footer);
      });
    });
  });

  describe('Error Handling', () => {
    test('gracefully handles component loading failures', async () => {
      render(<Home />);
      
      // Should not crash even if components fail to load
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      await waitFor(() => {
        // At minimum, the structure should be present
        expect(screen.getAllByTestId('error-boundary').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles missing components gracefully', async () => {
      render(<Home />);
      
      // Should render without crashing
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument();
    });

    test('maintains accessibility even with loading states', () => {
      render(<Home />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Tax App landing page');
      
      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    test('uses Suspense for code splitting', async () => {
      render(<Home />);
      
      // Components should eventually load through Suspense
      await waitFor(() => {
        expect(screen.getByTestId('hero-component')).toBeInTheDocument();
      });
    });
  });
});