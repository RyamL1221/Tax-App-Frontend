import CsvUploadClient from './CsvUploadClient';
import { FormAuthGuard } from '@/components/auth/FormAuthGuard';

/**
 * 1099-DIV CSV Upload Page
 *
 * Server component that renders the dedicated CSV upload interface for
 * bulk 1099-DIV form generation. Authentication is handled by the
 * FormAuthGuard client component which verifies JWT token presence
 * before rendering the upload interface.
 *
 * Requirements:
 * - 1.1: Accessible at /forms/1099-div/csv-upload
 * - 1.2: Heading identifies the page as 1099-DIV CSV Upload
 * - 1.3: Descriptive subheading explains the CSV upload purpose
 * - 1.4: Does NOT render any Manual_Entry_Flow components
 * - 1.5: Manual entry flow continues to function at its existing route
 * - 1.6: Requires authentication via FormAuthGuard
 */
export default function CsvUploadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              1099-DIV CSV Upload
            </h1>
            <p className="text-gray-600">
              Upload a CSV file to generate 1099-DIV forms in bulk
            </p>
          </div>

          {/* CSV Upload Client wrapped in FormAuthGuard */}
          <FormAuthGuard>
            <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
              <CsvUploadClient />
            </div>
          </FormAuthGuard>
        </div>
      </div>
    </div>
  );
}

/**
 * Metadata for the 1099-DIV CSV Upload page
 */
export const metadata = {
  title: '1099-DIV CSV Upload | Tax App',
  description: 'Upload a CSV file to generate 1099-DIV forms in bulk',
};
