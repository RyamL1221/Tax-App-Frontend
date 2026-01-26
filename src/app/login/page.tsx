import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
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
 * 
 * @returns Login page or redirects to dashboard if authenticated
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  // Check for existing session token
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token');

  // If user has a valid session, redirect to authenticated area
  // Requirement 8.3: Valid session triggers redirect
  if (sessionToken?.value) {
    // TODO: Validate session token with authentication service
    // For now, we redirect if a session token exists
    const redirectUrl = searchParams.callbackUrl || '/dashboard';
    redirect(redirectUrl);
  }

  // Render the client-side login page
  return <LoginPageClient callbackUrl={searchParams.callbackUrl} />;
}

/**
 * Metadata for the login page
 */
export const metadata = {
  title: 'Sign In | Tax App',
  description: 'Sign in to your Tax App account to access your tax preparation dashboard.',
};
