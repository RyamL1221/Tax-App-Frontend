/**
 * ResultsSummary Component
 *
 * Displays total, succeeded, and failed row counts as stat cards
 * with distinct visual indicators (color and icon).
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ResultsSummaryProps {
  totalRows: number;
  succeededRows: number;
  failedRows: number;
  className?: string;
}

export function ResultsSummary({
  totalRows,
  succeededRows,
  failedRows,
  className,
}: ResultsSummaryProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-4', className)}>
      {/* Total Rows - neutral/blue */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 rounded-full bg-blue-100 p-2">
            <svg
              className="h-5 w-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600">Total Rows</p>
            <p className="text-2xl font-bold text-blue-900">{totalRows}</p>
          </div>
        </div>
      </div>

      {/* Succeeded Rows - green with check icon */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 rounded-full bg-green-100 p-2">
            <svg
              className="h-5 w-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-600">Succeeded</p>
            <p className="text-2xl font-bold text-green-900">{succeededRows}</p>
          </div>
        </div>
      </div>

      {/* Failed Rows - red with warning icon */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 rounded-full bg-red-100 p-2">
            <svg
              className="h-5 w-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-red-600">Failed</p>
            <p className="text-2xl font-bold text-red-900">{failedRows}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
