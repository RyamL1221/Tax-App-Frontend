/**
 * Logout API route handler
 * POST /api/auth/logout
 * 
 * Requirements:
 * - 1.1: Accessible at /api/auth/logout
 * - 1.2: Invokes clearSession() from session manager
 * - 1.3: Returns 200 status with success message on successful logout
 * - 1.4: Returns 500 status with error message on failure
 * - 1.5: Sets appropriate HTTP headers to clear session cookie
 * - 3.5 (debug-form-logout-issue): Coordinates with AuthCoordinator for synchronized logout
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';
import { logAuthEvent, createAuthState } from '@/lib/auth/AuthLogger';

/**
 * Response type for logout endpoint
 */
interface LogoutResponse {
  success: boolean;
  error?: {
    type: 'network' | 'server';
    message: string;
  };
}

/**
 * POST handler for logout
 * Clears the user session and returns success response
 * Coordinates with client-side AuthCoordinator for synchronized logout
 */
export async function POST(request: NextRequest) {
  try {
    logAuthEvent(
      'Server-side logout initiated',
      'info',
      createAuthState(true, null, null),
      {
        operation: 'logout',
        source: 'logout-api-route',
      }
    );

    // Clear the session cookie
    // Requirement 1.2: Invoke clearSession() from session manager
    await clearSession();

    logAuthEvent(
      'Server-side session cleared successfully',
      'info',
      createAuthState(false, null, null),
      {
        operation: 'logout',
        source: 'logout-api-route',
        sessionCleared: true,
      }
    );

    // Requirement 1.3: Return 200 status with success message
    const response: LogoutResponse = {
      success: true,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Log error for debugging
    logAuthEvent(
      'Server-side logout failed',
      'error',
      createAuthState(false, null, null),
      {
        operation: 'logout',
        source: 'logout-api-route',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    );

    console.error('Logout API error:', error);

    // Requirement 1.4: Return 500 status with error message
    const response: LogoutResponse = {
      success: false,
      error: {
        type: 'server',
        message: 'Failed to log out. Please try again.',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * GET handler - returns 405 Method Not Allowed
 * Only POST requests are accepted for logout
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
