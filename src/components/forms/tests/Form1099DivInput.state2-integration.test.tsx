/**
 * Integration Tests for the 1099-DIV manual entry submission path
 *
 * These tests wire the real Form1099DivInput component to the real
 * useForm1099Div hook (via a small harness), exercising the full flow:
 *   react-hook-form + zodResolver(form1099DivSchema) @ mode 'onBlur'
 *     -> handleGeneratePreview -> documentService.generateDocument -> preview mode
 *
 * Only external boundaries are mocked (Next.js router, documentService,
 * tokenManager.hasToken, FormDataPreserver, AuthLogger). The validation
 * schema (the State 2 whitespace fix) runs for real.
 *
 * Scenarios (spec: state-two-optional-validation, task 5):
 *  - Stray whitespace in state2 does NOT block; form advances to preview (2.1, 2.3)
 *  - A complete valid State 2 advances to preview and submits trimmed values (3.4, 3.6)
 *  - An invalid required field alongside whitespace State 2 blocks on the
 *    required field only (3.1)
 *
 * Requirements: 2.1, 2.3, 3.1, 3.4, 3.6
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Form1099DivInput } from '../Form1099DivInput';
import { Form1099DivPreview } from '../Form1099DivPreview';
import { useForm1099Div } from '@/hooks/useForm1099Div';
import { documentService } from '@/lib/api';
import { hasToken } from '@/lib/api/tokenManager';

// ---- Mocks: external boundaries only ----

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  documentService: {
    generateDocument: jest.fn(),
    // Form1099DivPreview downloads the PDF via this on mount
    downloadDocument: jest.fn(),
  },
}));

jest.mock('@/lib/api/tokenManager', () => ({
  hasToken: jest.fn(),
}));

jest.mock('@/lib/auth/FormDataPreserver', () => ({
  saveFormData: jest.fn(),
  restoreFormData: jest.fn(),
  clearFormData: jest.fn(),
  hasSavedFormData: jest.fn(() => false),
}));

jest.mock('@/lib/auth/AuthLogger', () => ({
  logAuthEvent: jest.fn(),
  createAuthState: jest.fn(() => ({})),
}));

import { useRouter, usePathname } from 'next/navigation';

/**
 * Test harness: connects the real input component to the real workflow hook,
 * rendering the preview once the hook transitions to preview mode.
 */
function ManualEntryHarness() {
  const {
    mode,
    generatedDocument,
    error,
    handleGeneratePreview,
    handleEdit,
    handleApprove,
  } = useForm1099Div('test-token');

  if (mode === 'preview' && generatedDocument) {
    return (
      <div>
        <div data-testid="preview-mode-marker">PREVIEW</div>
        <Form1099DivPreview
          document={generatedDocument}
          onEdit={handleEdit}
          onApprove={handleApprove}
        />
      </div>
    );
  }

  return <Form1099DivInput onSubmit={handleGeneratePreview} error={error} />;
}

const mockDocumentResponse = {
  jobId: 'test-job-123',
  status: 'COMPLETED' as const,
  documentType: '1099-DIV',
  templateKey: 'templates/1099-DIV.pdf',
  outputKey: 'outputs/1099-DIV-test-job-123.pdf',
};

/**
 * Fills the six required fields with valid values.
 */
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  // calendarYear has a default value (current year) - clear before typing
  const taxYear = screen.getByLabelText(/tax year/i);
  await user.clear(taxYear);
  await user.type(taxYear, '2024');
  await user.type(screen.getByLabelText(/payer name/i), 'Example Investment Corp');
  await user.type(screen.getByLabelText(/payer tin/i), '12-3456789');
  await user.type(screen.getByLabelText(/recipient name/i), 'John Doe');
  await user.type(screen.getByLabelText(/recipient tin/i), '123-45-6789');
  await user.type(screen.getByLabelText(/total ordinary dividends/i), '1000.00');
}

describe('Form1099DivInput - State 2 optional validation (integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (usePathname as jest.Mock).mockReturnValue('/forms/1099-div');
    (hasToken as jest.Mock).mockReturnValue(true);
    (documentService.generateDocument as jest.Mock).mockResolvedValue(mockDocumentResponse);
    (documentService.downloadDocument as jest.Mock).mockResolvedValue('blob:mock-url');
    // Silence workflow logging noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // jsdom lacks these APIs used by the preview PDF viewer
    if (!global.URL.createObjectURL) {
      // @ts-expect-error - jsdom stub
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    }
    if (!global.URL.revokeObjectURL) {
      // @ts-expect-error - jsdom stub
      global.URL.revokeObjectURL = jest.fn();
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not block on a stray space in State 2 and advances to preview (2.1, 2.3)', async () => {
    const user = userEvent.setup();
    render(<ManualEntryHarness />);

    await fillRequiredFields(user);

    // Leave a stray space in State 2, then blur (onBlur validation fires)
    const state2 = screen.getByLabelText(/state \(box 13\)/i, { selector: '#state2' });
    await user.type(state2, ' ');
    await user.tab();

    // No inline State 2 validation error should be present
    expect(screen.queryByText(/state must be a 2-letter code/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generate preview/i }));

    // Form advances to the preview step
    await waitFor(() => {
      expect(screen.getByTestId('preview-mode-marker')).toBeInTheDocument();
    });

    // Submission went through and the whitespace State 2 value was trimmed to ''
    expect(documentService.generateDocument).toHaveBeenCalledTimes(1);
    const submitted = (documentService.generateDocument as jest.Mock).mock.calls[0][0];
    expect(submitted.formData.state2).toBe('');
  });

  it('accepts a complete valid State 2 and submits trimmed values to the document service (3.4, 3.6)', async () => {
    const user = userEvent.setup();
    render(<ManualEntryHarness />);

    await fillRequiredFields(user);

    // Fill a complete, valid State 2 (with surrounding whitespace to prove trimming)
    const state2 = screen.getByLabelText(/state \(box 13\)/i, { selector: '#state2' });
    const stateId2 = screen.getByLabelText(/state id number \(box 14\)/i, {
      selector: '#stateIdentificationNumber2',
    });
    const stateTax2 = screen.getByLabelText(/state tax withheld \(box 15\)/i, {
      selector: '#stateTaxWithheld2',
    });

    await user.type(state2, 'CA');
    await user.type(stateId2, ' 98-7654321 ');
    await user.type(stateTax2, ' 25.00 ');
    await user.tab();

    expect(screen.queryByText(/must be a valid amount/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /generate preview/i }));

    await waitFor(() => {
      expect(screen.getByTestId('preview-mode-marker')).toBeInTheDocument();
    });

    expect(documentService.generateDocument).toHaveBeenCalledTimes(1);
    const submitted = (documentService.generateDocument as jest.Mock).mock.calls[0][0];
    expect(submitted.documentType).toBe('1099-DIV');
    expect(submitted.formData.state2).toBe('CA');
    // trimmed by the schema preprocess step
    expect(submitted.formData.stateIdentificationNumber2).toBe('98-7654321');
    expect(submitted.formData.stateTaxWithheld2).toBe('25.00');
  });

  it('blocks on the invalid required field only when combined with whitespace State 2 (3.1)', async () => {
    const user = userEvent.setup();
    render(<ManualEntryHarness />);

    // Fill all required fields valid EXCEPT payer TIN (invalid format)
    const taxYear = screen.getByLabelText(/tax year/i);
    await user.clear(taxYear);
    await user.type(taxYear, '2024');
    await user.type(screen.getByLabelText(/payer name/i), 'Example Investment Corp');
    await user.type(screen.getByLabelText(/payer tin/i), 'not-a-tin');
    await user.type(screen.getByLabelText(/recipient name/i), 'John Doe');
    await user.type(screen.getByLabelText(/recipient tin/i), '123-45-6789');
    await user.type(screen.getByLabelText(/total ordinary dividends/i), '1000.00');

    // Whitespace-only State 2 field
    const state2 = screen.getByLabelText(/state \(box 13\)/i, { selector: '#state2' });
    await user.type(state2, ' ');
    await user.tab();

    await user.click(screen.getByRole('button', { name: /generate preview/i }));

    // Submission is blocked -> no API call, no preview
    await waitFor(() => {
      expect(screen.getByText(/payer tin must be in format/i)).toBeInTheDocument();
    });
    expect(documentService.generateDocument).not.toHaveBeenCalled();
    expect(screen.queryByTestId('preview-mode-marker')).not.toBeInTheDocument();

    // The block is on the required field, not on State 2
    expect(screen.queryByText(/state must be a 2-letter code/i)).not.toBeInTheDocument();
  });
});
