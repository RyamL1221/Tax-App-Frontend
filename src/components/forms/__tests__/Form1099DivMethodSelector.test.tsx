/**
 * Unit tests for Form1099DivMethodSelector component
 *
 * Tests card rendering, click selection, keyboard interaction (Enter/Space),
 * content switching between CSV and manual views, and "Change method" reset.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form1099DivMethodSelector } from '../Form1099DivMethodSelector';

// Mock child components to isolate selector behavior
jest.mock('@/components/forms/CsvUploadSection', () => ({
  CsvUploadSection: ({ className }: { className?: string }) => (
    <div data-testid="csv-upload-section" className={className}>
      CsvUploadSection Mock
    </div>
  ),
}));

jest.mock('@/components/auth/FormAuthGuard', () => ({
  FormAuthGuard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="form-auth-guard">{children}</div>
  ),
}));

jest.mock('@/app/forms/1099-div/Form1099DivClient', () => ({
  __esModule: true,
  default: ({ initialToken }: { initialToken: string | null }) => (
    <div data-testid="form-1099-div-client" data-token={initialToken}>
      Form1099DivClient Mock
    </div>
  ),
}));

describe('Form1099DivMethodSelector', () => {
  describe('Initial card selection view', () => {
    it('renders both method cards side by side', () => {
      render(<Form1099DivMethodSelector />);

      expect(screen.getByTestId('method-card-csv')).toBeInTheDocument();
      expect(screen.getByTestId('method-card-manual')).toBeInTheDocument();
      expect(screen.getByText('CSV Bulk Upload')).toBeInTheDocument();
      expect(screen.getByText('Fill Out Form')).toBeInTheDocument();
    });

    it('renders descriptive text for each card', () => {
      render(<Form1099DivMethodSelector />);

      expect(
        screen.getByText('Upload a CSV file to submit multiple 1099-DIV forms at once.')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Manually enter details for a single 1099-DIV form submission.')
      ).toBeInTheDocument();
    });

    it('has appropriate aria-labels on each card', () => {
      render(<Form1099DivMethodSelector />);

      expect(screen.getByTestId('method-card-csv')).toHaveAttribute(
        'aria-label',
        'Select CSV Bulk Upload method to upload multiple 1099-DIV forms via a CSV file'
      );
      expect(screen.getByTestId('method-card-manual')).toHaveAttribute(
        'aria-label',
        'Select Fill Out Form method to manually enter a single 1099-DIV form'
      );
    });

    it('cards have role="button" and are focusable', () => {
      render(<Form1099DivMethodSelector />);

      const csvCard = screen.getByTestId('method-card-csv');
      const manualCard = screen.getByTestId('method-card-manual');

      expect(csvCard).toHaveAttribute('role', 'button');
      expect(manualCard).toHaveAttribute('role', 'button');
      expect(csvCard).toHaveAttribute('tabIndex', '0');
      expect(manualCard).toHaveAttribute('tabIndex', '0');
    });

    it('does not trigger selection on other key presses', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      const csvCard = screen.getByTestId('method-card-csv');
      csvCard.focus();
      await user.keyboard('{Tab}');

      // Cards should still be visible (no selection made)
      expect(screen.getByTestId('method-card-csv')).toBeInTheDocument();
      expect(screen.queryByTestId('csv-upload-section')).not.toBeInTheDocument();
    });

    it('applies custom className to the container', () => {
      const { container } = render(<Form1099DivMethodSelector className="my-custom-class" />);

      expect(container.firstChild).toHaveClass('my-custom-class');
    });
  });

  describe('CSV method selected', () => {
    it('clicking CSV card shows CsvUploadSection and hides manual card', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      await user.click(screen.getByTestId('method-card-csv'));

      expect(screen.getByTestId('csv-upload-section')).toBeInTheDocument();
      expect(screen.queryByTestId('method-card-csv')).not.toBeInTheDocument();
      expect(screen.queryByTestId('method-card-manual')).not.toBeInTheDocument();
    });

    it('displays "CSV Bulk Upload" heading when CSV is selected', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      await user.click(screen.getByTestId('method-card-csv'));

      expect(screen.getByRole('heading', { name: 'CSV Bulk Upload' })).toBeInTheDocument();
    });

    it('displays "Change method" button when CSV is selected', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      await user.click(screen.getByTestId('method-card-csv'));

      expect(screen.getByTestId('change-method-button')).toBeInTheDocument();
      expect(screen.getByTestId('change-method-button')).toHaveTextContent('Change method');
    });

    it('does not show Form1099DivClient when CSV is selected', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      await user.click(screen.getByTestId('method-card-csv'));

      expect(screen.queryByTestId('form-1099-div-client')).not.toBeInTheDocument();
    });

    it('pressing Enter on CSV card shows CSV content', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      const csvCard = screen.getByTestId('method-card-csv');
      csvCard.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('csv-upload-section')).toBeInTheDocument();
    });

    it('pressing Space on CSV card shows CSV content', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      const csvCard = screen.getByTestId('method-card-csv');
      csvCard.focus();
      await user.keyboard(' ');

      expect(screen.getByTestId('csv-upload-section')).toBeInTheDocument();
    });
  });

  describe('Manual method selected', () => {
    it('clicking manual card shows Form1099DivClient and hides CSV card', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      await user.click(screen.getByTestId('method-card-manual'));

      expect(screen.getByTestId('form-1099-div-client')).toBeInTheDocument();
      expect(screen.getByTestId('form-auth-guard')).toBeInTheDocument();
      expect(screen.queryByTestId('method-card-csv')).not.toBeInTheDocument();
      expect(screen.queryByTestId('method-card-manual')).not.toBeInTheDocument();
    });

    it('displays "Fill Out Form" heading when manual is selected', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      await user.click(screen.getByTestId('method-card-manual'));

      expect(screen.getByRole('heading', { name: 'Fill Out Form' })).toBeInTheDocument();
    });

    it('displays "Change method" button when manual is selected', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      await user.click(screen.getByTestId('method-card-manual'));

      expect(screen.getByTestId('change-method-button')).toBeInTheDocument();
      expect(screen.getByTestId('change-method-button')).toHaveTextContent('Change method');
    });

    it('does not show CsvUploadSection when manual is selected', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      await user.click(screen.getByTestId('method-card-manual'));

      expect(screen.queryByTestId('csv-upload-section')).not.toBeInTheDocument();
    });

    it('wraps Form1099DivClient in FormAuthGuard', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      await user.click(screen.getByTestId('method-card-manual'));

      const guard = screen.getByTestId('form-auth-guard');
      const client = screen.getByTestId('form-1099-div-client');
      expect(guard).toContainElement(client);
    });

    it('passes initialToken={null} to Form1099DivClient', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      await user.click(screen.getByTestId('method-card-manual'));

      // React does not render data attributes with null values, so absence confirms null was passed
      expect(screen.getByTestId('form-1099-div-client')).not.toHaveAttribute('data-token');
    });

    it('pressing Enter on manual card shows manual content', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      const manualCard = screen.getByTestId('method-card-manual');
      manualCard.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('form-1099-div-client')).toBeInTheDocument();
    });

    it('pressing Space on manual card shows manual content', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      const manualCard = screen.getByTestId('method-card-manual');
      manualCard.focus();
      await user.keyboard(' ');

      expect(screen.getByTestId('form-1099-div-client')).toBeInTheDocument();
    });
  });

  describe('Change method resets selection', () => {
    it('clicking "Change method" from CSV view returns to card selection', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      // Select CSV
      await user.click(screen.getByTestId('method-card-csv'));
      expect(screen.getByTestId('csv-upload-section')).toBeInTheDocument();

      // Click Change method
      await user.click(screen.getByTestId('change-method-button'));

      // Should return to card selection
      expect(screen.getByTestId('method-card-csv')).toBeInTheDocument();
      expect(screen.getByTestId('method-card-manual')).toBeInTheDocument();
      expect(screen.queryByTestId('csv-upload-section')).not.toBeInTheDocument();
    });

    it('clicking "Change method" from manual view returns to card selection', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      // Select manual
      await user.click(screen.getByTestId('method-card-manual'));
      expect(screen.getByTestId('form-1099-div-client')).toBeInTheDocument();

      // Click Change method
      await user.click(screen.getByTestId('change-method-button'));

      // Should return to card selection
      expect(screen.getByTestId('method-card-csv')).toBeInTheDocument();
      expect(screen.getByTestId('method-card-manual')).toBeInTheDocument();
      expect(screen.queryByTestId('form-1099-div-client')).not.toBeInTheDocument();
    });

    it('can select a different method after changing back', async () => {
      const user = userEvent.setup();
      render(<Form1099DivMethodSelector />);

      // Select CSV first
      await user.click(screen.getByTestId('method-card-csv'));
      expect(screen.getByTestId('csv-upload-section')).toBeInTheDocument();

      // Change method
      await user.click(screen.getByTestId('change-method-button'));

      // Now select manual
      await user.click(screen.getByTestId('method-card-manual'));
      expect(screen.getByTestId('form-1099-div-client')).toBeInTheDocument();
      expect(screen.queryByTestId('csv-upload-section')).not.toBeInTheDocument();
    });
  });
});
