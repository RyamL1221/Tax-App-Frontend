'use client';

import React from 'react';
import { TaxFormSelector } from '@/components/TaxFormSelector';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Client Component: Dashboard Client
 * 
 * This component provides the main dashboard interface with:
 * - Card-based layout for the tax form selector
 * - Page title and description
 * - Responsive design (mobile and desktop)
 * - Error boundary for error handling
 * - Integration with TaxFormSelector component
 * 
 * Requirements:
 * - 1.1: Display tax form selection interface for authenticated users
 * - 5.3: Follow existing React component architecture patterns
 * 
 * @returns Dashboard UI with tax form selector
 */
export default function DashboardClient() {
  return (
    <ErrorBoundary>
      {/* Main container with responsive layout */}
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        {/* 
          Responsive container:
          - Mobile (< 768px): Full width with padding
          - Tablet/Desktop (>= 768px): Fixed max width
        */}
        <div className="w-full max-w-2xl">
          <Card variant="elevated" className="shadow-xl">
            <CardHeader className="space-y-2 text-center pb-6">
              {/* Page Title */}
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Tax Form Dashboard
              </h1>
              
              {/* Page Description */}
              <p className="text-sm text-gray-600 sm:text-base">
                Select a tax form to begin filling out your information
              </p>
            </CardHeader>

            <CardContent className="pb-8">
              {/* Tax Form Selector Component */}
              <TaxFormSelector />
            </CardContent>
          </Card>

          {/* Additional Information Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <a
                href="/help"
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition-colors"
              >
                Visit our help center
              </a>
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
