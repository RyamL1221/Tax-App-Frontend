/**
 * useCsvUpload Hook - CSV Upload Workflow State Machine
 *
 * Manages the state machine for the CSV upload workflow:
 *   idle → uploading → results (on success) or idle with error (on failure)
 *   results → idle (on reset)
 *
 * Handles authentication checks, error classification (401/400/500/network),
 * retry logic, and login redirect on session expiration.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { csvUploadService } from '@/lib/api/csvUploadService';
import type { CsvUploadResult } from '@/lib/api/csvUploadService';
import { hasToken } from '@/lib/api/tokenManager';

/**
 * Return type for useCsvUpload hook
 */
export interface UseCsvUploadReturn {
  /** Current state: idle, uploading, or results */
  state: 'idle' | 'uploading' | 'results';
  /** Selected file */
  selectedFile: File | null;
  /** Upload result data */
  result: CsvUploadResult | null;
  /** Error message if any */
  error: string | null;
  /** Whether retry is available */
  canRetry: boolean;
  /** Set the selected file */
  setSelectedFile: (file: File | null) => void;
  /** Trigger the upload */
  handleUpload: () => Promise<void>;
  /** Retry the last failed upload */
  handleRetry: () => Promise<void>;
  /** Reset to idle for a new upload */
  handleReset: () => void;
}

/**
 * Custom hook for managing CSV upload workflow.
 *
 * @returns Object containing state and handlers for the upload workflow
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */
export function useCsvUpload(): UseCsvUploadReturn {
  const router = useRouter();

  const [state, setState] = useState<'idle' | 'uploading' | 'results'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<CsvUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  /**
   * Perform the upload for a given file.
   * Shared logic used by both handleUpload and handleRetry.
   */
  const performUpload = useCallback(async (file: File): Promise<void> => {
    // Check authentication before uploading (Requirement 4.4)
    if (!hasToken('CsvUpload')) {
      setError('Your session has expired. Please log in again.');
      setCanRetry(false);
      setState('idle');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      return;
    }

    setState('uploading');
    setError(null);
    setCanRetry(false);

    try {
      const uploadResult = await csvUploadService.uploadCsv(file);
      setResult(uploadResult);
      setState('results');
    } catch (err: unknown) {
      console.error('[CsvUpload] Upload error:', err);
      setState('idle');

      if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
        const apiError = err as { status: number; message: string };

        // 401 - session expired, redirect to login (Requirement 4.5)
        if (apiError.status === 401) {
          setError('Your session has expired. Please log in again.');
          setCanRetry(false);
          setTimeout(() => {
            router.push('/login');
          }, 1500);
          return;
        }

        // 400 - validation error from backend (Requirement 4.6)
        if (apiError.status === 400) {
          setError(apiError.message || 'Validation error. Please check your CSV file and try again.');
          setCanRetry(false);
          return;
        }

        // 500 - server error with retry (Requirement 4.7)
        if (apiError.status === 500) {
          setError('Server error. Please try again later.');
          setCanRetry(true);
          return;
        }

        // Network error (status 0) or timeout (504) - show retry (Requirement 4.8)
        if (apiError.status === 0 || apiError.status === 504) {
          setError(apiError.message || 'Unable to connect. Please check your internet connection and try again.');
          setCanRetry(true);
          return;
        }

        // Other errors
        setError(apiError.message || 'An unexpected error occurred. Please try again.');
        setCanRetry(true);
      } else if (err instanceof Error) {
        setError(err.message || 'An unexpected error occurred. Please try again.');
        setCanRetry(true);
      } else {
        setError('An unexpected error occurred. Please try again.');
        setCanRetry(true);
      }
    }
  }, [router]);

  /**
   * Handle upload of the currently selected file.
   * Requirement 4.1: disabled when no file selected (enforced here as a guard)
   * Requirement 4.3: sends file via csvUploadService
   */
  const handleUpload = useCallback(async (): Promise<void> => {
    if (!selectedFile) {
      return;
    }
    await performUpload(selectedFile);
  }, [selectedFile, performUpload]);

  /**
   * Retry the last upload with the same selected file.
   */
  const handleRetry = useCallback(async (): Promise<void> => {
    if (!selectedFile) {
      setError('No file selected. Please select a CSV file and try again.');
      return;
    }
    await performUpload(selectedFile);
  }, [selectedFile, performUpload]);

  /**
   * Reset to idle state for a new upload.
   */
  const handleReset = useCallback((): void => {
    setState('idle');
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setCanRetry(false);
  }, []);

  return {
    state,
    selectedFile,
    result,
    error,
    canRetry,
    setSelectedFile,
    handleUpload,
    handleRetry,
    handleReset,
  };
}
