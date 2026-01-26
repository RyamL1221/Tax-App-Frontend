import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import RegisterPageClient from './RegisterPageClient';

/**
 * Server Component: Register Page
 * 
 * This is the main registration page route that handles:
 * - Session checking on the server
 * - Redirecting authenticated users
 * - Rendering the client-side registration form
 * 
 * Requirements:
 * - 10.3: Register page accessible at /register route
 * - 10.4: Redirect authenticated users to dashboard
 * 
 * @returns Register page or redirects to dashboard if authenticated
 */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  // Check for existing session token
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token');

  // If user has a valid session, redirect to authenticated area
  // Requirement 10.4: Valid session triggers redirect
  if (sessionToken?.value) {
    // TODO: Validate session token with authentication service
    // For now, we redirect if a session token exists
    const redirectUrl = searchParams.callbackUrl || '/dashboard';
    redirect(redirectUrl);
  }

  // Render the client-side register page
  return <RegisterPageClient callbackUrl={searchParams.callbackUrl} />;
}

/**
 * Metadata for the register page
 * Requirement 10.3: Page metadata with title and description
 */
export const metadata = {
  title: 'Create Account | Tax App',
  description: 'Create a new Tax App account to start your tax preparation journey.',
};
