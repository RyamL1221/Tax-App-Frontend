import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Benefits from '../Benefits';

describe('Benefits Component Unit Tests', () => {
  const mockBenefits = [
    {
      title: 'Test Benefit 1',
      description: 'This is a test benefit description',
      metric: '95%'
    },
    {
      title: 'Test Benefit 2',
      description: 'This is another test benefit description'
      // No metric for this one
    }
  ];

  describe('Component Rendering', () => {
    test('renders with default benefits', () => {
      render(<Benefits />);
      
      expect(screen.getByRole('heading', { level: 2, name: /why choose tax app/i })).toBeInTheDocument();
      expect(screen.getByText(/experience the advantages/i)).toBeInTheDocument();
      
      // Check for default benefits
      expect(screen.getByText('Save Time')).toBeInTheDocument();
      expect(screen.getByText('Improve Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive Form Support')).toBeInTheDocument();
      expect(screen.getByText('Secure & Compliant')).toBeInTheDocument();
      
      // Check for default metrics
      expect(screen.getByText('90% faster')).toBeInTheDocument();
      expect(screen.getByText('99.9% accuracy')).toBeInTheDocument();
      expect(screen.getByText('50+ forms')).toBeInTheDocument();
      expect(screen.getByText('256-bit SSL')).toBeInTheDocument();
    });

    test('renders with custom benefits', () => {
      render(<Benefits benefits={mockBenefits} />);
      
      expect(screen.getByText('Test Benefit 1')).toBeInTheDocument();
      expect(screen.getByText('Test Benefit 2')).toBeInTheDocument();
      expect(screen.getByText('This is a test benefit description')).toBeInTheDocument();
      expect(screen.getByText('This is another test benefit description')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });

    test('has proper semantic HTML structure', () => {
      render(<Benefits />);
      
      const sections = screen.getAllByRole('region');
      const mainSection = sections[0]; // First region is the main benefits section
      expect(mainSection).toHaveAttribute('aria-labelledby', 'benefits-heading');
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveAttribute('id', 'benefits-heading');
      
      const benefitsList = screen.getByRole('list', { name: /tax app benefits/i });
      expect(benefitsList).toBeInTheDocument();
      
      const benefitItems = screen.getAllByRole('listitem');
      expect(benefitItems.length).toBeGreaterThan(0);
    });

    test('has proper accessibility attributes', () => {
      render(<Benefits />);
      
      // Get only the benefit cards from the benefits list
      const benefitsList = screen.getByRole('list', { name: /tax app benefits/i });
      const benefitCards = within(benefitsList).getAllByRole('listitem');
      benefitCards.forEach((card, index) => {
        expect(card).toHaveAttribute('aria-labelledby', `benefit-title-${index}`);
      });
      
      // Check that benefit headings have proper IDs (only check the first 4 which are benefit cards)
      const allHeadings = screen.getAllByRole('heading', { level: 3 });
      const benefitHeadings = allHeadings.slice(0, 4); // First 4 are benefit cards
      benefitHeadings.forEach((heading, index) => {
        expect(heading).toHaveAttribute('id', `benefit-title-${index}`);
      });
    });
  });

  describe('Benefit Cards', () => {
    test('renders benefit cards with metrics', () => {
      render(<Benefits benefits={mockBenefits} />);
      
      const metricElement = screen.getByText('95%');
      expect(metricElement).toHaveAttribute('aria-label', 'Metric: 95%');
      expect(metricElement).toHaveClass('text-3xl', 'font-bold', 'text-blue-600');
    });

    test('renders benefit cards without metrics', () => {
      const benefitsWithoutMetrics = [
        {
          title: 'No Metric Benefit',
          description: 'This benefit has no metric'
        }
      ];

      render(<Benefits benefits={benefitsWithoutMetrics} />);
      
      expect(screen.getByText('No Metric Benefit')).toBeInTheDocument();
      expect(screen.getByText('This benefit has no metric')).toBeInTheDocument();
      
      // Should not have metric display
      const benefitsList = screen.getByRole('list', { name: /tax app benefits/i });
      const cards = within(benefitsList).getAllByRole('listitem');
      const metricDiv = cards[0].querySelector('.text-3xl.font-bold.text-blue-600');
      expect(metricDiv).not.toBeInTheDocument();
    });

    test('handles benefits with empty metrics', () => {
      const benefitsWithEmptyMetrics = [
        {
          title: 'Empty Metric Benefit',
          description: 'This benefit has empty metric',
          metric: ''
        }
      ];

      render(<Benefits benefits={benefitsWithEmptyMetrics} />);
      
      expect(screen.getByText('Empty Metric Benefit')).toBeInTheDocument();
      
      // Should not display empty metric - query all and check the first one
      const cards = screen.getAllByRole('listitem');
      const metricDiv = cards[0].querySelector('.text-3xl.font-bold.text-blue-600');
      expect(metricDiv).not.toBeInTheDocument();
    });
  });

  describe('Comparison Section', () => {
    test('renders traditional vs tax app comparison', () => {
      render(<Benefits />);
      
      expect(screen.getByRole('heading', { level: 3, name: /traditional vs\. tax app/i })).toBeInTheDocument();
      
      const traditionalSection = screen.getByRole('region', { name: /traditional methods/i });
      const taxAppSection = screen.getByRole('region', { name: /tax app advantages/i });
      
      expect(traditionalSection).toBeInTheDocument();
      expect(taxAppSection).toBeInTheDocument();
      
      // Check for traditional method disadvantages
      expect(screen.getByText(/hours of manual form completion/i)).toBeInTheDocument();
      expect(screen.getByText(/high risk of calculation errors/i)).toBeInTheDocument();
      
      // Check for Tax App advantages
      expect(screen.getByText(/automated form completion in minutes/i)).toBeInTheDocument();
      expect(screen.getByText(/built-in error prevention/i)).toBeInTheDocument();
    });

    test('has proper accessibility for comparison section', () => {
      render(<Benefits />);
      
      const comparisonSection = screen.getByRole('complementary');
      expect(comparisonSection).toHaveAttribute('aria-labelledby', 'comparison-heading');
      
      const traditionalHeading = screen.getByRole('heading', { level: 4, name: /traditional methods/i });
      const taxAppHeading = screen.getByRole('heading', { level: 4, name: /tax app advantages/i });
      
      expect(traditionalHeading).toHaveAttribute('id', 'traditional-methods');
      expect(taxAppHeading).toHaveAttribute('id', 'tax-app-advantages');
      
      // Check for proper icon accessibility
      const warningIcon = screen.getByRole('img', { name: /warning icon for traditional methods/i });
      const successIcon = screen.getByRole('img', { name: /success icon for tax app advantages/i });
      
      expect(warningIcon).toBeInTheDocument();
      expect(successIcon).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('has responsive grid classes', () => {
      render(<Benefits />);
      
      const grid = screen.getByRole('list', { name: /tax app benefits/i });
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });

    test('has responsive comparison grid', () => {
      render(<Benefits />);
      
      const comparisonGrid = screen.getByRole('complementary').querySelector('.grid');
      expect(comparisonGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });

    test('maintains proper spacing and layout', () => {
      render(<Benefits />);
      
      const sections = screen.getAllByRole('region');
      const section = sections.find(s => s.getAttribute('aria-labelledby') === 'benefits-heading');
      expect(section).toHaveClass('py-16', 'sm:py-24', 'bg-gray-50');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty benefits array', () => {
      render(<Benefits benefits={[]} />);
      
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /tax app benefits/i })).toBeInTheDocument();
      
      const benefitItems = screen.queryAllByRole('listitem');
      // Should have items from comparison section but no benefit cards
      expect(benefitItems.length).toBeGreaterThan(0); // Comparison section has list items
    });

    test('handles single benefit', () => {
      const singleBenefit = [mockBenefits[0]];
      render(<Benefits benefits={singleBenefit} />);
      
      // Get only the benefit cards, not all list items (which includes comparison section)
      const benefitCards = screen.getAllByRole('listitem').filter(item => 
        item.getAttribute('aria-labelledby')?.startsWith('benefit-title-')
      );
      expect(benefitCards).toHaveLength(1);
      expect(screen.getByText('Test Benefit 1')).toBeInTheDocument();
    });

    test('handles benefits with very long text', () => {
      const longTextBenefits = [
        {
          title: 'A'.repeat(100),
          description: 'B'.repeat(500),
          metric: 'C'.repeat(20)
        }
      ];

      render(<Benefits benefits={longTextBenefits} />);
      
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
      expect(screen.getByText('B'.repeat(500))).toBeInTheDocument();
      expect(screen.getByText('C'.repeat(20))).toBeInTheDocument();
    });

    test('handles special characters in benefit content', () => {
      const specialCharBenefits = [
        {
          title: 'Benefit with & Special Characters!',
          description: 'Description with "quotes" and \'apostrophes\' - plus dashes.',
          metric: '100% & More!'
        }
      ];

      render(<Benefits benefits={specialCharBenefits} />);
      
      expect(screen.getByText('Benefit with & Special Characters!')).toBeInTheDocument();
      expect(screen.getByText('Description with "quotes" and \'apostrophes\' - plus dashes.')).toBeInTheDocument();
      expect(screen.getByText('100% & More!')).toBeInTheDocument();
    });

    test('handles numeric and non-numeric metrics', () => {
      const mixedMetricBenefits = [
        {
          title: 'Numeric Metric',
          description: 'Has numeric metric',
          metric: '99.9%'
        },
        {
          title: 'Text Metric',
          description: 'Has text metric',
          metric: 'Unlimited'
        },
        {
          title: 'Symbol Metric',
          description: 'Has symbol metric',
          metric: '★★★★★'
        }
      ];

      render(<Benefits benefits={mixedMetricBenefits} />);
      
      expect(screen.getByText('99.9%')).toBeInTheDocument();
      expect(screen.getByText('Unlimited')).toBeInTheDocument();
      expect(screen.getByText('★★★★★')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('integrates properly with Card components', () => {
      render(<Benefits benefits={mockBenefits} />);
      
      // Get only the benefit cards, not all list items
      const cards = screen.getAllByRole('listitem').filter(item => 
        item.getAttribute('aria-labelledby')?.startsWith('benefit-title-')
      );
      cards.forEach((card) => {
        expect(card).toHaveClass('h-full', 'text-center');
      });
    });

    test('maintains consistent styling across all benefit cards', () => {
      render(<Benefits />);
      
      // Get only the benefit cards, not all list items
      const benefitCards = screen.getAllByRole('listitem').filter(item => 
        item.getAttribute('aria-labelledby')?.startsWith('benefit-title-')
      );
      benefitCards.forEach((card) => {
        const heading = card.querySelector('h3');
        expect(heading).toHaveClass('text-xl', 'font-semibold', 'text-gray-900');
        
        const description = card.querySelector('p');
        expect(description).toHaveClass('text-gray-600');
      });
    });
  });
});