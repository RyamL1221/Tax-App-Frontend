import { redirect } from 'next/navigation';
import LoginPageClient from './LoginPageClient';

/**
 * Server Component: Login Page
 * 
 * This is the main login page route that handles:
 * - Session checking on the server
 * - Redirecting authenticated users
 * - Rendering the client-side login form
 * 
 * Requirements:
 * - 8.3: Redirect authenticated users to the dashboard
 * - 8.4: Handle expired sessions
 * 
 * @returns Login page or redirects to dashboard if authenticated
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; expired?: string };
}) {
  // Check for existing valid session
  const { getSession, clearSession } = await import('@/lib/session');
  const sessionData = await getSession();

  // If user has a valid session, redirect to authenticated area
  // Requirement 8.3: Valid session triggers redirect
  if (sessionData) {
    const redirectUrl = searchParams.callbackUrl || '/dashboard';
    redirect(redirectUrl);
  }

  // If we reach here, either no session exists or it was expired
  // Expired sessions are automatically handled by getSession returning null
  // Requirement 8.4: Expired session cleanup happens in getSession validation

  // Render the client-side login page
  // Pass expired parameter to show session expiration message
  return <LoginPageClient 
    callbackUrl={searchParams.callbackUrl}
    expired={searchParams.expired === 'true'}
  />;
}

/**
 * Metadata for the login page
 */
export const metadata = {
  title: 'Sign In | Tax App',
  description: 'Sign in to your Tax App account to access your tax preparation dashboard.',
};
