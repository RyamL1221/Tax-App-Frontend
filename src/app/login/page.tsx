import LoginPageClient from './LoginPageClient';

/**
 * Server Component: Login Page
 *
 * This is the main login page route that handles:
 * - Clearing stale session cookies that cannot produce a JWT token
 * - Always rendering the client-side login form
 * - Passing returnUrl/callbackUrl through to the client component
 *
 * The login page never redirects to the dashboard based on a session cookie alone.
 * A session cookie without a JWT is stale because the backend has no /auth/refresh
 * endpoint, so a session cannot independently produce a JWT. The only way to obtain
 * a JWT is through the /auth/login backend endpoint.
 *
 * Requirements:
 * - 1.1: Render login form when session exists but JWT is unobtainable
 * - 1.2: Render login form when no session exists
 * - 1.3: Treat user as unauthenticated when JWT is unobtainable
 * - 2.1: Never redirect back to dashboard without a valid JWT
 * - 2.4: Never redirect to protected route when session exists but no JWT
 * - 3.1: Clear stale session cookie when it cannot produce a JWT
 * - 3.3: Log the clearing action with reason
 * - 5.2: Log reason session was considered insufficient
 * - 5.3: Log session cookie clearing with reason
 *
 * @returns Login page with the login form
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; returnUrl?: string; expired?: string };
}) {
  try {
    const { getSession, clearSession } = await import('@/lib/session');
    const sessionData = await getSession();

    if (sessionData) {
      // Session exists but we cannot obtain a JWT from it (no backend refresh endpoint).
      // Clear the stale session cookie to prevent future unnecessary checks.
      console.log('[LoginPage] Clearing stale session cookie', {
        userId: sessionData.userId,
        reason: 'Session cannot produce JWT token - no backend refresh endpoint',
      });
      try {
        await clearSession();
      } catch (clearError) {
        // Log the error but continue — rendering the login form is more important
        console.error('[LoginPage] Failed to clear stale session cookie', {
          error: clearError instanceof Error ? clearError.message : 'Unknown error',
        });
      }
    }
  } catch (sessionError) {
    // Session operations failed — log and fall through to render the login form
    console.error('[LoginPage] Session check failed, rendering login form', {
      error: sessionError instanceof Error ? sessionError.message : 'Unknown error',
    });
  }

  // Always render the login form — user must authenticate via login to get a JWT
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
