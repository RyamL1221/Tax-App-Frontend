'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { FORM_1099_DIV_URLS } from '@/lib/config/cloudFrontAssets';
import { TemplateLinkPanel, AssetLink } from './TemplateLinkPanel';

export interface BlankFormReferenceSectionProps {
  className?: string;
}

const blankFormLinks: AssetLink[] = [
  {
    label: 'Preview Blank 1099-DIV Form',
    url: FORM_1099_DIV_URLS.blankForm,
    action: 'preview',
    fileName: '1099-DIV.pdf',
    ariaLabel: 'Preview Blank 1099-DIV Form',
    assetType: 'pdf',
    assetId: 'blank-form',
  },
  {
    label: 'Download Blank 1099-DIV Form',
    url: FORM_1099_DIV_URLS.blankForm,
    action: 'download',
    fileName: '1099-DIV.pdf',
    ariaLabel: 'Download Blank 1099-DIV Form',
  },
];

/**
 * BlankFormReferenceSection Component
 *
 * Renders preview/download links for the blank 1099-DIV form.
 * This section is always visible regardless of which submission method
 * (CSV or manual) is selected, providing a reference copy of the form.
 */
export function BlankFormReferenceSection({ className }: BlankFormReferenceSectionProps) {
  return (
    <section className={cn('space-y-3', className)} data-testid="blank-form-reference-section">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Blank 1099-DIV Form</h3>
        <p className="text-sm text-gray-600 mt-1">
          Reference copy of the official 1099-DIV form for your records.
        </p>
      </div>

      <TemplateLinkPanel links={blankFormLinks} />
    </section>
  );
}
