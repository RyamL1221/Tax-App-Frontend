/**
 * Unit tests for Form1099DivMethodSelector component
 *
 * Tests card rendering, click selection, and keyboard interaction (Enter/Space).
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form1099DivMethodSelector } from '../Form1099DivMethodSelector';

describe('Form1099DivMethodSelector', () => {
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

  it('clicking CSV card sets selectedMethod to "csv"', async () => {
    const user = userEvent.setup();
    render(<Form1099DivMethodSelector />);

    await user.click(screen.getByTestId('method-card-csv'));

    expect(screen.getByTestId('selected-method')).toHaveTextContent('csv');
  });

  it('clicking manual card sets selectedMethod to "manual"', async () => {
    const user = userEvent.setup();
    render(<Form1099DivMethodSelector />);

    await user.click(screen.getByTestId('method-card-manual'));

    expect(screen.getByTestId('selected-method')).toHaveTextContent('manual');
  });

  it('pressing Enter on CSV card sets selectedMethod to "csv"', async () => {
    const user = userEvent.setup();
    render(<Form1099DivMethodSelector />);

    const csvCard = screen.getByTestId('method-card-csv');
    csvCard.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('selected-method')).toHaveTextContent('csv');
  });

  it('pressing Space on manual card sets selectedMethod to "manual"', async () => {
    const user = userEvent.setup();
    render(<Form1099DivMethodSelector />);

    const manualCard = screen.getByTestId('method-card-manual');
    manualCard.focus();
    await user.keyboard(' ');

    expect(screen.getByTestId('selected-method')).toHaveTextContent('manual');
  });

  it('pressing Space on CSV card sets selectedMethod to "csv"', async () => {
    const user = userEvent.setup();
    render(<Form1099DivMethodSelector />);

    const csvCard = screen.getByTestId('method-card-csv');
    csvCard.focus();
    await user.keyboard(' ');

    expect(screen.getByTestId('selected-method')).toHaveTextContent('csv');
  });

  it('pressing Enter on manual card sets selectedMethod to "manual"', async () => {
    const user = userEvent.setup();
    render(<Form1099DivMethodSelector />);

    const manualCard = screen.getByTestId('method-card-manual');
    manualCard.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByTestId('selected-method')).toHaveTextContent('manual');
  });

  it('does not trigger selection on other key presses', async () => {
    const user = userEvent.setup();
    render(<Form1099DivMethodSelector />);

    const csvCard = screen.getByTestId('method-card-csv');
    csvCard.focus();
    await user.keyboard('{Tab}');

    // Cards should still be visible (no selection made)
    expect(screen.getByTestId('method-card-csv')).toBeInTheDocument();
    expect(screen.queryByTestId('selected-method')).not.toBeInTheDocument();
  });

  it('applies custom className to the container', () => {
    const { container } = render(<Form1099DivMethodSelector className="my-custom-class" />);

    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
