import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  const mockOnChange = jest.fn();
  const mockOnToggleVisibility = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnToggleVisibility.mockClear();
  });

  describe('Rendering', () => {
    it('renders with default label', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange} 
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('renders with custom label', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange} 
          label="Your Password"
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      expect(screen.getByLabelText('Your Password')).toBeInTheDocument();
    });

    it('renders with initial value', () => {
      render(
        <PasswordInput 
          value="mypassword123" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password') as HTMLInputElement;
      expect(input.value).toBe('mypassword123');
    });

    it('renders as password input type when showPassword is false', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders as text input type when showPassword is true', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={true}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('User Interaction', () => {
    it('calls onChange when user types', async () => {
      const user = userEvent.setup();
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      await user.type(input, 'test');
      
      // Should be called for each character typed
      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenCalledTimes(4); // 't', 'e', 's', 't'
    });

    it('updates value when controlled', () => {
      const { rerender } = render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password') as HTMLInputElement;
      
      // Simulate controlled component update
      rerender(
        <PasswordInput 
          value="newpassword" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      expect(input.value).toBe('newpassword');
    });

    it('does not call onChange when disabled', async () => {
      const user = userEvent.setup();
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          disabled
        />
      );
      
      const input = screen.getByLabelText('Password');
      await user.type(input, 'test');
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Password Visibility Toggle (Requirements 4.1, 4.2)', () => {
    it('renders visibility toggle button', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('calls onToggleVisibility when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await user.click(toggleButton);
      
      expect(mockOnToggleVisibility).toHaveBeenCalledTimes(1);
    });

    it('displays "Show password" label when password is hidden', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: 'Show password' });
      expect(toggleButton).toBeInTheDocument();
    });

    it('displays "Hide password" label when password is visible', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={true}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: 'Hide password' });
      expect(toggleButton).toBeInTheDocument();
    });

    it('toggle button has aria-pressed attribute', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('aria-pressed is true when password is visible', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={true}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: /hide password/i });
      expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('toggle button is disabled when input is disabled', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          disabled
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toBeDisabled();
    });

    it('does not call onToggleVisibility when disabled', async () => {
      const user = userEvent.setup();
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          disabled
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      await user.click(toggleButton);
      
      expect(mockOnToggleVisibility).not.toHaveBeenCalled();
    });
  });

  describe('Password Visibility Icons (Requirements 4.3, 4.4)', () => {
    it('displays eye icon when password is hidden', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      const icon = toggleButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('displays eye-off icon when password is visible', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={true}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: /hide password/i });
      const icon = toggleButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('icon changes when showPassword prop changes', () => {
      const { rerender } = render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      let toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toBeInTheDocument();
      
      rerender(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={true}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      toggleButton = screen.getByRole('button', { name: /hide password/i });
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('displays error message when error prop is provided', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          error="Password must be at least 8 characters" 
        />
      );
      
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    it('does not display error when error prop is undefined', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('displays error icon when error is present', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          error="Invalid password" 
        />
      );
      
      const errorContainer = screen.getByRole('alert');
      const icon = errorContainer.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('updates error message when error prop changes', () => {
      const { rerender } = render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          error="First error" 
        />
      );
      
      expect(screen.getByText('First error')).toBeInTheDocument();
      
      rerender(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          error="Second error" 
        />
      );
      
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      expect(screen.getByText('Second error')).toBeInTheDocument();
    });

    it('removes error message when error is cleared', () => {
      const { rerender } = render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          error="Invalid password" 
        />
      );
      
      expect(screen.getByText('Invalid password')).toBeInTheDocument();
      
      rerender(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      expect(screen.queryByText('Invalid password')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility (Requirements 5.1)', () => {
    it('has proper ARIA label', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          label="Password"
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('aria-label', 'Password');
    });

    it('has aria-required attribute', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('has aria-invalid when error is present', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          error="Invalid password" 
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not have aria-invalid when no error', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('associates error message with input via aria-describedby', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          error="Invalid password"
          id="test-password"
        />
      );
      
      const input = screen.getByLabelText('Password');
      const errorId = input.getAttribute('aria-describedby');
      
      expect(errorId).toBe('test-password-error');
      
      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toHaveAttribute('id', errorId);
    });

    it('error message has role="alert" for screen readers', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          error="Invalid password" 
        />
      );
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
    });

    it('error message has aria-live="polite" for announcements', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          error="Invalid password" 
        />
      );
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    it('has autocomplete attribute for password', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('autocomplete', 'current-password');
    });

    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      
      // Tab to focus
      await user.tab();
      expect(input).toHaveFocus();
      
      // Type with keyboard
      await user.keyboard('mypassword');
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('toggle button is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      // Tab to input
      await user.tab();
      expect(screen.getByLabelText('Password')).toHaveFocus();
      
      // Tab to toggle button
      await user.tab();
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toHaveFocus();
      
      // Press Enter to toggle
      await user.keyboard('{Enter}');
      expect(mockOnToggleVisibility).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          disabled
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toBeDisabled();
    });

    it('applies disabled styling to input', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          disabled
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveClass('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
    });
  });

  describe('Responsive Design (Requirements 6.1, 6.2)', () => {
    it('has mobile-first touch-friendly sizing for input (min 44px height)', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveClass('min-h-[44px]');
    });

    it('has responsive sizing for tablet/desktop input', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveClass('md:min-h-[40px]');
    });

    it('has responsive text sizing', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveClass('text-base');
      expect(input).toHaveClass('md:text-sm');
    });

    it('has mobile-first touch-friendly sizing for toggle button (min 44px)', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toHaveClass('min-w-[44px]', 'min-h-[44px]');
    });

    it('has responsive sizing for tablet/desktop toggle button', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toHaveClass('md:min-w-[36px]', 'md:min-h-[36px]');
    });
  });

  describe('Custom Props', () => {
    it('accepts custom id prop', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          id="custom-password"
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('id', 'custom-password');
    });

    it('accepts custom className', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          className="custom-class"
        />
      );
      
      const container = screen.getByLabelText('Password').parentElement?.parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('forwards additional HTML input props', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          placeholder="Enter your password"
          name="user-password"
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('placeholder', 'Enter your password');
      expect(input).toHaveAttribute('name', 'user-password');
    });
  });

  describe('Focus Styles', () => {
    it('has focus ring styles', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveClass('focus:ring-2', 'focus:ring-offset-2');
    });

    it('has focus-visible ring styles for keyboard navigation', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-offset-2');
    });

    it('has different focus color when error is present', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
          error="Invalid password" 
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveClass('focus:ring-red-500');
    });

    it('has blue focus color when no error', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveClass('focus:ring-blue-500');
    });

    it('toggle button has focus ring styles', () => {
      render(
        <PasswordInput 
          value="" 
          onChange={mockOnChange}
          showPassword={false}
          onToggleVisibility={mockOnToggleVisibility}
        />
      );
      
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });
  });

  // Feature: login-page, Property 8: Password visibility toggle round-trip
  describe('Property-Based Tests', () => {
    test('property: toggling visibility twice returns to original state', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // Initial showPassword state
          fc.string(), // Password value
          (initialShowPassword, passwordValue) => {
            // Create a wrapper component that manages state properly
            let showPassword = initialShowPassword;
            const toggleVisibility = () => {
              showPassword = !showPassword;
            };

            const { rerender, unmount, container } = render(
              <PasswordInput 
                value={passwordValue} 
                onChange={mockOnChange}
                showPassword={showPassword}
                onToggleVisibility={toggleVisibility}
                id="test-password-input"
              />
            );

            // Get the input element using the container
            const getInput = () => container.querySelector('#test-password-input') as HTMLInputElement;
            const getToggleButton = () => container.querySelector('#test-password-input-toggle') as HTMLButtonElement;
            
            // Record initial state
            const initialType = getInput().type;
            const initialAriaPressed = getToggleButton().getAttribute('aria-pressed');
            
            // First toggle - simulate user clicking and parent updating state
            toggleVisibility();
            rerender(
              <PasswordInput 
                value={passwordValue} 
                onChange={mockOnChange}
                showPassword={showPassword}
                onToggleVisibility={toggleVisibility}
                id="test-password-input"
              />
            );
            
            // Record intermediate state
            const intermediateType = getInput().type;
            const intermediateAriaPressed = getToggleButton().getAttribute('aria-pressed');
            
            // Second toggle - simulate user clicking and parent updating state
            toggleVisibility();
            rerender(
              <PasswordInput 
                value={passwordValue} 
                onChange={mockOnChange}
                showPassword={showPassword}
                onToggleVisibility={toggleVisibility}
                id="test-password-input"
              />
            );
            
            // Record final state
            const finalType = getInput().type;
            const finalAriaPressed = getToggleButton().getAttribute('aria-pressed');
            
            // Verify round-trip: final state should match initial state
            expect(finalType).toBe(initialType);
            expect(finalAriaPressed).toBe(initialAriaPressed);
            expect(showPassword).toBe(initialShowPassword);
            
            // Verify intermediate state was different
            expect(intermediateType).not.toBe(initialType);
            expect(intermediateAriaPressed).not.toBe(initialAriaPressed);
            
            // Verify the correct state transitions occurred
            if (initialShowPassword) {
              // Started visible -> hidden -> visible
              expect(initialType).toBe('text');
              expect(intermediateType).toBe('password');
              expect(finalType).toBe('text');
            } else {
              // Started hidden -> visible -> hidden
              expect(initialType).toBe('password');
              expect(intermediateType).toBe('text');
              expect(finalType).toBe('password');
            }
            
            // Clean up
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: login-page, Property 9: Password visibility state matches icon
    // **Validates: Requirements 4.3, 4.4**
    test('property: password visibility state matches icon and aria attributes', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // showPassword state
          fc.string(), // Password value
          (showPassword, passwordValue) => {
            const { container, unmount } = render(
              <PasswordInput 
                value={passwordValue} 
                onChange={mockOnChange}
                showPassword={showPassword}
                onToggleVisibility={mockOnToggleVisibility}
                id="test-password-icon"
              />
            );

            const toggleButton = container.querySelector('#test-password-icon-toggle') as HTMLButtonElement;
            const input = container.querySelector('#test-password-icon') as HTMLInputElement;
            const icon = toggleButton.querySelector('svg');
            
            // Verify icon exists
            expect(icon).toBeTruthy();
            
            // Verify aria-pressed matches showPassword state
            const ariaPressed = toggleButton.getAttribute('aria-pressed');
            expect(ariaPressed).toBe(showPassword.toString());
            
            // Verify aria-label matches showPassword state
            const ariaLabel = toggleButton.getAttribute('aria-label');
            if (showPassword) {
              // When password is visible, button should say "Hide password"
              expect(ariaLabel).toBe('Hide password');
            } else {
              // When password is hidden, button should say "Show password"
              expect(ariaLabel).toBe('Show password');
            }
            
            // Verify input type matches showPassword state
            const inputType = input.type;
            if (showPassword) {
              expect(inputType).toBe('text');
            } else {
              expect(inputType).toBe('password');
            }
            
            // Verify icon SVG path indicates correct state
            // When showPassword is true, we show eye-off icon (1 path with slash)
            // When showPassword is false, we show eye icon (2 paths: pupil + eye shape)
            const paths = icon.querySelectorAll('path');
            if (showPassword) {
              // Eye-off icon has 1 path element
              expect(paths.length).toBe(1);
            } else {
              // Eye icon has 2 path elements
              expect(paths.length).toBe(2);
            }
            
            // Clean up
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
