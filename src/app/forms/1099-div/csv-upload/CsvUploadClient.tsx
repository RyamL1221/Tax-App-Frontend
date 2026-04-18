/**
 * CsvUploadClient Component
 *
 * Client orchestrator for the CSV upload workflow. Manages view switching
 * between the upload panel (idle/uploading/error) and the import results view.
 *
 * Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7,
 *               3.1, 3.2, 3.3, 3.4, 3.5, 3.6,
 *               10.1, 10.2, 10.3, 10.4, 10.8
 */

'use client';

import React, { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useCsvUpload } from '@/hooks/useCsvUpload';
import { ImportResultsView } from '@/components/forms/ImportResultsView';


export interface CsvUploadClientProps {
  className?: string;
}

export default function CsvUploadClient({ className }: CsvUploadClientProps) {
  const {
    state,
    selectedFile,
    result,
    error,
    canRetry,
    setSelectedFile,
    handleUpload,
    handleRetry,
    handleReset,
  } = useCsvUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setSelectedFile(file);
    },
    [setSelectedFile],
  );

  /**
   * Download a generated PDF via the existing download proxy.
   * Requirement 7.4: use existing document download proxy.
   */
  const handleDownload = useCallback(async (jobId: string) => {
    const downloadUrl = `/api/proxy/download/${jobId}`;
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('jwt_token')
        : null;

    if (!token) {
      throw { status: 401, message: 'Authentication required. Please log in again.' };
    }

    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf',
      },
    });

    if (!response.ok) {
      throw { status: response.status, message: 'Failed to download document' };
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Trigger browser download
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `1099-DIV-${jobId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }, []);

  const isUploading = state === 'uploading';
  const isIdle = state === 'idle';
  const isResults = state === 'results';

  // --- Results view ---
  if (isResults && result) {
    return (
      <div className={cn('w-full', className)}>
        <ImportResultsView
          result={result}
          onReset={handleReset}
          onDownload={handleDownload}
        />
      </div>
    );
  }

  // --- Upload panel (idle / uploading / error) ---
  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* File selector */}
      <div className="space-y-2">
        <label htmlFor="csv-file-input" className="block text-sm font-medium text-gray-700">
          CSV File
        </label>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={onFileChange}
            aria-label="Select a CSV file to upload"
            className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
        </div>
        <p className="text-sm text-gray-500">
          {selectedFile ? selectedFile.name : 'No file chosen'}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{error}</p>
          {canRetry && (
            <button
              type="button"
              onClick={handleRetry}
              className="mt-2 inline-flex items-center rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-800 transition-colors hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
        aria-disabled={!selectedFile || isUploading}
        aria-busy={isUploading}
        className={cn(
          'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          !selectedFile || isUploading
            ? 'cursor-not-allowed bg-blue-300'
            : 'bg-blue-600 hover:bg-blue-700',
        )}
      >
        {isUploading ? 'Uploading…' : 'Upload CSV'}
      </button>
    </div>
  );
}
