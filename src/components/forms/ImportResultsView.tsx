/**
 * ImportResultsView Component
 *
 * Composes ResultsSummary, ErrorTable, and SuccessTable to display
 * the full CSV upload results. Conditionally renders error/success
 * tables based on the result data.
 *
 * Requirements: 5.5, 5.6, 6.5, 7.5, 10.5
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ResultsSummary } from '@/components/forms/ResultsSummary';
import { ErrorTable } from '@/components/forms/ErrorTable';
import { SuccessTable } from '@/components/forms/SuccessTable';
import type { CsvUploadResult } from '@/lib/api/csvUploadService';

export interface ImportResultsViewProps {
  result: CsvUploadResult;
  onReset: () => void;
  onDownload: (jobId: string) => Promise<void>;
  className?: string;
}

export function ImportResultsView({
  result,
  onReset,
  onDownload,
  className,
}: ImportResultsViewProps) {
  return (
    <div aria-live="polite" className={cn('space-y-6', className)}>
      <ResultsSummary
        totalRows={result.totalRows}
        succeededRows={result.succeededRows}
        failedRows={result.failedRows}
      />

      {result.errors.length > 0 && <ErrorTable errors={result.errors} />}

      {result.successes.length > 0 && (
        <SuccessTable successes={result.successes} onDownload={onDownload} />
      )}

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Upload Another File
        </button>
      </div>
    </div>
  );
}
