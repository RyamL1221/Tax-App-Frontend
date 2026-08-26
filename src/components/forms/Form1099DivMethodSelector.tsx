'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { CsvUploadSection } from '@/components/forms/CsvUploadSection';
import { FormAuthGuard } from '@/components/auth/FormAuthGuard';
import Form1099DivClient from '@/app/forms/1099-div/Form1099DivClient';

export type MethodSelection = null | 'csv' | 'manual';

export interface Form1099DivMethodSelectorProps {
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * Form1099DivMethodSelector Component
 *
 * Renders two selectable cards for choosing between CSV Bulk Upload
 * and Fill Out Form workflows for 1099-DIV submission.
 *
 * Cards are interactive, accessible, and keyboard-navigable.
 * Once a method is selected, the unselected card disappears and the
 * corresponding workflow content renders with a "Change method" control.
 */
export function Form1099DivMethodSelector({ className }: Form1099DivMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<MethodSelection>(null);

  const handleSelect = (method: 'csv' | 'manual') => {
    setSelectedMethod(method);
  };

  const handleKeyDown = (method: 'csv' | 'manual') => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(method);
    }
  };

  const handleChangeMethod = () => {
    setSelectedMethod(null);
  };

  // Render selected method content
  if (selectedMethod === 'csv') {
    return (
      <div className={cn('w-full transition-opacity duration-200', className)}>
        <div className="mb-6">
          <button
            type="button"
            onClick={handleChangeMethod}
            className="text-sm text-blue-600 hover:text-blue-800 focus-visible:outline-none focus-visible:underline"
            data-testid="change-method-button"
          >
            &larr; Change method
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mt-2">CSV Bulk Upload</h2>
        </div>
        <CsvUploadSection />
      </div>
    );
  }

  if (selectedMethod === 'manual') {
    return (
      <div className={cn('w-full transition-opacity duration-200', className)}>
        <div className="mb-6">
          <button
            type="button"
            onClick={handleChangeMethod}
            className="text-sm text-blue-600 hover:text-blue-800 focus-visible:outline-none focus-visible:underline"
            data-testid="change-method-button"
          >
            &larr; Change method
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mt-2">Fill Out Form</h2>
        </div>
        <FormAuthGuard>
          <Form1099DivClient initialToken={null} />
        </FormAuthGuard>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Bulk Upload Card */}
        <Card
          variant="elevated"
          role="button"
          tabIndex={0}
          aria-label="Select CSV Bulk Upload method to upload multiple 1099-DIV forms via a CSV file"
          onClick={() => handleSelect('csv')}
          onKeyDown={handleKeyDown('csv')}
          className={cn(
            'cursor-pointer',
            'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'hover:border-blue-300 transition-colors'
          )}
          data-testid="method-card-csv"
        >
          <CardContent className="flex flex-col items-center text-center p-8">
            {/* Spreadsheet/Table Icon */}
            <svg
              className="h-12 w-12 text-blue-600 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 12c.621 0 1.125.504 1.125 1.125m0-2.25c.621 0 1.125.504 1.125 1.125M13.125 12c.621 0 1.125.504 1.125 1.125m-4.5 1.5c0 .621.504 1.125 1.125 1.125M12 15.75c0-.621-.504-1.125-1.125-1.125M12 13.125c0 .621.504 1.125 1.125 1.125M12 15.75c0-.621.504-1.125-1.125-1.125m1.125 0c.621 0 1.125.504 1.125 1.125"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">CSV Bulk Upload</h3>
            <p className="text-sm text-gray-600">
              Upload a CSV file to submit multiple 1099-DIV forms at once.
            </p>
          </CardContent>
        </Card>

        {/* Fill Out Form Card */}
        <Card
          variant="elevated"
          role="button"
          tabIndex={0}
          aria-label="Select Fill Out Form method to manually enter a single 1099-DIV form"
          onClick={() => handleSelect('manual')}
          onKeyDown={handleKeyDown('manual')}
          className={cn(
            'cursor-pointer',
            'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
            'hover:border-blue-300 transition-colors'
          )}
          data-testid="method-card-manual"
        >
          <CardContent className="flex flex-col items-center text-center p-8">
            {/* Pencil/Form Icon */}
            <svg
              className="h-12 w-12 text-blue-600 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fill Out Form</h3>
            <p className="text-sm text-gray-600">
              Manually enter details for a single 1099-DIV form submission.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
