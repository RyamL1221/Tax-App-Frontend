/**
 * Unit tests for Form1099DivClient component
 * 
 * Tests the main orchestrator component that manages the 1099-DIV form workflow.
 * Verifies mode-based rendering, form data preservation, and workflow transitions.
 * 
 * Requirements: 5.5, 6.4, 9.1, 9.4
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Form1099DivClient from './Form1099DivClient';
import { useForm1099Div } from '@/hooks/useForm1099Div';
import type { Form1099DivData } from '@/lib/validation/form1099DivSchema';

// Mock the custom hook
jest.mock('@/hooks/useForm1099Div');

// Mock the child components
jest.mock('@/components/forms/Form1099DivInput', () => ({
  Form1099DivInput: ({ onSubmit, defaultValues, error }: any) => (
    <div data-testid="form-input">
      <div data-testid="default-values">{JSON.stringify(defaultValues)}</div>
      <div data-testid="error">{error}</div>
      <button onClick={() => onSubmit({ calendarYear: '2024' })}>Submit</button>
    </div>
  ),
}));

jest.mock('@/components/forms/Form1099DivPreview', () => ({
  Form1099DivPreview: ({ document, onEdit, onApprove }: any) => (
    <div data-testid="form-preview">
      <div data-testid="document">{JSON.stringify(document)}</div>
      <button onClick={onEdit}>Edit</button>
      <button onClick={onApprove}>Approve</button>
    </div>
  ),
}));

const mockUseForm1099Div = useForm1099Div as jest.MockedFunction<typeof useForm1099Div>;

describe('Form1099DivClient', () => {
  const mockToken = 'test-jwt-token';
  const mockFormData: Form1099DivData = {
    calendarYear: '2024',
    payerName: 'Test Corp',
    payerTIN: '12-3456789',
    recipientName: 'John Doe',
    recipientTIN: '123-45-6789',
    totalOrdinaryDividends: '1000.00',
  };
  const mockDocument = {
    jobId: 'test-job-123',
    status: 'COMPLETED',
    documentType: '1099-DIV',
    templateKey: 'templates/1099-DIV.pdf',
    outputKey: 'outputs/1099-DIV-test.pdf',
    message: 'Success',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Mode', () => {
    it('should render Form1099DivInput in input mode', () => {
      mockUseForm1099Div.mockReturnValue({
        mode: 'input',
        formData: null,
        generatedDocument: null,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      expect(screen.getByTestId('form-input')).toBeInTheDocument();
      expect(screen.queryByTestId('form-preview')).not.toBeInTheDocument();
    });

    it('should pass null defaultValues when no form data exists', () => {
      mockUseForm1099Div.mockReturnValue({
        mode: 'input',
        formData: null,
        generatedDocument: null,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      const defaultValuesElement = screen.getByTestId('default-values');
      expect(defaultValuesElement.textContent).toBe('');
    });

    it('should pass form data as defaultValues when editing', () => {
      mockUseForm1099Div.mockReturnValue({
        mode: 'input',
        formData: mockFormData,
        generatedDocument: null,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      const defaultValuesElement = screen.getByTestId('default-values');
      expect(defaultValuesElement.textContent).toContain('2024');
      expect(defaultValuesElement.textContent).toContain('Test Corp');
    });

    it('should display error message when present', () => {
      const errorMessage = 'API error occurred';
      mockUseForm1099Div.mockReturnValue({
        mode: 'input',
        formData: null,
        generatedDocument: null,
        error: errorMessage,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
    });

    it('should call handleGeneratePreview when form is submitted', async () => {
      const handleGeneratePreview = jest.fn();
      mockUseForm1099Div.mockReturnValue({
        mode: 'input',
        formData: null,
        generatedDocument: null,
        error: null,
        isSubmitting: false,
        handleGeneratePreview,
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      const submitButton = screen.getByText('Submit');
      await userEvent.click(submitButton);

      expect(handleGeneratePreview).toHaveBeenCalledWith({ calendarYear: '2024' });
    });
  });

  describe('Preview Mode', () => {
    it('should render Form1099DivPreview in preview mode', () => {
      mockUseForm1099Div.mockReturnValue({
        mode: 'preview',
        formData: mockFormData,
        generatedDocument: mockDocument,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      expect(screen.getByTestId('form-preview')).toBeInTheDocument();
      expect(screen.queryByTestId('form-input')).not.toBeInTheDocument();
    });

    it('should pass generated document to preview component', () => {
      mockUseForm1099Div.mockReturnValue({
        mode: 'preview',
        formData: mockFormData,
        generatedDocument: mockDocument,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      const documentElement = screen.getByTestId('document');
      expect(documentElement.textContent).toContain('test-job-123');
      expect(documentElement.textContent).toContain('COMPLETED');
    });

    it('should call handleEdit when edit button is clicked', async () => {
      const handleEdit = jest.fn();
      mockUseForm1099Div.mockReturnValue({
        mode: 'preview',
        formData: mockFormData,
        generatedDocument: mockDocument,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit,
        handleApprove: jest.fn(),
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      expect(handleEdit).toHaveBeenCalledTimes(1);
    });

    it('should call handleApprove when approve button is clicked', async () => {
      const handleApprove = jest.fn();
      mockUseForm1099Div.mockReturnValue({
        mode: 'preview',
        formData: mockFormData,
        generatedDocument: mockDocument,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove,
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      const approveButton = screen.getByText('Approve');
      await userEvent.click(approveButton);

      expect(handleApprove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Workflow Transitions', () => {
    it('should preserve form data when transitioning from input to preview', () => {
      const { rerender } = render(<Form1099DivClient initialToken={mockToken} />);

      // Start in input mode
      mockUseForm1099Div.mockReturnValue({
        mode: 'input',
        formData: null,
        generatedDocument: null,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });
      rerender(<Form1099DivClient initialToken={mockToken} />);
      expect(screen.getByTestId('form-input')).toBeInTheDocument();

      // Transition to preview mode with form data
      mockUseForm1099Div.mockReturnValue({
        mode: 'preview',
        formData: mockFormData,
        generatedDocument: mockDocument,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });
      rerender(<Form1099DivClient initialToken={mockToken} />);
      expect(screen.getByTestId('form-preview')).toBeInTheDocument();
    });

    it('should restore form data when returning to edit mode', () => {
      const { rerender } = render(<Form1099DivClient initialToken={mockToken} />);

      // Start in preview mode
      mockUseForm1099Div.mockReturnValue({
        mode: 'preview',
        formData: mockFormData,
        generatedDocument: mockDocument,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });
      rerender(<Form1099DivClient initialToken={mockToken} />);

      // Return to input mode with preserved data
      mockUseForm1099Div.mockReturnValue({
        mode: 'input',
        formData: mockFormData,
        generatedDocument: null,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });
      rerender(<Form1099DivClient initialToken={mockToken} />);

      const defaultValuesElement = screen.getByTestId('default-values');
      expect(defaultValuesElement.textContent).toContain('Test Corp');
    });

    it('should clear form data after approval', () => {
      const { rerender } = render(<Form1099DivClient initialToken={mockToken} />);

      // Start in preview mode
      mockUseForm1099Div.mockReturnValue({
        mode: 'preview',
        formData: mockFormData,
        generatedDocument: mockDocument,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });
      rerender(<Form1099DivClient initialToken={mockToken} />);

      // After approval, return to input mode with cleared data
      mockUseForm1099Div.mockReturnValue({
        mode: 'input',
        formData: null,
        generatedDocument: null,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });
      rerender(<Form1099DivClient initialToken={mockToken} />);

      const defaultValuesElement = screen.getByTestId('default-values');
      expect(defaultValuesElement.textContent).toBe('');
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when submitting', () => {
      mockUseForm1099Div.mockReturnValue({
        mode: 'input',
        formData: null,
        generatedDocument: null,
        error: null,
        isSubmitting: true,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      expect(screen.getByRole('status')).toHaveTextContent('Generating document, please wait...');
    });
  });

  describe('Token Handling', () => {
    it('should pass token to useForm1099Div hook', () => {
      mockUseForm1099Div.mockReturnValue({
        mode: 'input',
        formData: null,
        generatedDocument: null,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });

      render(<Form1099DivClient initialToken={mockToken} />);

      expect(mockUseForm1099Div).toHaveBeenCalledWith(mockToken);
    });

    it('should handle null token', () => {
      mockUseForm1099Div.mockReturnValue({
        mode: 'input',
        formData: null,
        generatedDocument: null,
        error: null,
        isSubmitting: false,
        handleGeneratePreview: jest.fn(),
        handleEdit: jest.fn(),
        handleApprove: jest.fn(),
      });

      render(<Form1099DivClient initialToken={null} />);

      expect(mockUseForm1099Div).toHaveBeenCalledWith(null);
    });
  });
});
