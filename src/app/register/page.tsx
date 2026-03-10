import RegisterPageClient from './RegisterPageClient';

/**
 * Server Component: Register Page
 * 
 * This is the main registration page route that handles:
 * - Rendering the client-side registration form
 * - Authentication checking is handled on the client side
 * 
 * Note: Authentication state checking and redirects are now handled
 * by the client component using AuthCoordinator to check for JWT tokens.
 * This ensures consistency with the navbar and other client-side auth checks.
 * 
 * Requirements:
 * - 10.3: Register page accessible at /register route
 * - 10.4: Redirect authenticated users to dashboard (handled by client)
 * 
 * @returns Register page
 */
export default function RegisterPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  // Render the client-side register page
  // Authentication checking and redirect logic is handled by the client component
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
