'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { parseCsv } from '@/lib/csv';
import { CsvTableRenderer } from './CsvTableRenderer';
import { PdfEmbed } from './PdfEmbed';

export interface InlinePreviewPanelProps {
  /** Unique ID for aria-controls pairing */
  id: string;
  /** Whether the panel is currently expanded */
  isOpen: boolean;
  /** The CloudFront URL to fetch/embed */
  url: string;
  /** Determines which renderer to use */
  assetType: 'csv' | 'pdf';
  /** Human-readable asset name for captions and titles */
  assetName: string;
  className?: string;
}

type PanelState = 'idle' | 'loading' | 'success' | 'error' | 'pdf-ready' | 'pdf-error';

/**
 * InlinePreviewPanel Component
 *
 * Collapsible panel that renders either a CSV table or embedded PDF.
 * Manages loading/error/success states internally via a state machine.
 */
export function InlinePreviewPanel({
  id,
  isOpen,
  url,
  assetType,
  assetName,
  className,
}: InlinePreviewPanelProps) {
  const [state, setState] = useState<PanelState>('idle');
  const [csvData, setCsvData] = useState<string[][] | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchCsv = useCallback(async () => {
    setState('loading');
    setCsvData(null);
    setErrorMessage('');

    try {
      const response = await fetch(url);
      if (!response.ok) {
        setErrorMessage(`Failed to load preview (HTTP ${response.status})`);
        setState('error');
        return;
      }
      const text = await response.text();
      const parsed = parseCsv(text);
      setCsvData(parsed);
      setState('success');
    } catch {
      setErrorMessage('Network error — could not load preview.');
      setState('error');
    }
  }, [url]);

  useEffect(() => {
    if (isOpen && assetType === 'csv') {
      fetchCsv();
    }
    if (isOpen && assetType === 'pdf') {
      setState('pdf-ready');
    }
    if (!isOpen) {
      setState('idle');
    }
  }, [isOpen, assetType, fetchCsv]);

  const handleRetry = useCallback(() => {
    fetchCsv();
  }, [fetchCsv]);

  const handlePdfError = useCallback(() => {
    setState('pdf-error');
  }, []);

  return (
    <div
      id={id}
      role="region"
      hidden={!isOpen}
      className={cn(
        'transition-all duration-300 ease-in-out',
        isOpen ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      <div aria-live="polite">
        {state === 'loading' && (
          <p className="p-4 text-sm text-gray-500">Loading preview...</p>
        )}

        {state === 'error' && (
          <div className="p-4">
            <p className="text-sm text-red-600 mb-2">{errorMessage}</p>
            <button
              type="button"
              onClick={handleRetry}
              className={cn(
                'inline-flex items-center px-3 py-1.5 rounded-md',
                'text-sm font-medium text-blue-600',
                'hover:bg-blue-50 active:bg-blue-100',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'transition-colors duration-200',
              )}
            >
              Retry
            </button>
          </div>
        )}

        {state === 'success' && csvData && (
          <CsvTableRenderer data={csvData} caption={assetName} />
        )}

        {state === 'pdf-ready' && (
          <PdfEmbed
            src={url}
            title={assetName}
            onError={handlePdfError}
          />
        )}

        {state === 'pdf-error' && (
          <div className="p-4">
            <p className="text-sm text-red-600 mb-2">
              Unable to load PDF preview.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center text-sm font-medium text-blue-600',
                'hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              )}
            >
              Open PDF in new tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
