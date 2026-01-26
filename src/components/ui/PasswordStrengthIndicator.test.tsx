import React from 'react';
import { render, screen } from '@testing-library/react';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { PasswordStrength } from '@/utils/passwordValidation';

describe('PasswordStrengthIndicator', () => {
  describe('Rendering for each strength level (Requirements 3.3)', () => {
    it('renders with weak strength', () => {
      render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      expect(screen.getByText(/Password strength: Weak/i)).toBeInTheDocument();
    });

    it('renders with fair strength', () => {
      render(<PasswordStrengthIndicator strength={PasswordStrength.FAIR} />);
      
      expect(screen.getByText(/Password strength: Fair/i)).toBeInTheDocument();
    });

    it('renders with good strength', () => {
      render(<PasswordStrengthIndicator strength={PasswordStrength.GOOD} />);
      
      expect(screen.getByText(/Password strength: Good/i)).toBeInTheDocument();
    });

    it('renders with strong strength', () => {
      render(<PasswordStrengthIndicator strength={PasswordStrength.STRONG} />);
      
      expect(screen.getByText(/Password strength: Strong/i)).toBeInTheDocument();
    });
  });

  describe('Color coding for each strength level (Requirements 3.3)', () => {
    it('displays red color for weak passwords', () => {
      const { container } = render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      const strengthBar = container.querySelector('.bg-red-500');
      expect(strengthBar).toBeInTheDocument();
      
      const label = screen.getByText(/Password strength: Weak/i);
      expect(label).toHaveClass('text-red-600');
    });

    it('displays orange color for fair passwords', () => {
      const { container } = render(<PasswordStrengthIndicator strength={PasswordStrength.FAIR} />);
      
      const strengthBar = container.querySelector('.bg-orange-500');
      expect(strengthBar).toBeInTheDocument();
      
      const label = screen.getByText(/Password strength: Fair/i);
      expect(label).toHaveClass('text-orange-600');
    });

    it('displays yellow color for good passwords', () => {
      const { container } = render(<PasswordStrengthIndicator strength={PasswordStrength.GOOD} />);
      
      const strengthBar = container.querySelector('.bg-yellow-500');
      expect(strengthBar).toBeInTheDocument();
      
      const label = screen.getByText(/Password strength: Good/i);
      expect(label).toHaveClass('text-yellow-600');
    });

    it('displays green color for strong passwords', () => {
      const { container } = render(<PasswordStrengthIndicator strength={PasswordStrength.STRONG} />);
      
      const strengthBar = container.querySelector('.bg-green-500');
      expect(strengthBar).toBeInTheDocument();
      
      const label = screen.getByText(/Password strength: Strong/i);
      expect(label).toHaveClass('text-green-600');
    });
  });

  describe('Width progression for each strength level (Requirements 3.3)', () => {
    it('displays 25% width for weak passwords', () => {
      const { container } = render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      const strengthBar = container.querySelector('.w-1\\/4');
      expect(strengthBar).toBeInTheDocument();
    });

    it('displays 50% width for fair passwords', () => {
      const { container } = render(<PasswordStrengthIndicator strength={PasswordStrength.FAIR} />);
      
      const strengthBar = container.querySelector('.w-2\\/4');
      expect(strengthBar).toBeInTheDocument();
    });

    it('displays 75% width for good passwords', () => {
      const { container } = render(<PasswordStrengthIndicator strength={PasswordStrength.GOOD} />);
      
      const strengthBar = container.querySelector('.w-3\\/4');
      expect(strengthBar).toBeInTheDocument();
    });

    it('displays 100% width for strong passwords', () => {
      const { container } = render(<PasswordStrengthIndicator strength={PasswordStrength.STRONG} />);
      
      const strengthBar = container.querySelector('.w-full');
      expect(strengthBar).toBeInTheDocument();
    });
  });

  describe('Accessibility attributes (Requirements 7.1)', () => {
    it('has role="status" for screen reader announcements', () => {
      render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toBeInTheDocument();
    });

    it('has aria-live="polite" for non-intrusive announcements', () => {
      render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('has descriptive aria-label for weak strength', () => {
      render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-label', 'Password strength: Weak');
    });

    it('has descriptive aria-label for fair strength', () => {
      render(<PasswordStrengthIndicator strength={PasswordStrength.FAIR} />);
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-label', 'Password strength: Fair');
    });

    it('has descriptive aria-label for good strength', () => {
      render(<PasswordStrengthIndicator strength={PasswordStrength.GOOD} />);
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-label', 'Password strength: Good');
    });

    it('has descriptive aria-label for strong strength', () => {
      render(<PasswordStrengthIndicator strength={PasswordStrength.STRONG} />);
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-label', 'Password strength: Strong');
    });

    it('strength bar is hidden from screen readers with aria-hidden', () => {
      const { container } = render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      const barContainer = container.querySelector('.bg-gray-200');
      expect(barContainer).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Dynamic updates', () => {
    it('updates when strength changes from weak to strong', () => {
      const { rerender } = render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      expect(screen.getByText(/Password strength: Weak/i)).toBeInTheDocument();
      
      rerender(<PasswordStrengthIndicator strength={PasswordStrength.STRONG} />);
      
      expect(screen.queryByText(/Password strength: Weak/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Password strength: Strong/i)).toBeInTheDocument();
    });

    it('updates color when strength changes', () => {
      const { container, rerender } = render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      let strengthBar = container.querySelector('.bg-red-500');
      expect(strengthBar).toBeInTheDocument();
      
      rerender(<PasswordStrengthIndicator strength={PasswordStrength.STRONG} />);
      
      strengthBar = container.querySelector('.bg-green-500');
      expect(strengthBar).toBeInTheDocument();
    });

    it('updates width when strength changes', () => {
      const { container, rerender } = render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      let strengthBar = container.querySelector('.w-1\\/4');
      expect(strengthBar).toBeInTheDocument();
      
      rerender(<PasswordStrengthIndicator strength={PasswordStrength.STRONG} />);
      
      strengthBar = container.querySelector('.w-full');
      expect(strengthBar).toBeInTheDocument();
    });

    it('updates aria-label when strength changes', () => {
      const { rerender } = render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      let statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-label', 'Password strength: Weak');
      
      rerender(<PasswordStrengthIndicator strength={PasswordStrength.FAIR} />);
      
      statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-label', 'Password strength: Fair');
    });
  });

  describe('Custom props', () => {
    it('accepts custom className', () => {
      const { container } = render(
        <PasswordStrengthIndicator 
          strength={PasswordStrength.WEAK} 
          className="custom-class" 
        />
      );
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveClass('custom-class');
    });

    it('maintains default classes with custom className', () => {
      const { container } = render(
        <PasswordStrengthIndicator 
          strength={PasswordStrength.WEAK} 
          className="custom-class" 
        />
      );
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveClass('w-full', 'mt-2', 'custom-class');
    });
  });

  describe('Visual structure', () => {
    it('renders strength bar container', () => {
      const { container } = render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      const barContainer = container.querySelector('.bg-gray-200');
      expect(barContainer).toBeInTheDocument();
      expect(barContainer).toHaveClass('h-2', 'rounded-full', 'overflow-hidden');
    });

    it('renders strength bar fill inside container', () => {
      const { container } = render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      const barContainer = container.querySelector('.bg-gray-200');
      const barFill = barContainer?.querySelector('.h-full');
      
      expect(barFill).toBeInTheDocument();
      expect(barFill).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    });

    it('renders label below the bar', () => {
      render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      const label = screen.getByText(/Password strength: Weak/i);
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass('text-xs', 'font-medium');
    });
  });

  describe('Transition effects', () => {
    it('has transition classes for smooth animations', () => {
      const { container } = render(<PasswordStrengthIndicator strength={PasswordStrength.WEAK} />);
      
      const strengthBar = container.querySelector('.h-full');
      expect(strengthBar).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    });
  });
});
