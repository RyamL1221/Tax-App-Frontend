/**
 * Session Management API Route
 * POST /api/auth/session
 * 
 * Creates a session cookie after successful authentication with the backend.
 * This endpoint is called by the frontend after receiving a JWT token from
 * the external backend API to establish a session cookie for page access control.
 * 
 * Requirements: 3.1 (debug-form-logout-issue)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/session';

/**
 * POST handler for creating a session
 * 
 * Expects a JSON body with:
 * - userId: string
 * - email: string
 * 
 * Returns success status
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userId, email } = body;

    // Validate required fields
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid userId' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid email' },
        { status: 400 }
      );
    }

    // Create session cookie
    await createSession(userId, email);

    return NextResponse.json(
      { success: true, message: 'Session created successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session creation API error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * Reject non-POST requests
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
