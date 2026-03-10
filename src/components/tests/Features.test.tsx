import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Features from '../Features';

describe('Features Component Unit Tests', () => {
  const mockFeatures = [
    {
      title: 'Test Feature 1',
      description: 'This is a test feature description',
      icon: <div data-testid="test-icon-1">Icon 1</div>
    },
    {
      title: 'Test Feature 2',
      description: 'This is another test feature description',
      icon: <div data-testid="test-icon-2">Icon 2</div>
    }
  ];

  describe('Component Rendering', () => {
    test('renders with default features', () => {
      render(<Features />);
      
      expect(screen.getByRole('heading', { level: 2, name: /key features/i })).toBeInTheDocument();
      expect(screen.getByText(/discover how tax app streamlines/i)).toBeInTheDocument();
      
      // Check for default features
      expect(screen.getByText('Automated Form Filling')).toBeInTheDocument();
      expect(screen.getByText('Smart Data Collection')).toBeInTheDocument();
      expect(screen.getByText('Error Prevention')).toBeInTheDocument();
      expect(screen.getByText('Multiple Form Support')).toBeInTheDocument();
    });

    test('renders with custom features', () => {
      render(<Features features={mockFeatures} />);
      
      expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Test Feature 2')).toBeInTheDocument();
      expect(screen.getByText('This is a test feature description')).toBeInTheDocument();
      expect(screen.getByText('This is another test feature description')).toBeInTheDocument();
      expect(screen.getByTestId('test-icon-1')).toBeInTheDocument();
      expect(screen.getByTestId('test-icon-2')).toBeInTheDocument();
    });

    test('has proper semantic HTML structure', () => {
      render(<Features />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-labelledby', 'features-heading');
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveAttribute('id', 'features-heading');
      
      const featuresList = screen.getByRole('list', { name: /tax app key features/i });
      expect(featuresList).toBeInTheDocument();
      
      const featureItems = screen.getAllByRole('listitem');
      expect(featureItems).toHaveLength(4); // Default features count
    });

    test('has proper accessibility attributes', () => {
      render(<Features />);
      
      const featureCards = screen.getAllByRole('listitem');
      featureCards.forEach((card, index) => {
        expect(card).toHaveAttribute('aria-labelledby', `feature-title-${index}`);
      });
      
      const featureHeadings = screen.getAllByRole('heading', { level: 3 });
      featureHeadings.forEach((heading, index) => {
        expect(heading).toHaveAttribute('id', `feature-title-${index}`);
      });
    });
  });

  describe('Feature Cards', () => {
    test('renders feature cards with proper structure', () => {
      render(<Features features={mockFeatures} />);
      
      const featureCards = screen.getAllByRole('listitem');
      expect(featureCards).toHaveLength(2);
      
      featureCards.forEach((card) => {
        expect(card).toHaveClass('h-full'); // Full height for consistent layout
      });
    });

    test('displays feature icons with accessibility attributes', () => {
      render(<Features />);
      
      // Icons are decorative and hidden from screen readers (aria-hidden="true")
      // but they still have role="img" and aria-label for the SVG elements themselves
      const container = screen.getByRole('region', { name: /key features/i });
      const svgs = container.querySelectorAll('svg[role="img"]');
      
      expect(svgs.length).toBeGreaterThan(0);
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-label');
        expect(svg.getAttribute('aria-label')).toContain('icon');
      });
    });

    test('handles features with missing properties gracefully', () => {
      const incompleteFeatures = [
        {
          title: 'Complete Feature',
          description: 'This feature has all properties',
          icon: <div data-testid="complete-icon">Complete</div>
        },
        {
          title: 'Incomplete Feature',
          description: '',
          icon: null
        }
      ];

      render(<Features features={incompleteFeatures} />);
      
      expect(screen.getByText('Complete Feature')).toBeInTheDocument();
      expect(screen.getByText('Incomplete Feature')).toBeInTheDocument();
      expect(screen.getByTestId('complete-icon')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('has responsive grid classes', () => {
      render(<Features />);
      
      const grid = screen.getByRole('list');
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });

    test('maintains proper spacing and layout', () => {
      render(<Features />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveClass('py-16', 'sm:py-24');
      
      const container = section.querySelector('.max-w-7xl');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty features array', () => {
      render(<Features features={[]} />);
      
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
      
      const featureItems = screen.queryAllByRole('listitem');
      expect(featureItems).toHaveLength(0);
    });

    test('handles single feature', () => {
      const singleFeature = [mockFeatures[0]];
      render(<Features features={singleFeature} />);
      
      const featureItems = screen.getAllByRole('listitem');
      expect(featureItems).toHaveLength(1);
      expect(screen.getByText('Test Feature 1')).toBeInTheDocument();
    });

    test('handles large number of features', () => {
      const manyFeatures = Array.from({ length: 10 }, (_, i) => ({
        title: `Feature ${i + 1}`,
        description: `Description for feature ${i + 1}`,
        icon: <div data-testid={`icon-${i + 1}`}>Icon {i + 1}</div>
      }));

      render(<Features features={manyFeatures} />);
      
      const featureItems = screen.getAllByRole('listitem');
      expect(featureItems).toHaveLength(10);
      
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 10')).toBeInTheDocument();
    });

    test('handles very long feature text', () => {
      const longTextFeatures = [
        {
          title: 'A'.repeat(100),
          description: 'B'.repeat(500),
          icon: <div data-testid="long-text-icon">Icon</div>
        }
      ];

      render(<Features features={longTextFeatures} />);
      
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
      expect(screen.getByText('B'.repeat(500))).toBeInTheDocument();
    });

    test('handles special characters in feature content', () => {
      const specialCharFeatures = [
        {
          title: 'Feature with & Special Characters!',
          description: 'Description with "quotes" and \'apostrophes\' - plus dashes.',
          icon: <div data-testid="special-char-icon">🔧</div>
        }
      ];

      render(<Features features={specialCharFeatures} />);
      
      expect(screen.getByText('Feature with & Special Characters!')).toBeInTheDocument();
      expect(screen.getByText('Description with "quotes" and \'apostrophes\' - plus dashes.')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('integrates properly with Card components', () => {
      render(<Features features={mockFeatures} />);
      
      const cards = screen.getAllByRole('listitem');
      cards.forEach((card) => {
        // Check that cards have proper styling classes
        expect(card).toHaveClass('h-full');
        
        // Check that cards contain header and content sections
        const cardHeader = card.querySelector('div:first-child');
        const cardContent = card.querySelector('div:nth-child(2)');
        expect(cardHeader).toBeInTheDocument();
        expect(cardContent).toBeInTheDocument();
      });
    });

    test('maintains consistent styling across all feature cards', () => {
      render(<Features />);
      
      const featureCards = screen.getAllByRole('listitem');
      featureCards.forEach((card) => {
        expect(card).toHaveClass('h-full');
        
        const heading = card.querySelector('h3');
        expect(heading).toHaveClass('text-xl', 'font-semibold', 'text-gray-900');
        
        const description = card.querySelector('p');
        expect(description).toHaveClass('text-gray-600', 'text-center');
      });
    });
  });
});