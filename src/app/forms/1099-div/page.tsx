import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Form1099DivClient from './Form1099DivClient';
import { FormAuthGuard } from '@/components/auth/FormAuthGuard';

/**
 * 1099-DIV Form Page
 * 
 * Server component that handles authentication verification and renders
 * the 1099-DIV form interface for authenticated users.
 * 
 * This page:
 * - Verifies user authentication via session
 * - Redirects to login if not authenticated
 * - Uses FormAuthGuard to ensure JWT token is available
 * - Passes JWT token to client component for API calls
 * - Renders the Form1099DivClient component for form workflow
 * 
 * Requirements: 1.1, 3.5, 4.1 (debug-form-logout-issue)
 */
export default async function Form1099DivPage() {
  // Server-side session verification
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Note: JWT token is stored in localStorage (client-side only)
  // The client component will retrieve it using tokenManager.getToken()
  // We pass null here since server components cannot access localStorage
  const token = null;

  // Render the form client component wrapped in FormAuthGuard
  // FormAuthGuard ensures JWT token is available before rendering the form
  // This prevents the logout issue where users have valid sessions but missing JWT tokens
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

          {/* Form Client Component wrapped in FormAuthGuard */}
          <FormAuthGuard>
            <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
              <Form1099DivClient initialToken={token} />
            </div>
          </FormAuthGuard>
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
