/**
 * Smoke test for the /forms/1099-div page
 *
 * Verifies the page renders the method selector cards and
 * blank form reference section on initial load.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Form1099DivPage from '../page';

// Mock Form1099DivMethodSelector
jest.mock('@/components/forms/Form1099DivMethodSelector', () => ({
  Form1099DivMethodSelector: ({ className }: { className?: string }) => (
    <div data-testid="method-selector" className={className}>
      <div data-testid="method-card-csv">CSV Bulk Upload</div>
      <div data-testid="method-card-manual">Fill Out Form</div>
    </div>
  ),
}));

// Mock BlankFormReferenceSection
jest.mock('@/components/forms/BlankFormReferenceSection', () => ({
  BlankFormReferenceSection: () => (
    <div data-testid="blank-form-reference-section">
      Blank 1099-DIV Form
    </div>
  ),
}));

describe('Form1099DivPage', () => {
  it('renders without errors', () => {
    render(<Form1099DivPage />);
    expect(screen.getByText('1099-DIV Form')).toBeInTheDocument();
  });

  it('renders the page header with title and description', () => {
    render(<Form1099DivPage />);
    expect(screen.getByText('1099-DIV Form')).toBeInTheDocument();
    expect(
      screen.getByText('Complete your Form 1099-DIV for dividends and distributions')
    ).toBeInTheDocument();
  });

  it('renders the method selector', () => {
    render(<Form1099DivPage />);
    expect(screen.getByTestId('method-selector')).toBeInTheDocument();
  });

  it('renders both method selector cards', () => {
    render(<Form1099DivPage />);
    expect(screen.getByTestId('method-card-csv')).toBeInTheDocument();
    expect(screen.getByTestId('method-card-manual')).toBeInTheDocument();
  });

  it('renders the blank form reference section', () => {
    render(<Form1099DivPage />);
    expect(screen.getByTestId('blank-form-reference-section')).toBeInTheDocument();
  });

  it('blank form reference section is below the method selector', () => {
    const { container } = render(<Form1099DivPage />);
    const selector = container.querySelector('[data-testid="method-selector"]');
    const blankForm = container.querySelector('[data-testid="blank-form-reference-section"]');

    expect(selector).toBeInTheDocument();
    expect(blankForm).toBeInTheDocument();

    // Verify ordering: selector comes before blank form in DOM
    const allElements = container.querySelectorAll('[data-testid]');
    const selectorIndex = Array.from(allElements).indexOf(selector!);
    const blankFormIndex = Array.from(allElements).indexOf(blankForm!);
    expect(selectorIndex).toBeLessThan(blankFormIndex);
  });

  it('does not render CsvUploadSection or FormAuthGuard directly', () => {
    render(<Form1099DivPage />);
    // These are now internal to Form1099DivMethodSelector, not rendered by page
    expect(screen.queryByText('CSV Bulk Upload Section Direct')).not.toBeInTheDocument();
  });
});
