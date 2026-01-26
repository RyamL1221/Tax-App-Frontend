/**
 * Registration API route handler
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting storage (in-memory for now)
 * In production, this should use Redis or a database
 */
const rateLimitStore = new Map<string, { attempts: number; windowStart: number }>();

/**
 * Rate limit configuration
 */
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 900000; // 15 minutes (900 seconds)

/**
 * Check if IP address is rate limited
 */
function checkRateLimit(ip: string): { isLocked: boolean; remainingTime?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    return { isLocked: false };
  }

  // Check if window has expired
  if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.delete(ip);
    return { isLocked: false };
  }

  // Check if rate limit exceeded
  if (record.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.windowStart)) / 1000);
    return { isLocked: true, remainingTime };
  }

  return { isLocked: false };
}

/**
 * Record a registration attempt
 */
function recordAttempt(ip: string): void {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { attempts: 1, windowStart: now });
  } else {
    record.attempts += 1;
  }
}

/**
 * POST handler for user registration
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit
    const rateLimitCheck = checkRateLimit(ip);
    if (rateLimitCheck.isLocked) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many registration attempts. Please wait ${Math.ceil(rateLimitCheck.remainingTime! / 60)} minutes before trying again`,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { fullName, email, password } = body;

    // Basic validation
    if (!fullName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields',
        },
        { status: 400 }
      );
    }

    // Record the attempt
    recordAttempt(ip);

    // TODO: Implement actual registration logic
    // This would typically:
    // 1. Validate email format and password requirements
    // 2. Check if email already exists in database
    // 3. Hash the password
    // 4. Create user record in database
    // 5. Create session token
    // 6. Set HTTP-only cookies

    // Placeholder: Simulate email already exists for testing
    // In production, this would be a database query
    if (email === 'existing@example.com') {
      return NextResponse.json(
        {
          success: false,
          message: 'This email is already registered',
        },
        { status: 409 }
      );
    }

    // Placeholder success response
    // In production, this would create the user and session
    const response = NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        user: {
          email,
          fullName,
        },
      },
      { status: 201 }
    );

    // Set session cookie (placeholder)
    response.cookies.set('session_token', 'placeholder_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Registration API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong. Please try again later',
      },
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
