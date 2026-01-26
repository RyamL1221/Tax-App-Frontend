import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * Dashboard Page
 * 
 * Protected page that requires authentication.
 * Redirects to login if no valid session exists.
 */
export default async function DashboardPage() {
  // Check for valid session
  const sessionData = await getSession();

  // Redirect to login if not authenticated
  if (!sessionData) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-600 mb-6">
            You are successfully logged in as: <strong>{sessionData.email}</strong>
          </p>
          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Quick Stats
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-600 font-medium">User ID</p>
                  <p className="text-lg font-bold text-blue-900">{sessionData.userId}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-sm text-green-600 font-medium">Session Created</p>
                  <p className="text-lg font-bold text-green-900">
                    {new Date(sessionData.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-md">
                  <p className="text-sm text-purple-600 font-medium">Session Expires</p>
                  <p className="text-lg font-bold text-purple-900">
                    {new Date(sessionData.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Metadata for the dashboard page
 */
export const metadata = {
  title: 'Dashboard | Tax App',
  description: 'Your tax preparation dashboard',
};
