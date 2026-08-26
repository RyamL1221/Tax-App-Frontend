'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { FORM_1099_DIV_URLS } from '@/lib/config/cloudFrontAssets';
import { TemplateLinkPanel, AssetLink } from './TemplateLinkPanel';
import CsvUploadClient from '@/app/forms/1099-div/csv-upload/CsvUploadClient';

export interface CsvUploadSectionProps {
  className?: string;
}

const csvUploadLinks: AssetLink[] = [
  {
    label: 'Preview Simple Template',
    url: FORM_1099_DIV_URLS.simpleCsvTemplate,
    action: 'preview',
    fileName: 'simple-template.csv',
    ariaLabel: 'Preview Simple CSV Template',
    assetType: 'csv',
    assetId: 'simple-csv',
  },
  {
    label: 'Download Simple Template',
    url: FORM_1099_DIV_URLS.simpleCsvTemplate,
    action: 'download',
    fileName: 'simple-template.csv',
    ariaLabel: 'Download Simple CSV Template',
  },
  {
    label: 'Preview Full Template',
    url: FORM_1099_DIV_URLS.fullCsvTemplate,
    action: 'preview',
    fileName: 'full-template.csv',
    ariaLabel: 'Preview Full CSV Template',
    assetType: 'csv',
    assetId: 'full-csv',
  },
  {
    label: 'Download Full Template',
    url: FORM_1099_DIV_URLS.fullCsvTemplate,
    action: 'download',
    fileName: 'full-template.csv',
    ariaLabel: 'Download Full CSV Template',
  },
];

/**
 * CsvUploadSection Component
 *
 * Renders the CSV Bulk Upload section with preview and download links
 * for Simple CSV Template and Full CSV Template.
 * All links are static CloudFront URLs — no backend calls involved.
 */
export function CsvUploadSection({ className }: CsvUploadSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">CSV Bulk Upload</h2>
        <p className="text-sm text-gray-600 mt-1">
          Download a CSV template, fill in your data, and upload it to generate 1099-DIV forms in bulk.
        </p>
      </div>

      <TemplateLinkPanel links={csvUploadLinks} />

      {/* CSV Upload Interface */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <CsvUploadClient />
      </div>
    </section>
  );
}
