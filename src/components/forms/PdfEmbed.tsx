'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PdfEmbedProps {
  /** CloudFront URL of the PDF */
  src: string;
  /** Descriptive title for the iframe */
  title: string;
  /** Callback when the iframe fails to load */
  onError?: () => void;
  className?: string;
}

/**
 * PdfEmbed Component
 *
 * Renders a PDF document inline using a browser-native iframe.
 */
export function PdfEmbed({ src, title, onError, className }: PdfEmbedProps) {
  return (
    <iframe
      src={src}
      title={title}
      onError={onError}
      className={cn('w-full min-h-[600px]', className)}
    />
  );
}
