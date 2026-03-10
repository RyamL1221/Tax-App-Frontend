import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailInput } from '../EmailInput';

describe('EmailInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders with default label', () => {
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(<EmailInput value="" onChange={mockOnChange} label="Your Email" />);
      
      expect(screen.getByLabelText('Your Email')).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      render(<EmailInput value="test@example.com" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address') as HTMLInputElement;
      expect(input.value).toBe('test@example.com');
    });

    it('renders as email input type', () => {
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  describe('User Interaction', () => {
    it('calls onChange when user types', async () => {
      const user = userEvent.setup();
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address');
      await user.type(input, 'test');
      
      // Should be called for each character typed
      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenCalledTimes(4); // 't', 'e', 's', 't'
    });

    it('updates value when controlled', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address') as HTMLInputElement;
      
      // Simulate controlled component update
      rerender(<EmailInput value="new@example.com" onChange={mockOnChange} />);
      
      expect(input.value).toBe('new@example.com');
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(<EmailInput value="" onChange={mockOnChange} disabled />);
      
      const input = screen.getByLabelText('Email Address');
      await user.type(input, 'test');
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Error Display', () => {
    it('displays error message when error prop is provided', () => {
      render(
        <EmailInput 
          value="" 
          onChange={mockOnChange} 
          error="Please enter a valid email address" 
        />
      );
      
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('does not display error when error prop is undefined', () => {
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('displays error icon when error is present', () => {
      render(
        <EmailInput 
          value="" 
          onChange={mockOnChange} 
          error="Invalid email" 
        />
      );
      
      const errorContainer = screen.getByRole('alert');
      const icon = errorContainer.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('updates error message when error prop changes', () => {
      const { rerender } = render(
        <EmailInput 
          value="" 
          onChange={mockOnChange} 
          error="First error" 
        />
      );
      
      expect(screen.getByText('First error')).toBeInTheDocument();
      
      rerender(
        <EmailInput 
          value="" 
          onChange={mockOnChange} 
          error="Second error" 
        />
      );
      
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Second error')).toBeInTheDocument();
    });

    it('removes error message when error is cleared', () => {
      const { rerender } = render(
        <EmailInput 
          value="" 
          onChange={mockOnChange} 
          error="Invalid email" 
        />
      );
      
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      
      rerender(<EmailInput value="" onChange={mockOnChange} />);
      
      expect(screen.queryByText('Invalid email')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility (Requirements 5.1, 6.1, 6.2)', () => {
    it('has proper ARIA label', () => {
      render(<EmailInput value="" onChange={mockOnChange} label="Email" />);
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-label', 'Email');
    });

    it('has aria-required attribute', () => {
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('has aria-invalid when error is present', () => {
      render(
        <EmailInput 
          value="" 
          onChange={mockOnChange} 
          error="Invalid email" 
        />
      );
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not have aria-invalid when no error', () => {
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('associates error message with input via aria-describedby', () => {
      render(
        <EmailInput 
          value="" 
          onChange={mockOnChange} 
          error="Invalid email"
          id="test-email"
        />
      );
      
      const input = screen.getByLabelText('Email Address');
      const errorId = input.getAttribute('aria-describedby');
      
      expect(errorId).toBe('test-email-error');
      
      // The error container (div with role="alert") should have the id
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('id', errorId);
    });

    it('error message has role="alert" for screen readers', () => {
      render(
        <EmailInput 
          value="" 
          onChange={mockOnChange} 
          error="Invalid email" 
        />
      );
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
    });

    it('error message has aria-live="polite" for announcements', () => {
      render(
        <EmailInput 
          value="" 
          onChange={mockOnChange} 
          error="Invalid email" 
        />
      );
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    it('has autocomplete attribute for email', () => {
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('autocomplete', 'email');
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address');
      
      // Tab to focus
      await user.tab();
      expect(input).toHaveFocus();
      
      // Type with keyboard
      await user.keyboard('test@example.com');
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<EmailInput value="" onChange={mockOnChange} disabled />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toBeDisabled();
    });

    it('applies disabled styling', () => {
      render(<EmailInput value="" onChange={mockOnChange} disabled />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveClass('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
    });
  });

  describe('Responsive Design (Requirements 6.1, 6.2)', () => {
    it('has mobile-first touch-friendly sizing (min 44px height)', () => {
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveClass('min-h-[44px]');
    });

    it('has responsive sizing for tablet/desktop', () => {
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveClass('md:min-h-[40px]');
    });

    it('has responsive text sizing', () => {
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address');
      // Mobile: text-base
      expect(input).toHaveClass('text-base');
      // Desktop: md:text-sm
      expect(input).toHaveClass('md:text-sm');
    });
  });

  describe('Custom Props', () => {
    it('accepts custom id prop', () => {
      render(<EmailInput value="" onChange={mockOnChange} id="custom-email" />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('id', 'custom-email');
    });

    it('accepts custom className', () => {
      render(<EmailInput value="" onChange={mockOnChange} className="custom-class" />);
      
      const container = screen.getByLabelText('Email Address').parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('forwards additional HTML input props', () => {
      render(
        <EmailInput 
          value="" 
          onChange={mockOnChange} 
          placeholder="Enter your email"
          name="user-email"
        />
      );
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('placeholder', 'Enter your email');
      expect(input).toHaveAttribute('name', 'user-email');
    });
  });

  describe('Focus Styles', () => {
    it('has focus ring styles', () => {
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveClass('focus:ring-2', 'focus:ring-offset-2');
    });

    it('has focus-visible ring styles for keyboard navigation', () => {
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-offset-2');
    });

    it('has different focus color when error is present', () => {
      render(
        <EmailInput 
          value="" 
          onChange={mockOnChange} 
          error="Invalid email" 
        />
      );
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveClass('focus:ring-red-500');
    });

    it('has blue focus color when no error', () => {
      render(<EmailInput value="" onChange={mockOnChange} />);
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveClass('focus:ring-blue-500');
    });
  });
});
