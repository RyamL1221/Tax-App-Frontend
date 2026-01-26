'use client';

import Link from 'next/link';
import { SessionData } from '@/lib/session';

/**
 * Props for the NavbarClient component
 */
export interface NavbarClientProps {
  /**
   * Current user session data, or null if unauthenticated
   */
  session: SessionData | null;
}

/**
 * NavbarClient component that renders navigation links based on authentication state
 * 
 * This client component displays different navigation options depending on whether
 * the user is authenticated or not. It integrates with the Next.js session management
 * system to provide appropriate navigation for each user state.
 * 
 * Features:
 * - Always displays Home link
 * - Shows Login and Register links for unauthenticated users
 * - Shows Dashboard link for authenticated users
 * - Uses Next.js Link component for client-side navigation
 * - Keyboard accessible navigation
 * 
 * Requirements:
 * - 1.1: Display Home navigation link
 * - 2.1: Display Login link when unauthenticated
 * - 2.2: Display Register link when unauthenticated
 * - 2.3: Display Home link when unauthenticated
 * - 3.1: Do NOT display Login link when authenticated
 * - 3.2: Do NOT display Register link when authenticated
 * - 3.3: Display Home link when authenticated
 * - 3.4: Display account access options when authenticated
 * 
 * @example
 * ```tsx
 * // Unauthenticated user
 * <NavbarClient session={null} />
 * ```
 * 
 * @example
 * ```tsx
 * // Authenticated user
 * <NavbarClient session={{ userId: '123', email: 'user@example.com', createdAt: 1234567890, expiresAt: 1234567890 }} />
 * ```
 */
export default function NavbarClient({ session }: NavbarClientProps): JSX.Element {
  const isAuthenticated = session !== null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand and Home Link */}
          <div className="flex items-center flex-shrink-0">
            <Link 
              href="/" 
              className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200"
            >
              Home
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {!isAuthenticated && (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors duration-200 font-medium"
                >
                  Register
                </Link>
              </>
            )}

            {isAuthenticated && (
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 sm:px-4 text-sm sm:text-base text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                >
                  Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
