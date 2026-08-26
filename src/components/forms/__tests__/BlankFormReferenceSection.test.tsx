/**
 * Unit tests for BlankFormReferenceSection component
 *
 * Verifies that the blank 1099-DIV form preview/download links render
 * with the correct URLs and labels.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BlankFormReferenceSection } from '../BlankFormReferenceSection';

// Mock cloudFrontAssets to provide predictable URLs
jest.mock('@/lib/config/cloudFrontAssets', () => ({
  FORM_1099_DIV_URLS: {
    simpleCsvTemplate: 'https://cdn.example.com/csv/1099-DIV/simple-template.csv',
    fullCsvTemplate: 'https://cdn.example.com/csv/1099-DIV/full-template.csv',
    blankForm: 'https://cdn.example.com/irs/1099-DIV.pdf',
  },
}));

// Mock InlinePreviewPanel used by TemplateLinkPanel
jest.mock('../InlinePreviewPanel', () => ({
  InlinePreviewPanel: ({ id, isOpen }: { id: string; isOpen: boolean }) => (
    isOpen ? <div data-testid={id}>Preview Panel</div> : null
  ),
}));

describe('BlankFormReferenceSection', () => {
  it('renders the section heading', () => {
    render(<BlankFormReferenceSection />);
    expect(screen.getByText('Blank 1099-DIV Form')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<BlankFormReferenceSection />);
    expect(
      screen.getByText('Reference copy of the official 1099-DIV form for your records.')
    ).toBeInTheDocument();
  });

  it('renders a preview button for blank 1099-DIV form', () => {
    render(<BlankFormReferenceSection />);
    expect(screen.getByRole('button', { name: 'Preview Blank 1099-DIV Form' })).toBeInTheDocument();
  });

  it('renders a download link for blank 1099-DIV form', () => {
    render(<BlankFormReferenceSection />);
    const downloadLink = screen.getByRole('link', { name: 'Download Blank 1099-DIV Form' });
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute('href', 'https://cdn.example.com/irs/1099-DIV.pdf');
    expect(downloadLink).toHaveAttribute('download', '1099-DIV.pdf');
  });

  it('does NOT render CSV template links', () => {
    render(<BlankFormReferenceSection />);
    expect(screen.queryByText('Preview Simple Template')).not.toBeInTheDocument();
    expect(screen.queryByText('Preview Full Template')).not.toBeInTheDocument();
  });

  it('has a data-testid on the section element', () => {
    render(<BlankFormReferenceSection />);
    expect(screen.getByTestId('blank-form-reference-section')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<BlankFormReferenceSection className="my-class" />);
    expect(screen.getByTestId('blank-form-reference-section')).toHaveClass('my-class');
  });
});
