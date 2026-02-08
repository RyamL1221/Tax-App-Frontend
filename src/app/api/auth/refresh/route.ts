/**
 * JWT Refresh API Route
 *
 * POST /api/auth/refresh - Attempt to refresh JWT token from valid session
 *
 * IMPORTANT: The backend API does NOT have a `/auth/refresh` endpoint.
 * The only way to obtain a JWT token is through the `/auth/login` endpoint.
 * A session cookie alone cannot produce a JWT token. This route therefore
 * fails fast with a clear error message rather than making a doomed HTTP
 * call to a non-existent backend endpoint.
 *
 * Callers (e.g., AuthCoordinator) should treat any error from this route
 * as a signal that the user must re-authenticate via the login page.
 *
 * Requirements: 4.1, 4.2, 4.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

/**
 * POST /api/auth/refresh
 *
 * Returns an immediate error because the backend has no refresh endpoint.
 * Session validation is still performed so that callers receive an accurate
 * diagnosis (no session vs. expired session vs. refresh not supported).
 *
 * @returns 501 Not Implemented — refresh is not supported by the backend
 * @returns 401 Unauthorized — no valid session or session expired
 * @returns 500 Internal Server Error — unexpected failure
 */
export async function POST(request: NextRequest) {
  try {
    // Get session from cookies
    const session = await getSession();

    // Check if session exists and has required fields
    if (!session || !session.userId || !session.email) {
      return NextResponse.json(
        { error: 'No valid session' },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (session.expiresAt && session.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // The backend does not expose a /auth/refresh endpoint.
    // A valid session exists but cannot be exchanged for a JWT token.
    // Return 501 to clearly indicate that token refresh is not supported.
    // The user must re-authenticate via /auth/login to obtain a new JWT.
    console.warn('[JWT Refresh] Refresh not supported — backend has no /auth/refresh endpoint', {
      userId: session.userId,
      email: session.email,
    });

    return NextResponse.json(
      { error: 'Token refresh is not supported. Please log in again to obtain a new token.' },
      { status: 501 }
    );

  } catch (error) {
    console.error('[JWT Refresh] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
