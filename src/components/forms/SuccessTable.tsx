/**
 * SuccessTable Component
 *
 * Renders a semantic table of successfully processed CSV upload rows,
 * showing an identifier (recipientName or row number) and a download action.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 10.7
 */

'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { CsvUploadRowSuccess } from '@/lib/api/csvUploadService';

export interface SuccessTableProps {
  successes: CsvUploadRowSuccess[];
  onDownload: (jobId: string) => Promise<void>;
  className?: string;
}

export function SuccessTable({ successes, onDownload, className }: SuccessTableProps) {
  const [loadingJobs, setLoadingJobs] = useState<Record<string, boolean>>({});
  const [errorJobs, setErrorJobs] = useState<Record<string, string>>({});

  const handleDownload = useCallback(
    async (jobId: string) => {
      setLoadingJobs((prev) => ({ ...prev, [jobId]: true }));
      setErrorJobs((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });

      try {
        await onDownload(jobId);
      } catch {
        setErrorJobs((prev) => ({ ...prev, [jobId]: 'Download failed' }));
      } finally {
        setLoadingJobs((prev) => ({ ...prev, [jobId]: false }));
      }
    },
    [onDownload]
  );

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-green-200', className)}>
      <table className="min-w-full divide-y divide-green-200">
        <thead className="bg-green-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-sm font-semibold text-green-700"
            >
              Recipient / Row
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-sm font-semibold text-green-700"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-green-100 bg-white">
          {successes.map((success, index) => {
            const identifier = success.recipientName || `Row ${success.row}`;
            const isLoading = success.jobId ? loadingJobs[success.jobId] : false;
            const error = success.jobId ? errorJobs[success.jobId] : undefined;

            return (
              <tr key={`${success.row}-${index}`} className="hover:bg-green-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-green-800">
                  {identifier}
                </td>
                <td className="px-4 py-3 text-sm text-green-700">
                  {success.jobId ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(success.jobId!)}
                        disabled={isLoading}
                        aria-label={`Download PDF for ${identifier}`}
                        aria-busy={isLoading}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                          'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                          isLoading && 'cursor-not-allowed opacity-60'
                        )}
                      >
                        {isLoading ? (
                          <svg
                            className="h-4 w-4 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        )}
                        {isLoading ? 'Downloading…' : 'Download'}
                      </button>
                      {error && (
                        <span className="text-xs text-red-600" role="alert">
                          {error}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
