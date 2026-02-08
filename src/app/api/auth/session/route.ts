/**
 * Session Check API Route
 * 
 * GET /api/auth/session - Check if user has a valid session
 * 
 * Returns 200 OK if session is valid, 401 Unauthorized if not.
 * Used by AuthCoordinator to check session validity when JWT is missing.
 * 
 * Requirements: 9.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

/**
 * GET /api/auth/session
 * 
 * Check if the current user has a valid session.
 * This endpoint is used by the AuthCoordinator to verify session validity
 * when JWT token is missing or invalid.
 * 
 * @returns 200 OK with session data if valid, 401 Unauthorized if not
 */
export async function GET(request: NextRequest) {
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

    // Session is valid - return success with session data
    return NextResponse.json({
      valid: true,
      userId: session.userId,
      email: session.email,
      expiresAt: session.expiresAt,
    }, { status: 200 });

  } catch (error) {
    console.error('[Session Check] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
