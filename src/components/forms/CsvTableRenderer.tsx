'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CsvTableRendererProps {
  /** Parsed CSV data: first row = headers, rest = data rows */
  data: string[][];
  /** Caption text identifying the asset */
  caption: string;
  className?: string;
}

/**
 * CsvTableRenderer Component
 *
 * Renders parsed CSV data as an accessible HTML table.
 * The first row is treated as column headers (<thead>),
 * remaining rows as data rows (<tbody>).
 */
export function CsvTableRenderer({ data, caption, className }: CsvTableRendererProps) {
  if (data.length === 0) {
    return (
      <div className={cn('p-4 text-sm text-gray-500', className)} role="status">
        No data
      </div>
    );
  }

  const [headerRow, ...bodyRows] = data;

  return (
    <div className={cn('overflow-auto max-h-[400px]', className)}>
      <table className="min-w-full border-collapse text-sm">
        <caption className="px-4 py-2 text-left text-sm font-medium text-gray-700">
          {caption}
        </caption>
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {headerRow.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bodyRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-2 text-gray-800 whitespace-nowrap"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
