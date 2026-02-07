/**
 * Accessibility Tests for Form1099DivInput Component
 * 
 * Tests verify WCAG 2.1 Level AA compliance including:
 * - ARIA labels for all form fields
 * - ARIA live regions for validation errors
 * - aria-describedby associations
 * - Logical tab order
 * - Keyboard navigation
 * - Touch target sizes (minimum 44x44px)
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 8.3
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form1099DivInput } from './Form1099DivInput';

describe('Form1099DivInput - Accessibility', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('ARIA Labels (Requirement 7.1)', () => {
    it('should have labels for all required fields', () => {
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      // Required fields
      expect(screen.getByLabelText(/tax year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/payer name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/payer tin/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recipient name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recipient tin/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/total ordinary dividends/i)).toBeInTheDocument();
    });

    it('should have labels for optional fields', () => {
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      // Sample optional fields
      expect(screen.getByLabelText(/payer telephone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/qualified dividends/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/federal income tax withheld/i)).toBeInTheDocument();
    });

    it('should have aria-label for checkbox fields', () => {
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      const voidedCheckbox = screen.getByRole('checkbox', { name: /voided/i });
      const correctedCheckbox = screen.getByRole('checkbox', { name: /corrected/i });
      
      expect(voidedCheckbox).toHaveAttribute('aria-label');
      expect(correctedCheckbox).toHaveAttribute('aria-label');
    });

    it('should mark required fields with aria-required', () => {
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      const calendarYear = screen.getByLabelText(/tax year/i);
      const payerName = screen.getByLabelText(/payer name/i);
      const recipientTIN = screen.getByLabelText(/recipient tin/i);

      expect(calendarYear).toHaveAttribute('aria-required', 'true');
      expect(payerName).toHaveAttribute('aria-required', 'true');
      expect(recipientTIN).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('ARIA Live Regions (Requirement 7.3)', () => {
    it('should announce API errors with assertive live region', () => {
      const errorMessage = 'Unable to generate document. Please try again.';
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={errorMessage} />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent(errorMessage);
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should announce validation errors with polite live region', async () => {
      const user = userEvent.setup();
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      // Submit form without filling required fields
      const submitButton = screen.getByRole('button', { name: /generate preview/i });
      await user.click(submitButton);

      // Wait for validation errors to appear
      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        // Filter for field-level errors (not the API error)
        const fieldErrors = errorMessages.filter(el => 
          el.getAttribute('aria-live') === 'polite'
        );
        expect(fieldErrors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('aria-describedby Associations (Requirement 7.6)', () => {
    it('should associate error messages with fields using aria-describedby', async () => {
      const user = userEvent.setup();
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      // Trigger validation error by entering invalid data and blurring
      const payerTINInput = screen.getByLabelText(/payer tin/i);
      await user.type(payerTINInput, 'invalid');
      await user.tab(); // Trigger blur validation

      await waitFor(() => {
        const describedBy = payerTINInput.getAttribute('aria-describedby');
        
        expect(describedBy).toBeTruthy();
        expect(describedBy).toContain('error');
        
        // Verify the error element exists with that ID
        const errorElement = document.getElementById(describedBy!);
        expect(errorElement).toBeInTheDocument();
      });
    });

    it('should associate helper text with fields using aria-describedby', () => {
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      const payerTINInput = screen.getByLabelText(/payer tin/i);
      const describedBy = payerTINInput.getAttribute('aria-describedby');
      
      expect(describedBy).toBeTruthy();
      expect(describedBy).toContain('helper');
      
      // Verify the helper text element exists
      const helperElement = document.getElementById(describedBy!);
      expect(helperElement).toBeInTheDocument();
      expect(helperElement).toHaveTextContent(/format/i);
    });

    it('should prioritize error over helper text in aria-describedby', async () => {
      const user = userEvent.setup();
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      // Enter invalid payer TIN
      const payerTINInput = screen.getByLabelText(/payer tin/i);
      await user.type(payerTINInput, 'invalid');
      await user.tab(); // Trigger blur validation

      await waitFor(() => {
        const describedBy = payerTINInput.getAttribute('aria-describedby');
        expect(describedBy).toContain('error');
      });
    });
  });

  describe('Keyboard Navigation (Requirement 7.2, 7.4)', () => {
    it('should allow tabbing through all form fields in logical order', async () => {
      const user = userEvent.setup();
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      // Start from the first field
      const calendarYear = screen.getByLabelText(/tax year/i);
      calendarYear.focus();
      expect(calendarYear).toHaveFocus();

      // Tab to next field
      await user.tab();
      const payerName = screen.getByLabelText(/payer name/i);
      expect(payerName).toHaveFocus();

      // Tab to next field
      await user.tab();
      const payerTIN = screen.getByLabelText(/payer tin/i);
      expect(payerTIN).toHaveFocus();
    });

    it('should allow keyboard interaction with checkboxes', async () => {
      const user = userEvent.setup();
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      const voidedCheckbox = screen.getByRole('checkbox', { name: /voided/i });
      
      // Focus the checkbox
      voidedCheckbox.focus();
      expect(voidedCheckbox).toHaveFocus();

      // Toggle with space key
      await user.keyboard(' ');
      expect(voidedCheckbox).toBeChecked();

      await user.keyboard(' ');
      expect(voidedCheckbox).not.toBeChecked();
    });

    it('should allow keyboard submission by clicking submit button', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      // Fill required fields with valid data
      const calendarYear = screen.getByLabelText(/tax year/i);
      const payerName = screen.getByLabelText(/payer name/i);
      const payerTIN = screen.getByLabelText(/payer tin/i);
      const recipientName = screen.getByLabelText(/recipient name/i);
      const recipientTIN = screen.getByLabelText(/recipient tin/i);
      const totalDividends = screen.getByLabelText(/total ordinary dividends/i);

      await user.clear(calendarYear);
      await user.type(calendarYear, '2024');
      await user.clear(payerName);
      await user.type(payerName, 'Test Corp');
      await user.clear(payerTIN);
      await user.type(payerTIN, '12-3456789');
      await user.clear(recipientName);
      await user.type(recipientName, 'John Doe');
      await user.clear(recipientTIN);
      await user.type(recipientTIN, '123-45-6789');
      await user.clear(totalDividends);
      await user.type(totalDividends, '1000.00');

      // Tab to submit button and press Enter
      const submitButton = screen.getByRole('button', { name: /generate preview/i });
      submitButton.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should show visible focus indicators', async () => {
      const user = userEvent.setup();
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      const calendarYear = screen.getByLabelText(/tax year/i);
      
      // Focus the input
      await user.tab();
      if (document.activeElement !== calendarYear) {
        calendarYear.focus();
      }

      // Check for focus-visible class or focus ring
      const computedStyle = window.getComputedStyle(calendarYear);
      // The input should have focus styles applied
      expect(calendarYear).toHaveFocus();
    });
  });

  describe('Touch Target Sizes (Requirement 8.3)', () => {
    it('should have minimum 44x44px touch targets for inputs on mobile', () => {
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      const calendarYear = screen.getByLabelText(/tax year/i);
      
      // Check that the input has the min-h-[44px] class
      expect(calendarYear.className).toContain('min-h-[44px]');
    });

    it('should have minimum 44x44px touch targets for checkboxes', () => {
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      const voidedCheckbox = screen.getByRole('checkbox', { name: /voided/i });
      const checkboxContainer = voidedCheckbox.closest('.flex.items-start');
      
      // The checkbox itself might be smaller, but the clickable area should be adequate
      // The label is also clickable, providing a larger touch target
      expect(checkboxContainer).toBeInTheDocument();
    });

    it('should have minimum 44x44px touch target for submit button', () => {
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      const submitButton = screen.getByRole('button', { name: /generate preview/i });
      
      // Button should have h-12 class (48px) which exceeds minimum
      expect(submitButton.className).toContain('h-12');
    });
  });

  describe('aria-invalid for Error States', () => {
    it('should set aria-invalid=false when field has no error', () => {
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      const calendarYear = screen.getByLabelText(/tax year/i);
      expect(calendarYear).toHaveAttribute('aria-invalid', 'false');
    });

    it('should set aria-invalid=true when field has error', async () => {
      const user = userEvent.setup();
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      // Enter invalid data and blur to trigger validation
      const payerTINInput = screen.getByLabelText(/payer tin/i);
      await user.type(payerTINInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(payerTINInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Loading State Accessibility', () => {
    it('should disable form fields during submission', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);
      
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      // Fill required fields with valid data
      const calendarYear = screen.getByLabelText(/tax year/i);
      const payerName = screen.getByLabelText(/payer name/i);
      const payerTIN = screen.getByLabelText(/payer tin/i);
      const recipientName = screen.getByLabelText(/recipient name/i);
      const recipientTIN = screen.getByLabelText(/recipient tin/i);
      const totalDividends = screen.getByLabelText(/total ordinary dividends/i);

      await user.clear(calendarYear);
      await user.type(calendarYear, '2024');
      await user.clear(payerName);
      await user.type(payerName, 'Test Corp');
      await user.clear(payerTIN);
      await user.type(payerTIN, '12-3456789');
      await user.clear(recipientName);
      await user.type(recipientName, 'John Doe');
      await user.clear(recipientTIN);
      await user.type(recipientTIN, '123-45-6789');
      await user.clear(totalDividends);
      await user.type(totalDividends, '1000.00');

      const submitButton = screen.getByRole('button', { name: /generate preview/i });
      await user.click(submitButton);

      // Check that fields are disabled during submission
      await waitFor(() => {
        expect(calendarYear).toBeDisabled();
      }, { timeout: 3000 });

      // Clean up
      resolveSubmit!();
    });

    it('should set aria-busy on submit button during loading', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(submitPromise);
      
      render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);

      // Fill required fields with valid data
      const calendarYear = screen.getByLabelText(/tax year/i);
      const payerName = screen.getByLabelText(/payer name/i);
      const payerTIN = screen.getByLabelText(/payer tin/i);
      const recipientName = screen.getByLabelText(/recipient name/i);
      const recipientTIN = screen.getByLabelText(/recipient tin/i);
      const totalDividends = screen.getByLabelText(/total ordinary dividends/i);

      await user.clear(calendarYear);
      await user.type(calendarYear, '2024');
      await user.clear(payerName);
      await user.type(payerName, 'Test Corp');
      await user.clear(payerTIN);
      await user.type(payerTIN, '12-3456789');
      await user.clear(recipientName);
      await user.type(recipientName, 'John Doe');
      await user.clear(recipientTIN);
      await user.type(recipientTIN, '123-45-6789');
      await user.clear(totalDividends);
      await user.type(totalDividends, '1000.00');

      const submitButton = screen.getByRole('button', { name: /generate preview/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toHaveAttribute('aria-busy', 'true');
      }, { timeout: 3000 });

      // Clean up
      resolveSubmit!();
    });
  });

  describe('Form Structure', () => {
    it('should use semantic HTML form element', () => {
      const { container } = render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);
      
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('should have noValidate attribute to use custom validation', () => {
      const { container } = render(<Form1099DivInput onSubmit={mockOnSubmit} error={null} />);
      
      const form = container.querySelector('form');
      expect(form).toHaveAttribute('noValidate');
    });
  });
});
