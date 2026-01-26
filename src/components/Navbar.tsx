import { getSession } from '@/lib/session';
import NavbarClient from './NavbarClient';

/**
 * Navbar server component that integrates with the session management system
 * 
 * This server component handles authentication state checking on the server side
 * and passes the session data to the client component for rendering. This approach
 * ensures secure session validation while maintaining optimal performance.
 * 
 * Features:
 * - Server-side session checking using getSession()
 * - Error handling for session retrieval failures
 * - Treats errors as unauthenticated state for graceful degradation
 * - Passes session data to NavbarClient for rendering
 * 
 * Requirements:
 * - 4.3: Query the Authentication_System to determine the current Session state
 * 
 * @example
 * ```tsx
 * // In a layout or page
 * import Navbar from '@/components/Navbar';
 * 
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       <Navbar />
 *       {children}
 *     </>
 *   );
 * }
 * ```
 */
export default async function Navbar() {
  let session = null;

  try {
    // Attempt to retrieve the current session
    session = await getSession();
  } catch (error) {
    // Log error for debugging but treat as unauthenticated state
    console.error('Failed to retrieve session:', error);
    // session remains null, will render unauthenticated state
  }

  return <NavbarClient session={session} />;
}
