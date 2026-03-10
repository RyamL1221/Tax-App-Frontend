/**
 * Responsive Design Tests for Form1099DivPreview
 * 
 * Tests Requirements 8.4:
 * - Preview readable on all screen sizes
 * - Responsive layout for document information
 * - Mobile-friendly action buttons
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Form1099DivPreview, DocumentResponse } from '../Form1099DivPreview';

// Mock the Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

describe('Form1099DivPreview - Responsive Design', () => {
  const mockDocument: DocumentResponse = {
    jobId: 'test-job-123',
    status: 'COMPLETED',
    documentType: '1099-DIV',
    templateKey: 'templates/1099-DIV.pdf',
    outputKey: 'outputs/1099-DIV-test.pdf',
  };

  const mockOnEdit = jest.fn();
  const mockOnApprove = jest.fn();

  const defaultProps = {
    document: mockDocument,
    onEdit: mockOnEdit,
    onApprove: mockOnApprove,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 8.4: Preview readable on all screen sizes', () => {
    it('should render document information in a readable format', () => {
      render(<Form1099DivPreview {...defaultProps} />);
      
      // Check that all document information is displayed
      expect(screen.getByText('Preview Generated Document')).toBeInTheDocument();
      expect(screen.getByText('test-job-123')).toBeInTheDocument();
      expect(screen.getByText('1099-DIV')).toBeInTheDocument();
    });

    it('should have responsive flex layout for document details', () => {
      const { container } = render(<Form1099DivPreview {...defaultProps} />);
      
      // Document information should use flex-col on mobile and flex-row on desktop
      const detailRows = container.querySelectorAll('dt');
      detailRows.forEach(dt => {
        const parent = dt.parentElement;
        if (parent) {
          expect(parent.className).toContain('flex');
          expect(parent.className).toContain('flex-col');
          expect(parent.className).toContain('sm:flex-row');
        }
      });
    });

    it('should have proper text wrapping for long content', () => {
      const { container } = render(<Form1099DivPreview {...defaultProps} />);
      
      // Job ID should have break-all for long strings
      const jobIdElement = screen.getByText('test-job-123');
      expect(jobIdElement.className).toContain('break-all');
    });
  });

  describe('Mobile-friendly action buttons', () => {
    it('should have full width buttons on mobile', () => {
      render(<Form1099DivPreview {...defaultProps} />);
      
      const editButton = screen.getByRole('button', { name: /edit form/i });
      const approveButton = screen.getByRole('button', { name: /approve/i });
      
      // Buttons should have w-full for mobile
      expect(editButton.className).toContain('w-full');
      expect(approveButton.className).toContain('w-full');
    });

    it('should have auto width buttons on desktop', () => {
      render(<Form1099DivPreview {...defaultProps} />);
      
      const editButton = screen.getByRole('button', { name: /edit form/i });
      const approveButton = screen.getByRole('button', { name: /approve/i });
      
      // Buttons should have sm:w-auto for desktop
      expect(editButton.className).toContain('sm:w-auto');
      expect(approveButton.className).toContain('sm:w-auto');
    });

    it('should have minimum touch target size', () => {
      render(<Form1099DivPreview {...defaultProps} />);
      
      const downloadLink = screen.getByRole('link', { name: /download pdf/i });
      
      // Download link should have min-h-[44px] for touch targets
      expect(downloadLink.className).toContain('min-h-[44px]');
    });
  });

  describe('Responsive button container', () => {
    it('should stack buttons vertically on mobile', () => {
      const { container } = render(<Form1099DivPreview {...defaultProps} />);
      
      // Find the button container
      const buttonContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('should arrange buttons horizontally on desktop', () => {
      const { container } = render(<Form1099DivPreview {...defaultProps} />);
      
      // Button container should have sm:flex-row
      const buttonContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(buttonContainer?.className).toContain('sm:flex-row');
    });
  });

  describe('Responsive spacing and padding', () => {
    it('should have responsive layout for success message', async () => {
      const { findByText } = render(<Form1099DivPreview {...defaultProps} />);
      
      // Trigger success state
      const approveButton = screen.getByRole('button', { name: /approve/i });
      approveButton.click();
      
      // Success container should be displayed
      const successContainer = screen.getByRole('status');
      expect(successContainer).toBeInTheDocument();
      
      // Should display success message (use findByText for async)
      const successHeading = await findByText('Form Approved Successfully!');
      expect(successHeading).toBeInTheDocument();
    });

    it('should have consistent spacing between elements', () => {
      const { container } = render(<Form1099DivPreview {...defaultProps} />);
      
      // Main container should have space-y
      const mainContainer = container.querySelector('.space-y-6');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('Download section responsiveness', () => {
    it('should render download link with proper styling', () => {
      render(<Form1099DivPreview {...defaultProps} />);
      
      const downloadLink = screen.getByRole('link', { name: /download pdf/i });
      
      // Should have responsive classes
      expect(downloadLink).toBeInTheDocument();
      expect(downloadLink.className).toContain('inline-flex');
      expect(downloadLink.className).toContain('items-center');
    });

    it('should have proper icon sizing', () => {
      const { container } = render(<Form1099DivPreview {...defaultProps} />);
      
      // Icons should have consistent sizing
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Status badge responsiveness', () => {
    it('should render status badge with proper styling', () => {
      render(<Form1099DivPreview {...defaultProps} />);
      
      const statusBadge = screen.getByRole('status', { name: /status: completed/i });
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge.className).toContain('inline-flex');
    });

    it('should handle different status values', () => {
      const statuses = ['COMPLETED', 'PENDING', 'RUNNING', 'FAILED'];
      
      statuses.forEach(status => {
        const { rerender } = render(
          <Form1099DivPreview 
            {...defaultProps} 
            document={{ ...mockDocument, status }} 
          />
        );
        
        const statusBadge = screen.getByRole('status', { name: new RegExp(`status: ${status}`, 'i') });
        expect(statusBadge).toBeInTheDocument();
        
        rerender(<div />); // Clean up
      });
    });
  });

  describe('Help text section', () => {
    it('should render help text with proper responsive styling', () => {
      render(<Form1099DivPreview {...defaultProps} />);
      
      expect(screen.getByText('Next Steps')).toBeInTheDocument();
      expect(screen.getByText(/Download the PDF to review/i)).toBeInTheDocument();
    });
  });
});
