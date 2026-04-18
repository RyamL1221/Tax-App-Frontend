/**
 * ErrorTable Component
 *
 * Renders a semantic table of row-level CSV upload errors,
 * sorted by row number in ascending order.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 10.6
 */

'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { CsvUploadRowError } from '@/lib/api/csvUploadService';

export interface ErrorTableProps {
  errors: CsvUploadRowError[];
  className?: string;
}

export function ErrorTable({ errors, className }: ErrorTableProps) {
  const sortedErrors = useMemo(
    () => [...errors].sort((a, b) => a.row - b.row),
    [errors]
  );

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-red-200', className)}>
      <table className="min-w-full divide-y divide-red-200">
        <thead className="bg-red-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-sm font-semibold text-red-700"
            >
              Row Number
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-sm font-semibold text-red-700"
            >
              Error Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-red-100 bg-white">
          {sortedErrors.map((error, index) => (
            <tr key={`${error.row}-${index}`} className="hover:bg-red-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-red-800">
                {error.row}
              </td>
              <td className="px-4 py-3 text-sm text-red-700">
                {error.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
