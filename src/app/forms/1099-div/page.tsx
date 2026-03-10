import Form1099DivClient from './Form1099DivClient';
import { FormAuthGuard } from '@/components/auth/FormAuthGuard';

/**
 * 1099-DIV Form Page
 * 
 * Server component that renders the 1099-DIV form interface.
 * Authentication is handled by the FormAuthGuard client component which
 * verifies JWT token presence before rendering the form.
 * 
 * This page:
 * - Renders the Form1099DivClient component for form workflow
 * - Uses FormAuthGuard to ensure JWT token is available
 * - Delegates all authentication checks to client-side components
 * 
 * Requirements (jwt-only-authentication spec):
 * - 2.4: Protected pages redirect to login when unauthenticated
 * - 3.3: Form components use FormAuthGuard with JWT validation
 * - 5.1: Server components delegate authentication to client components
 */
export default function Form1099DivPage() {
  // Note: JWT token is stored in localStorage (client-side only)
  // The client component will retrieve it using tokenManager.getToken()
  // We pass null here since server components cannot access localStorage
  const token = null;

  // Render the form client component wrapped in FormAuthGuard
  // FormAuthGuard ensures JWT token is available before rendering the form
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
