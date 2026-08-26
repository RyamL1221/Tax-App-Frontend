'use client';

import React from 'react';
import { TaxFormSelector } from '@/components/TaxFormSelector';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LogoutButton } from '@/components/LogoutButton';

/**
 * Client Component: Dashboard Client
 * 
 * This component provides the main dashboard interface with:
 * - Card-based layout for the tax form selector
 * - Page title and description
 * - Logout button in top-right corner
 * - Responsive design (mobile and desktop)
 * - Error boundary for error handling
 * - Integration with TaxFormSelector component
 * 
 * Requirements:
 * - 1.1: Display tax form selection interface for authenticated users
 * - 2.1: Display logout button in CardHeader area
 * - 2.2: Position logout button in top-right corner
 * - 5.3: Follow existing React component architecture patterns
 * 
 * @returns Dashboard UI with tax form selector and logout button
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
            <CardHeader className="space-y-2 pb-6">
              {/* Flex container for title/description and logout button */}
              <div className="flex items-start justify-between gap-4">
                {/* Centered title and description container */}
                <div className="flex-1 text-center">
                  {/* Page Title */}
                  <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    Tax Form Dashboard
                  </h1>
                  
                  {/* Page Description */}
                  <p className="text-sm text-gray-600 sm:text-base mt-2">
                    Select a tax form to begin filling out your information
                  </p>
                </div>
                
                {/* Logout button in top-right corner */}
                <LogoutButton />
              </div>
            </CardHeader>

            <CardContent className="pb-8">
              {/* Tax Form Selector Component */}
              <TaxFormSelector />
            </CardContent>
          </Card>


        </div>
      </div>
    </ErrorBoundary>
  );
}
