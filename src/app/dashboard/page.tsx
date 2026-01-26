import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import DashboardClient from './DashboardClient';

/**
 * Dashboard Page
 * 
 * Server component that handles authentication verification and renders
 * the dashboard interface for authenticated users.
 * 
 * Requirements:
 * - 1.1: Display dashboard for authenticated users
 * - 1.2: Redirect unauthenticated users to login
 * - 5.1: Utilize existing session management system
 * - 5.4: Accessible at existing dashboard route
 */
export default async function DashboardPage() {
  // Server-side session verification
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Render client component for authenticated users
  return <DashboardClient />;
}

/**
 * Metadata for the dashboard page
 */
export const metadata = {
  title: 'Tax Form Dashboard | Tax App',
  description: 'Select and access tax forms for completion',
};
