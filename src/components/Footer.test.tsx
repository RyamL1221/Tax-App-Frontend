import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from './Footer';

describe('Footer Component Unit Tests', () => {
  describe('Component Rendering', () => {
    test('renders with default props', () => {
      render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.getByText('Tax App')).toBeInTheDocument();
      expect(screen.getByText(/streamlining tax preparation/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /email support at support@taxapp.com/i })).toBeInTheDocument();
      
      // Check for current year in copyright
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear} Tax App`))).toBeInTheDocument();
    });

    test('renders with custom props', () => {
      const customProps = {
        companyName: 'Custom Tax Company',
        supportEmail: 'help@customtax.com',
        privacyPolicyUrl: '/custom-privacy'
      };

      render(<Footer {...customProps} />);
      
      expect(screen.getByText('Custom Tax Company')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /email support at help@customtax.com/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /read our privacy policy/i })).toHaveAttribute('href', '/custom-privacy');
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear} Custom Tax Company`))).toBeInTheDocument();
    });

    test('has proper semantic HTML structure', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveAttribute('aria-label', 'Site footer');
      
      // Check for proper heading hierarchy
      const companyHeading = screen.getByRole('heading', { level: 3, name: 'Tax App' });
      const quickLinksHeading = screen.getByRole('heading', { level: 4, name: 'Quick Links' });
      const legalHeading = screen.getByRole('heading', { level: 4, name: 'Legal & Security' });
      
      expect(companyHeading).toBeInTheDocument();
      expect(quickLinksHeading).toBeInTheDocument();
      expect(legalHeading).toBeInTheDocument();
    });

    test('has proper accessibility attributes for links', () => {
      render(<Footer />);
      
      const emailLink = screen.getByRole('link', { name: /email support/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:support@taxapp.com');
      
      const privacyLink = screen.getByRole('link', { name: /read our privacy policy/i });
      expect(privacyLink).toHaveAttribute('href', '/privacy');
      
      const featuresLink = screen.getByRole('link', { name: /learn about tax app features/i });
      expect(featuresLink).toHaveAttribute('href', '/features');
    });
  });

  describe('Navigation Links', () => {
    test('renders all quick links', () => {
      render(<Footer />);
      
      expect(screen.getByRole('link', { name: /learn about tax app features/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view tax app pricing plans/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /get help and support/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /contact tax app team/i })).toBeInTheDocument();
    });

    test('renders all legal and security links', () => {
      render(<Footer />);
      
      expect(screen.getByRole('link', { name: /read our privacy policy/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /read terms of service/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /learn about our security measures/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view compliance information/i })).toBeInTheDocument();
    });

    test('has correct href attributes for all links', () => {
      render(<Footer />);
      
      // Quick Links
      expect(screen.getByRole('link', { name: /features/i })).toHaveAttribute('href', '/features');
      expect(screen.getByRole('link', { name: /pricing/i })).toHaveAttribute('href', '/pricing');
      expect(screen.getByRole('link', { name: /support/i })).toHaveAttribute('href', '/support');
      expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '/contact');
      
      // Legal & Security
      expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy');
      expect(screen.getByRole('link', { name: /terms of service/i })).toHaveAttribute('href', '/terms');
      expect(screen.getByRole('link', { name: /security/i })).toHaveAttribute('href', '/security');
      expect(screen.getByRole('link', { name: /compliance/i })).toHaveAttribute('href', '/compliance');
    });

    test('has proper focus management for all links', () => {
      render(<Footer />);
      
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-white');
      });
    });
  });

  describe('Company Information Section', () => {
    test('displays company description', () => {
      render(<Footer />);
      
      expect(screen.getByText(/streamlining tax preparation with intelligent automation/i)).toBeInTheDocument();
      expect(screen.getByText(/making tax filing faster, more accurate/i)).toBeInTheDocument();
    });

    test('displays email contact with proper mailto link', () => {
      render(<Footer />);
      
      const emailLink = screen.getByRole('link', { name: /email support/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:support@taxapp.com');
      
      const emailIcon = emailLink.querySelector('svg');
      expect(emailIcon).toHaveAttribute('aria-hidden', 'true');
    });

    test('handles custom company information', () => {
      const customProps = {
        companyName: 'Advanced Tax Solutions',
        supportEmail: 'contact@advancedtax.com'
      };

      render(<Footer {...customProps} />);
      
      expect(screen.getByText('Advanced Tax Solutions')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /email support at contact@advancedtax.com/i })).toBeInTheDocument();
    });
  });

  describe('Bottom Section', () => {
    test('displays copyright with current year', () => {
      render(<Footer />);
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`© ${currentYear} Tax App. All rights reserved.`)).toBeInTheDocument();
    });

    test('displays security and compliance information', () => {
      render(<Footer />);
      
      expect(screen.getByText('Secured by 256-bit SSL encryption')).toBeInTheDocument();
      expect(screen.getByText('IRS Compliant')).toBeInTheDocument();
      
      const securityIcon = screen.getByRole('img', { name: /security verified icon/i });
      expect(securityIcon).toBeInTheDocument();
    });

    test('updates copyright year dynamically', () => {
      // Mock Date to test year calculation
      const mockDate = new Date('2025-06-15');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      render(<Footer />);
      
      expect(screen.getByText('© 2025 Tax App. All rights reserved.')).toBeInTheDocument();
      
      jest.restoreAllMocks();
    });
  });

  describe('Responsive Design', () => {
    test('has responsive grid layout', () => {
      render(<Footer />);
      
      const mainGrid = screen.getByRole('contentinfo').querySelector('.grid');
      expect(mainGrid).toHaveClass('grid-cols-1', 'md:grid-cols-4');
    });

    test('has responsive bottom section layout', () => {
      render(<Footer />);
      
      const bottomSection = screen.getByRole('contentinfo').querySelector('.border-t');
      const flexContainer = bottomSection?.querySelector('.flex');
      expect(flexContainer).toHaveClass('flex-col', 'md:flex-row');
    });

    test('maintains proper spacing and padding', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('py-12', 'px-4', 'sm:px-6', 'lg:px-8');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty string props', () => {
      render(<Footer companyName="" supportEmail="" privacyPolicyUrl="" />);
      
      // Should still render structure
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`© ${currentYear} . All rights reserved.`)).toBeInTheDocument();
    });

    test('handles very long company name', () => {
      const longCompanyName = 'Very Long Tax Preparation Company Name That Might Wrap Multiple Lines';
      render(<Footer companyName={longCompanyName} />);
      
      expect(screen.getByText(longCompanyName)).toBeInTheDocument();
    });

    test('handles special characters in props', () => {
      const specialProps = {
        companyName: 'Tax & Financial Services Co.',
        supportEmail: 'help+support@tax-company.com',
        privacyPolicyUrl: '/privacy?version=2.0'
      };

      render(<Footer {...specialProps} />);
      
      expect(screen.getByText('Tax & Financial Services Co.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /help\+support@tax-company\.com/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute('href', '/privacy?version=2.0');
    });

    test('handles invalid email format gracefully', () => {
      render(<Footer supportEmail="invalid-email" />);
      
      const emailLink = screen.getByRole('link', { name: /email support at invalid-email/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:invalid-email');
    });
  });

  describe('Accessibility Features', () => {
    test('has proper ARIA labels and roles', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveAttribute('aria-label', 'Site footer');
    });

    test('has proper color contrast classes', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('bg-gray-900', 'text-white');
      
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('text-gray-300', 'hover:text-white');
      });
    });

    test('has proper focus indicators', () => {
      render(<Footer />);
      
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('focus:ring-2', 'focus:ring-white', 'focus:ring-offset-2');
      });
    });

    test('has proper icon accessibility', () => {
      render(<Footer />);
      
      const emailIcon = screen.getByRole('link', { name: /email support/i }).querySelector('svg');
      expect(emailIcon).toHaveAttribute('aria-hidden', 'true');
      
      const securityIcon = screen.getByRole('img', { name: /security verified icon/i });
      expect(securityIcon).toBeInTheDocument();
    });
  });
});