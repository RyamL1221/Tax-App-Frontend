import NavbarClient from './NavbarClient';

/**
 * Navbar server component wrapper
 * 
 * This server component simply renders the NavbarClient component.
 * All authentication logic is handled on the client side using AuthCoordinator,
 * which checks for JWT token presence in localStorage.
 * 
 * Features:
 * - Minimal server component wrapper
 * - Delegates all authentication logic to client component
 * - No session prop passing needed
 * 
 * Requirements:
 * - 1.1: Use AuthCoordinator to determine authentication state
 * - 5.1: Use client-side rendering for authentication-dependent UI
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
export default function Navbar() {
  return <NavbarClient />;
}
