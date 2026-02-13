import LoginPageClient from './LoginPageClient';

/**
 * Server Component: Login Page
 *
 * This is the main login page route that handles:
 * - Rendering the client-side login form
 * - Passing returnUrl/callbackUrl through to the client component
 * - Passing expired flag to show session expiration message
 *
 * Authentication checking and redirect logic is handled by the client component
 * (LoginPageClient) using AuthCoordinator to check for JWT tokens. This ensures
 * consistency with other client-side authentication checks.
 *
 * Requirements (jwt-only-authentication spec):
 * - 2.1: Login page accessible without authentication
 * - 2.1: Redirect to dashboard if already authenticated (handled by client)
 * - 1.1: Use AuthCoordinator.getAuthState() for authentication checks (handled by client)
 * - 5.1: Server components delegate authentication to client components
 *
 * @returns Login page with the login form
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; returnUrl?: string; expired?: string };
}) {
  // Render the client-side login page
  // Authentication checking and redirect logic is handled by the client component
  return (
    <LoginPageClient
      callbackUrl={searchParams.callbackUrl || searchParams.returnUrl}
      expired={searchParams.expired === 'true'}
    />
  );
}

/**
 * Metadata for the login page
 */
export const metadata = {
  title: 'Sign In | Tax App',
  description: 'Sign in to your Tax App account to access your tax preparation dashboard.',
};
