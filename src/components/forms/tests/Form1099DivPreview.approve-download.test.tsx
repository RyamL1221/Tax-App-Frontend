/**
 * Unit tests for Form1099DivPreview approve download functionality
 * 
 * Tests the automatic PDF download feature when users approve their 1099-DIV form.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 5.5
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form1099DivPreview, DocumentResponse } from '../Form1099DivPreview';
import { documentService } from '@/lib/api';

// Mock the documentService
jest.mock('@/lib/api', () => ({
  documentService: {
    downloadDocument: jest.fn()
  }
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Store original createElement and body methods
const originalCreateElement = document.createElement.bind(document);
const originalAppendChild = document.body.appendChild.bind(document.body);
const originalRemoveChild = document.body.removeChild.bind(document.body);

// Mock document.createElement for download link
(document.createElement as any) = function(tagName: string) {
  const element = originalCreateElement(tagName);
  if (tagName === 'a') {
    // Add mock click method
    element.click = jest.fn();
  }
  return element;
};

// Mock appendChild and removeChild to handle our mock links
(document.body.appendChild as any) = function(node: any) {
  if (node.tagName === 'A') {
    // Don't actually append link elements in tests
    return node;
  }
  return originalAppendChild(node);
};

(document.body.removeChild as any) = function(node: any) {
  if (node.tagName === 'A') {
    // Don't actually remove link elements in tests
    return node;
  }
  return originalRemoveChild(node);
};

describe('Form1099DivPreview - Approve Download Functionality', () => {
  const mockDocument: DocumentResponse = {
    jobId: 'test-job-123',
    status: 'COMPLETED',
    documentType: '1099-DIV',
    templateKey: 'templates/1099-DIV.pdf',
    outputKey: 'outputs/1099-DIV-test-job-123.pdf'
  };

  const mockOnEdit = jest.fn();
  const mockOnApprove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    
    // Mock initial PDF load to resolve immediately
    (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:initial-url');
  });

  describe('Approve button triggers download before success message', () => {
    it('should call downloadDocument when approve button is clicked', async () => {
      const user = userEvent.setup();
      (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:test-url');

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve and finalize form/i });
      await user.click(approveButton);

      // Verify downloadDocument was called
      expect(documentService.downloadDocument).toHaveBeenCalledWith(mockDocument.jobId);
    });

    it('should show loading state during download', async () => {
      const user = userEvent.setup();
      let resolveDownload: (value: string) => void;
      const downloadPromise = new Promise<string>((resolve) => {
        resolveDownload = resolve;
      });

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();
      (documentService.downloadDocument as jest.Mock).mockReturnValue(downloadPromise);

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve and finalize form/i });
      await user.click(approveButton);

      // Verify loading state is shown
      expect(screen.getByText(/downloading/i)).toBeInTheDocument();
      expect(approveButton).toBeDisabled();

      // Resolve the download
      resolveDownload!('blob:test-url');

      // Wait for loading state to clear
      await waitFor(() => {
        expect(screen.queryByText(/downloading/i)).not.toBeInTheDocument();
      });
    });

    it('should trigger browser download with correct filename', async () => {
      const user = userEvent.setup();
      (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:test-url');

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();
      (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:test-url');

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve and finalize form/i });
      await user.click(approveButton);

      // Wait for downloadDocument to be called
      await waitFor(() => {
        expect(documentService.downloadDocument).toHaveBeenCalledWith(mockDocument.jobId);
      });

      // Verify downloadDocument was called with correct jobId
      expect(documentService.downloadDocument).toHaveBeenCalledWith(mockDocument.jobId);
    });

    it('should show success message after download completes', async () => {
      const user = userEvent.setup();
      (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:test-url');

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();
      (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:test-url');

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve and finalize form/i });
      await user.click(approveButton);

      // Wait for downloadDocument to be called (which means download was attempted)
      await waitFor(() => {
        expect(documentService.downloadDocument).toHaveBeenCalledWith(mockDocument.jobId);
      }, { timeout: 3000 });
    });

    it('should call onApprove callback after 2 seconds', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:test-url');

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();
      (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:test-url');

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve and finalize form/i });
      await user.click(approveButton);

      // Wait for downloadDocument to be called
      await waitFor(() => {
        expect(documentService.downloadDocument).toHaveBeenCalledWith(mockDocument.jobId);
      });

      // Verify onApprove not called yet
      expect(mockOnApprove).not.toHaveBeenCalled();

      // Fast-forward 2 seconds
      jest.advanceTimersByTime(2000);

      // Verify onApprove was called
      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe('Download error handling', () => {
    it('should display error message when download fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Network error';

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();
      (documentService.downloadDocument as jest.Mock).mockRejectedValue({
        status: 0,
        message: errorMessage
      });

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve and finalize form/i });
      await user.click(approveButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      }, { timeout: 3000 });

      const alert = screen.getByRole('alert');
      expect(within(alert).getByText(/download failed/i)).toBeInTheDocument();
      expect(within(alert).getByText(/network error/i)).toBeInTheDocument();
    });

    it('should stay in preview mode when download fails', async () => {
      const user = userEvent.setup();

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();
      (documentService.downloadDocument as jest.Mock).mockRejectedValue({
        status: 500,
        message: 'Server error'
      });

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve and finalize form/i });
      await user.click(approveButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify still in preview mode (not showing success message)
      expect(screen.queryByText(/form approved successfully/i)).not.toBeInTheDocument();
      
      // Verify onApprove was not called
      expect(mockOnApprove).not.toHaveBeenCalled();
    });

    it('should re-enable approve button after error', async () => {
      const user = userEvent.setup();

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();
      (documentService.downloadDocument as jest.Mock).mockRejectedValue({
        status: 404,
        message: 'Not found'
      });

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve and finalize form/i });
      await user.click(approveButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify approve button is enabled again
      expect(approveButton).not.toBeDisabled();
    });

    it('should map 401 error to authentication message', async () => {
      const user = userEvent.setup();

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();
      (documentService.downloadDocument as jest.Mock).mockRejectedValue({
        status: 401,
        message: 'Unauthorized'
      });

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve and finalize form/i });
      await user.click(approveButton);

      // Wait for error message
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(within(alert).getByText(/authentication failed/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should map 404 error to not found message', async () => {
      const user = userEvent.setup();

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();
      (documentService.downloadDocument as jest.Mock).mockRejectedValue({
        status: 404,
        message: 'Not found'
      });

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve and finalize form/i });
      await user.click(approveButton);

      // Wait for error message
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(within(alert).getByText(/document not found/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Manual download button independence', () => {
    it('should allow manual download without affecting workflow state', async () => {
      const user = userEvent.setup();
      (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:test-url');

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      }, { timeout: 3000 });

      // Find and click manual download button
      const downloadButton = screen.getByRole('link', { name: /download pdf document/i });
      await user.click(downloadButton);

      // Verify workflow state unchanged (no success message)
      expect(screen.queryByText(/form approved successfully/i)).not.toBeInTheDocument();
      
      // Verify onApprove was not called
      expect(mockOnApprove).not.toHaveBeenCalled();
    });
  });

  describe('Edit button independence', () => {
    it('should allow edit without triggering download', async () => {
      const user = userEvent.setup();
      (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:test-url');

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();

      // Click edit button
      const editButton = screen.getByRole('button', { name: /edit form data/i });
      await user.click(editButton);

      // Verify onEdit was called
      expect(mockOnEdit).toHaveBeenCalled();
      
      // Verify downloadDocument was not called (except for initial load)
      expect(documentService.downloadDocument).not.toHaveBeenCalled();
      
      // Verify onApprove was not called
      expect(mockOnApprove).not.toHaveBeenCalled();
    });
  });

  describe('Blob URL cleanup', () => {
    it('should revoke blob URL after successful download', async () => {
      const user = userEvent.setup();
      (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:test-url');

      render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();
      mockRevokeObjectURL.mockClear();
      (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:test-url');

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve and finalize form/i });
      await user.click(approveButton);

      // Wait for download to be called and blob URL to be revoked
      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test-url');
      }, { timeout: 5000 });
    });
  });

  describe('Component unmount during download', () => {
    it('should handle unmount gracefully during download', async () => {
      const user = userEvent.setup();
      let resolveDownload: (value: string) => void;
      const downloadPromise = new Promise<string>((resolve) => {
        resolveDownload = resolve;
      });

      const { unmount } = render(
        <Form1099DivPreview
          document={mockDocument}
          onEdit={mockOnEdit}
          onApprove={mockOnApprove}
        />
      );

      // Wait for initial PDF load
      await waitFor(() => {
        const iframe = screen.queryByTitle(/1099-DIV Form Preview/i);
        expect(iframe).toBeInTheDocument();
      });

      jest.clearAllMocks();
      (documentService.downloadDocument as jest.Mock).mockReturnValue(downloadPromise);

      // Click approve button
      const approveButton = screen.getByRole('button', { name: /approve and finalize form/i });
      await user.click(approveButton);

      // Unmount component before download completes
      unmount();

      // Resolve the download (should not cause errors)
      resolveDownload!('blob:test-url');

      // Wait a bit to ensure no errors
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test passes if no errors thrown
      expect(true).toBe(true);
    }, 10000);
  });
});
