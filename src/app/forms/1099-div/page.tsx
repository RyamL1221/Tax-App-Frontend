import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * 1099-DIV Form Page
 * 
 * Server component that handles authentication verification and renders
 * the 1099-DIV form interface for authenticated users.
 * 
 * Requirements:
 * - 3.2: Route users to appropriate form page after selection
 */
export default async function Form1099DivPage() {
  // Server-side session verification
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Render placeholder content for authenticated users
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">1099-DIV Form</h1>
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-700 mb-4">
            This is a placeholder for the 1099-DIV form (Dividends and Distributions).
          </p>
          <p className="text-gray-600">
            Form filling functionality will be implemented in a future update.
          </p>
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
