/**
 * JWT Refresh API Route
 * 
 * POST /api/auth/refresh - Refresh JWT token from valid session
 * 
 * Returns a new JWT token if the user has a valid session.
 * Used by AuthCoordinator when JWT is missing but session exists.
 * 
 * Note: This endpoint calls the backend API to get a fresh JWT token.
 * The backend handles JWT signing with the proper secret.
 * 
 * Requirements: 8.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

/**
 * POST /api/auth/refresh
 * 
 * Generate a new JWT token from the current session by calling the backend.
 * This endpoint is used by the AuthCoordinator to refresh JWT
 * when the token is missing but a valid session exists.
 * 
 * @returns 200 OK with new token if session valid, 401 Unauthorized if not
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

    // Call backend API to get a fresh JWT token
    // The backend will sign the token with the proper secret
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    try {
      const response = await fetch(`${backendUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.userId,
          email: session.email,
        }),
      });

      if (!response.ok) {
        console.error('[JWT Refresh] Backend refresh failed', {
          status: response.status,
        });
        return NextResponse.json(
          { error: 'Failed to refresh token from backend' },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      if (!data.token) {
        console.error('[JWT Refresh] Backend response missing token');
        return NextResponse.json(
          { error: 'Invalid refresh response' },
          { status: 500 }
        );
      }

      console.log('[JWT Refresh] Token refreshed successfully', {
        userId: session.userId,
        email: session.email,
      });

      // Return new token
      return NextResponse.json({
        token: data.token,
        userId: session.userId,
        email: session.email,
      }, { status: 200 });

    } catch (backendError) {
      console.error('[JWT Refresh] Backend call failed:', backendError);
      return NextResponse.json(
        { error: 'Failed to connect to backend' },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('[JWT Refresh] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
