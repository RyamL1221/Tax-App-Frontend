import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/session
 * 
 * Check if the user has an active session
 * Returns authentication status
 * 
 * Requirements:
 * - 8.4: Validate session and handle expiration
 */
export async function GET() {
  try {
    const { getSession } = await import('@/lib/session');
    const sessionData = await getSession();

    // Check if session is valid and not expired
    if (sessionData) {
      return NextResponse.json({
        authenticated: true,
        session: {
          userId: sessionData.userId,
          email: sessionData.email,
        },
      });
    }

    // No valid session found or session expired
    return NextResponse.json({
      authenticated: false,
    });
  } catch (error) {
    console.error('Session check error:', error);
    
    // Return unauthenticated on error
    return NextResponse.json({
      authenticated: false,
    });
  }
}
