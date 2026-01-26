import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/auth/session
 * 
 * Check if the user has an active session
 * Returns authentication status
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');

    // Check if session token exists
    if (sessionToken?.value) {
      // TODO: Validate session token with authentication service
      // For now, we just check if the token exists
      return NextResponse.json({
        authenticated: true,
        session: {
          token: sessionToken.value,
        },
      });
    }

    // No session found
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
