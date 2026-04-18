'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { InlinePreviewPanel } from './InlinePreviewPanel';

export interface AssetLink {
  label: string;
  url: string;
  action: 'preview' | 'download';
  fileName: string;
  ariaLabel: string;
  /** Asset type determines which preview renderer to use */
  assetType?: 'csv' | 'pdf';
  /** Unique identifier for the asset (used for aria-controls/id pairing) */
  assetId?: string;
}

export interface TemplateLinkPanelProps {
  links: AssetLink[];
  className?: string;
}

/**
 * TemplateLinkPanel Component
 *
 * Renders a list of asset links for previewing and downloading templates.
 * Preview actions render as toggle buttons that expand/collapse inline preview panels.
 * Download links remain as standard anchor tags.
 * Links with empty URLs are filtered out. If no links remain, an
 * informational "unavailable" message is displayed.
 */
export function TemplateLinkPanel({ links, className }: TemplateLinkPanelProps) {
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({});

  const visibleLinks = links.filter((link) => link.url !== '');

  const togglePanel = (assetId: string) => {
    setOpenPanels((prev) => ({
      ...prev,
      [assetId]: !prev[assetId],
    }));
  };

  const getHideLabel = (label: string): string => {
    return label.replace(/^Preview\b/, 'Hide');
  };

  if (visibleLinks.length === 0) {
    return (
      <div
        className={cn(
          'bg-yellow-50 border border-yellow-200 rounded-lg p-4',
          className
        )}
        role="status"
      >
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-yellow-800">
            Template resources are temporarily unavailable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul
      className={cn('space-y-2', className)}
      role="list"
    >
      {visibleLinks.map((link) => {
        const isOpen = link.assetId ? !!openPanels[link.assetId] : false;
        const panelId = link.assetId ? `preview-panel-${link.assetId}` : undefined;
        const assetName = link.label.replace(/^Preview\s+/, '');

        return (
          <li key={`${link.action}-${link.fileName}-${link.label}`}>
            {link.action === 'preview' ? (
              <>
                <button
                  type="button"
                  aria-label={link.ariaLabel}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => link.assetId && togglePanel(link.assetId)}
                  className={cn(
                    'inline-flex items-center px-3 py-2 rounded-md',
                    'text-sm font-medium text-blue-600',
                    'hover:bg-blue-50 active:bg-blue-100',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    'transition-colors duration-200'
                  )}
                >
                  {isOpen ? getHideLabel(link.label) : link.label}
                </button>
                {link.assetId && link.assetType && (
                  <InlinePreviewPanel
                    id={panelId!}
                    isOpen={isOpen}
                    url={link.url}
                    assetType={link.assetType}
                    assetName={assetName}
                  />
                )}
              </>
            ) : (
              <a
                href={link.url}
                download={link.fileName}
                aria-label={link.ariaLabel}
                className={cn(
                  'inline-flex items-center px-3 py-2 rounded-md',
                  'text-sm font-medium text-blue-600',
                  'hover:bg-blue-50 active:bg-blue-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'transition-colors duration-200'
                )}
              >
                {link.label}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
