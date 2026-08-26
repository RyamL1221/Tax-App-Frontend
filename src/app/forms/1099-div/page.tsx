import { Form1099DivMethodSelector } from '@/components/forms/Form1099DivMethodSelector';
import { BlankFormReferenceSection } from '@/components/forms/BlankFormReferenceSection';

/**
 * 1099-DIV Form Page
 *
 * Server component that renders the 1099-DIV form interface with a
 * method selector (CSV Bulk Upload vs Fill Out Form) and an always-visible
 * blank form reference section.
 *
 * The Form1099DivMethodSelector client component handles:
 * - Two-card selection UI for choosing submission method
 * - Content switching between CSV upload and manual form entry
 * - Authentication via FormAuthGuard (for manual entry path)
 *
 * Requirements:
 * - 2.4: Protected pages redirect to login when unauthenticated
 * - 3.3: Form components use FormAuthGuard with JWT validation
 * - 5.1: Server components delegate authentication to client components
 */
export default function Form1099DivPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              1099-DIV Form
            </h1>
            <p className="text-gray-600">
              Complete your Form 1099-DIV for dividends and distributions
            </p>
          </div>

          {/* Method Selector (CSV Bulk Upload / Fill Out Form) */}
          <Form1099DivMethodSelector className="mb-8" />

          {/* Always-visible blank form reference */}
          <BlankFormReferenceSection />
        </div>
      </div>
    </div>
  );
}

/**
 * Metadata for the 1099-DIV form page
 */
export const metadata = {
  title: '1099-DIV Form | Tax App',
  description: 'Complete your 1099-DIV form for dividends and distributions',
};
