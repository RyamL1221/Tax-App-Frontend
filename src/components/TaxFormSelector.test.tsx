import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaxFormSelector } from './TaxFormSelector';
import { TAX_FORMS } from '@/types/taxForm';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('TaxFormSelector', () => {
  const mockOnFormSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render dropdown with correct structure', () => {
      render(<TaxFormSelector />);

      const select = screen.getByLabelText(/select a tax form/i);
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('id', 'tax-form-select');
      expect(select).toHaveAttribute('aria-required', 'true');
    });

    it('should render navigation button', () => {
      render(<TaxFormSelector />);

      const button = screen.getByRole('button', { name: /navigate to selected form/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should display placeholder text when no form selected', () => {
      render(<TaxFormSelector />);

      const select = screen.getByLabelText(/select a tax form/i) as HTMLSelectElement;
      expect(select.value).toBe('');
      
      const placeholderOption = screen.getByText('Select a tax form...');
      expect(placeholderOption).toBeInTheDocument();
    });

    it('should render 1099-DIV form in options', () => {
      render(<TaxFormSelector />);

      const option = screen.getByRole('option', { name: /1099-DIV/i });
      expect(option).toBeInTheDocument();
    });

    it('should render all forms from TAX_FORMS array', () => {
      render(<TaxFormSelector />);

      TAX_FORMS.forEach(form => {
        const option = screen.getByRole('option', { name: new RegExp(form.displayName, 'i') });
        expect(option).toBeInTheDocument();
        expect(option).toHaveValue(form.id);
      });
    });
  });

  describe('Button Disabled State', () => {
    it('should disable navigation button when no form selected', () => {
      render(<TaxFormSelector />);

      const button = screen.getByRole('button', { name: /navigate to selected form/i });
      expect(button).toBeDisabled();
    });

    it('should enable navigation button when form is selected', async () => {
      const user = userEvent.setup();
      render(<TaxFormSelector />);

      const select = screen.getByLabelText(/select a tax form/i);
      const button = screen.getByRole('button', { name: /navigate to selected form/i });

      // Initially disabled
      expect(button).toBeDisabled();

      // Select a form
      await user.selectOptions(select, '1099-div');

      // Now enabled
      expect(button).not.toBeDisabled();
    });
  });

  describe('Form Selection', () => {
    it('should update selected form when user selects from dropdown', async () => {
      const user = userEvent.setup();
      render(<TaxFormSelector />);

      const select = screen.getByLabelText(/select a tax form/i) as HTMLSelectElement;

      // Initially no selection
      expect(select.value).toBe('');

      // Select 1099-DIV
      await user.selectOptions(select, '1099-div');

      // Value should be updated
      expect(select.value).toBe('1099-div');
    });

    it('should call onFormSelect callback when form is selected', async () => {
      const user = userEvent.setup();
      render(<TaxFormSelector onFormSelect={mockOnFormSelect} />);

      const select = screen.getByLabelText(/select a tax form/i);

      await user.selectOptions(select, '1099-div');

      expect(mockOnFormSelect).toHaveBeenCalledWith('1099-div');
      expect(mockOnFormSelect).toHaveBeenCalledTimes(1);
    });

    it('should not call onFormSelect when callback is not provided', async () => {
      const user = userEvent.setup();
      render(<TaxFormSelector />);

      const select = screen.getByLabelText(/select a tax form/i);

      // Should not throw error
      await user.selectOptions(select, '1099-div');

      // Test passes if no error is thrown
      expect(select).toHaveValue('1099-div');
    });
  });

  describe('Navigation', () => {
    it('should navigate to correct form path when button clicked', async () => {
      const user = userEvent.setup();
      render(<TaxFormSelector />);

      const select = screen.getByLabelText(/select a tax form/i);
      const button = screen.getByRole('button', { name: /navigate to selected form/i });

      // Select 1099-DIV form
      await user.selectOptions(select, '1099-div');

      // Click navigation button
      await user.click(button);

      // Should navigate to the form's path
      expect(mockPush).toHaveBeenCalledWith('/forms/1099-div');
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('should not navigate when no form is selected', async () => {
      const user = userEvent.setup();
      render(<TaxFormSelector />);

      const button = screen.getByRole('button', { name: /navigate to selected form/i });

      // Button should be disabled, but test the logic anyway
      expect(button).toBeDisabled();

      // Router push should not be called
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should navigate to correct path for each form in TAX_FORMS', async () => {
      const user = userEvent.setup();

      for (const form of TAX_FORMS) {
        mockPush.mockClear();
        
        const { unmount } = render(<TaxFormSelector />);

        const select = screen.getByLabelText(/select a tax form/i);
        const button = screen.getByRole('button', { name: /navigate to selected form/i });

        await user.selectOptions(select, form.id);
        await user.click(button);

        expect(mockPush).toHaveBeenCalledWith(form.path);

        unmount();
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TaxFormSelector />);

      const select = screen.getByLabelText(/select a tax form/i);
      const button = screen.getByRole('button', { name: /navigate to selected form/i });

      expect(select).toHaveAttribute('aria-label', 'Select a tax form');
      expect(button).toHaveAttribute('aria-label', 'Navigate to selected form');
    });

    it('should have touch-friendly button size', () => {
      render(<TaxFormSelector />);

      const button = screen.getByRole('button', { name: /navigate to selected form/i });
      expect(button).toHaveClass('min-h-[44px]');
    });

    it('should have proper label association', () => {
      render(<TaxFormSelector />);

      const label = screen.getByText('Select Tax Form');
      const select = screen.getByLabelText(/select a tax form/i);

      expect(label).toHaveAttribute('for', 'tax-form-select');
      expect(select).toHaveAttribute('id', 'tax-form-select');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className to container', () => {
      const { container } = render(<TaxFormSelector className="custom-class" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-class');
      expect(wrapper).toHaveClass('space-y-4');
    });
  });
});
