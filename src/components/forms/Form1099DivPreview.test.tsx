/**
 * Unit Tests for Form1099DivPreview Component
 * 
 * Tests the preview display component for 1099-DIV form submissions.
 * Validates that all document information is displayed correctly and
 * that edit/approve actions work as expected.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.3
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form1099DivPreview, DocumentResponse } from './Form1099DivPreview';

// Mock the documentService
jest.mock('@/lib/api', () => ({
  documentService: {
    downloadDocument: jest.fn()
  }
}));

import { documentService } from '@/lib/api';

// Mock document response
const mockDocument: DocumentResponse = {
  jobId: 'job-12345',
  status: 'COMPLETED',
  documentType: '1099-DIV',
  templateKey: 'templates/1099-DIV.pdf',
  outputKey: 'outputs/1099-DIV-job-12345.pdf'
};

// Mock blob URL
const mockBlobUrl = 'blob:http://localhost:3000/mock-pdf-url';

describe('Form1099DivPreview', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock successful PDF download by default
    (documentService.downloadDocument as jest.Mock).mockResolvedValue(mockBlobUrl);
    
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => mockBlobUrl);
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('Document Information Display', () => {
    it('should display job ID', async () => {
      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      expect(screen.getByText('Job ID')).toBeInTheDocument();
      expect(screen.getByText('job-12345')).toBeInTheDocument();
    });

    it('should display status', async () => {
      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /Status: Completed/i })).toBeInTheDocument();
    });

    it('should display document type', async () => {
      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      expect(screen.getByText('Document Type')).toBeInTheDocument();
      expect(screen.getByText('1099-DIV')).toBeInTheDocument();
    });

    it('should display all required information (Requirement 5.1, 5.2, 5.3)', async () => {
      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      // Verify all required fields are present
      expect(screen.getByText('Job ID')).toBeInTheDocument();
      expect(screen.getByText('job-12345')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Document Type')).toBeInTheDocument();
      expect(screen.getByText('1099-DIV')).toBeInTheDocument();
    });
  });

  describe('PDF Preview and Download', () => {
    it('should fetch and display PDF preview (Requirement 5.3)', async () => {
      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      // Should show loading state initially
      expect(screen.getByText('Loading PDF...')).toBeInTheDocument();

      // Wait for PDF to load
      await waitFor(() => {
        expect(documentService.downloadDocument).toHaveBeenCalledWith(mockDocument.outputKey);
      });

      // Should display iframe with PDF
      await waitFor(() => {
        const iframe = screen.getByTitle('1099-DIV Form Preview');
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveAttribute('src', mockBlobUrl);
      });
    });

    it('should provide a download link after PDF loads (Requirement 5.3)', async () => {
      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      // Wait for PDF to load
      await waitFor(() => {
        const downloadLink = screen.getByRole('link', { name: /Download PDF/i });
        expect(downloadLink).toBeInTheDocument();
        expect(downloadLink).toHaveAttribute('href', mockBlobUrl);
        expect(downloadLink).toHaveAttribute('download', `1099-DIV-${mockDocument.jobId}.pdf`);
      });
    });

    it('should handle PDF loading errors', async () => {
      const errorMessage = 'Failed to load PDF';
      (documentService.downloadDocument as jest.Mock).mockRejectedValue(new Error(errorMessage));

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText('Failed to Load PDF')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should cleanup blob URL on unmount', async () => {
      const { unmount } = render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      // Wait for PDF to load
      await waitFor(() => {
        expect(documentService.downloadDocument).toHaveBeenCalled();
      });

      // Unmount component
      unmount();

      // Should revoke blob URL
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockBlobUrl);
    });
  });

  describe('Action Buttons', () => {
    it('should display Edit and Approve buttons (Requirement 5.4)', async () => {
      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /Edit form/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
    });

    it('should call onEdit when Edit button is clicked (Requirement 6.3)', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={onEdit}
          onApprove={jest.fn()}
        />
      );

      const editButton = screen.getByRole('button', { name: /Edit form/i });
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('should show success message when Approve button is clicked (Requirement 6.1)', async () => {
      const user = userEvent.setup();
      const onApprove = jest.fn();

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={onApprove}
        />
      );

      const approveButton = screen.getByRole('button', { name: /Approve/i });
      await user.click(approveButton);

      // Success message should appear
      expect(screen.getByText('Form Approved Successfully!')).toBeInTheDocument();
      expect(screen.getByText(/Your 1099-DIV form has been finalized/i)).toBeInTheDocument();
    });

    it('should call onApprove after timeout when Approve is clicked (Requirement 6.1)', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      const onApprove = jest.fn();

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={onApprove}
        />
      );

      const approveButton = screen.getByRole('button', { name: /Approve/i });
      await user.click(approveButton);

      // onApprove should not be called immediately
      expect(onApprove).not.toHaveBeenCalled();

      // Fast-forward time by 2 seconds
      jest.advanceTimersByTime(2000);

      // onApprove should now be called
      expect(onApprove).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('Status Badge', () => {
    it('should display COMPLETED status with green badge', async () => {
      render(
        <Form1099DivPreview
          document={{ ...mockDocument, status: 'COMPLETED' }}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      const statusBadge = screen.getByRole('status', { name: /Status: Completed/i });
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('should display PENDING status with yellow badge', async () => {
      render(
        <Form1099DivPreview
          document={{ ...mockDocument, status: 'PENDING' }}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      const statusBadge = screen.getByRole('status', { name: /Status: Pending/i });
      expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should display RUNNING status with blue badge', async () => {
      render(
        <Form1099DivPreview
          document={{ ...mockDocument, status: 'RUNNING' }}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      const statusBadge = screen.getByRole('status', { name: /Status: Running/i });
      expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('should display FAILED status with red badge', async () => {
      render(
        <Form1099DivPreview
          document={{ ...mockDocument, status: 'FAILED' }}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      const statusBadge = screen.getByRole('status', { name: /Status: Failed/i });
      expect(statusBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should handle unknown status gracefully', async () => {
      render(
        <Form1099DivPreview
          document={{ ...mockDocument, status: 'UNKNOWN' }}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      const statusBadge = screen.getByRole('status', { name: /Status: UNKNOWN/i });
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    });
  });

  describe('Success Message', () => {
    it('should hide document info when showing success message', async () => {
      const user = userEvent.setup();

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      // Initially, document info should be visible
      expect(screen.getByText('Job ID')).toBeInTheDocument();

      // Click approve
      const approveButton = screen.getByRole('button', { name: /Approve/i });
      await user.click(approveButton);

      // Document info should be hidden
      expect(screen.queryByText('Job ID')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Edit form/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Approve/i })).not.toBeInTheDocument();
    });

    it('should reset success state when document changes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      // Click approve to show success
      const approveButton = screen.getByRole('button', { name: /Approve/i });
      await user.click(approveButton);

      expect(screen.getByText('Form Approved Successfully!')).toBeInTheDocument();

      // Rerender with new document
      const newDocument = { ...mockDocument, jobId: 'job-67890' };
      rerender(
        <Form1099DivPreview
          document={newDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      // Success message should be hidden, document info should be visible
      expect(screen.queryByText('Form Approved Successfully!')).not.toBeInTheDocument();
      expect(screen.getByText('Job ID')).toBeInTheDocument();
      expect(screen.getByText('job-67890')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', async () => {
      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /Edit form data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Approve and finalize form/i })).toBeInTheDocument();
      
      // Wait for PDF to load before checking download link
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Download PDF document/i })).toBeInTheDocument();
      });
    });

    it('should have proper ARIA live region for success message', async () => {
      const user = userEvent.setup();

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      const approveButton = screen.getByRole('button', { name: /Approve/i });
      await user.click(approveButton);

      const successMessage = screen.getByRole('status');
      expect(successMessage).toHaveAttribute('aria-live', 'polite');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();
      const onApprove = jest.fn();

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={onEdit}
          onApprove={onApprove}
        />
      );

      // Wait for PDF to load
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Download PDF/i })).toBeInTheDocument();
      });

      // Tab to download link
      await user.tab();
      expect(screen.getByRole('link', { name: /Download PDF/i })).toHaveFocus();

      // Tab to Edit button
      await user.tab();
      expect(screen.getByRole('button', { name: /Edit form/i })).toHaveFocus();

      // Press Enter on Edit button
      await user.keyboard('{Enter}');
      expect(onEdit).toHaveBeenCalledTimes(1);

      // Tab to Approve button
      await user.tab();
      expect(screen.getByRole('button', { name: /Approve/i })).toHaveFocus();

      // Press Enter on Approve button
      await user.keyboard('{Enter}');
      await waitFor(() => {
        expect(screen.getByText('Form Approved Successfully!')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive classes for mobile and desktop', async () => {
      const { container } = render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      // Check for responsive classes on action buttons container
      const buttonsContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(buttonsContainer).toBeInTheDocument();

      // Check for responsive classes on document info
      const infoItems = container.querySelectorAll('.flex.flex-col.sm\\:flex-row.sm\\:items-center');
      expect(infoItems.length).toBeGreaterThan(0);
    });

    it('should have mobile-friendly touch targets', async () => {
      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
        />
      );

      // Wait for PDF to load
      await waitFor(() => {
        const downloadLink = screen.getByRole('link', { name: /Download PDF/i });
        expect(downloadLink).toHaveClass('min-h-[44px]');
      });
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to container', () => {
      const { container } = render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={jest.fn()}
          onApprove={jest.fn()}
          className="custom-class"
        />
      );

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('custom-class');
    });
  });
});
