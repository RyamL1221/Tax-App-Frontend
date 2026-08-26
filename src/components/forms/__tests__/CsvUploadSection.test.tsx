/**
 * Unit tests for CsvUploadSection component
 *
 * Verifies that only Simple and Full CSV template links are rendered,
 * and that the blank 1099-DIV form link is NOT present.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CsvUploadSection } from '../CsvUploadSection';

// Mock TemplateLinkPanel to inspect the links prop
jest.mock('../TemplateLinkPanel', () => ({
  TemplateLinkPanel: ({ links }: { links: Array<{ label: string; ariaLabel: string }> }) => (
    <ul data-testid="template-link-panel">
      {links.map((link) => (
        <li key={link.ariaLabel} data-testid={`link-${link.ariaLabel}`}>
          {link.label}
        </li>
      ))}
    </ul>
  ),
}));

// Mock CsvUploadClient
jest.mock('@/app/forms/1099-div/csv-upload/CsvUploadClient', () => ({
  __esModule: true,
  default: () => <div data-testid="csv-upload-client">CsvUploadClient Mock</div>,
}));

// Mock cloudFrontAssets to provide predictable URLs
jest.mock('@/lib/config/cloudFrontAssets', () => ({
  FORM_1099_DIV_URLS: {
    simpleCsvTemplate: 'https://cdn.example.com/csv/1099-DIV/simple-template.csv',
    fullCsvTemplate: 'https://cdn.example.com/csv/1099-DIV/full-template.csv',
    blankForm: 'https://cdn.example.com/irs/1099-DIV.pdf',
  },
}));

describe('CsvUploadSection', () => {
  it('renders Simple Template preview link', () => {
    render(<CsvUploadSection />);
    expect(screen.getByTestId('link-Preview Simple CSV Template')).toBeInTheDocument();
  });

  it('renders Simple Template download link', () => {
    render(<CsvUploadSection />);
    expect(screen.getByTestId('link-Download Simple CSV Template')).toBeInTheDocument();
  });

  it('renders Full Template preview link', () => {
    render(<CsvUploadSection />);
    expect(screen.getByTestId('link-Preview Full CSV Template')).toBeInTheDocument();
  });

  it('renders Full Template download link', () => {
    render(<CsvUploadSection />);
    expect(screen.getByTestId('link-Download Full CSV Template')).toBeInTheDocument();
  });

  it('does NOT render blank 1099-DIV form preview link', () => {
    render(<CsvUploadSection />);
    expect(screen.queryByTestId('link-Preview Blank 1099-DIV Form')).not.toBeInTheDocument();
  });

  it('does NOT render blank 1099-DIV form download link', () => {
    render(<CsvUploadSection />);
    expect(screen.queryByTestId('link-Download Blank 1099-DIV Form')).not.toBeInTheDocument();
  });

  it('renders the CSV upload client', () => {
    render(<CsvUploadSection />);
    expect(screen.getByTestId('csv-upload-client')).toBeInTheDocument();
  });

  it('renders section heading', () => {
    render(<CsvUploadSection />);
    expect(screen.getByText('CSV Bulk Upload')).toBeInTheDocument();
  });

  it('passes only 4 links to TemplateLinkPanel', () => {
    render(<CsvUploadSection />);
    const panel = screen.getByTestId('template-link-panel');
    expect(panel.children).toHaveLength(4);
  });
});
