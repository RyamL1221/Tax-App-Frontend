/**
 * Authentication API route handler
 * POST /api/auth/login
 * 
 * Security Features (Requirements 7.1, 7.3):
 * - Only accepts POST requests (GET returns 405)
 * - Returns generic error messages that don't reveal whether email or password was incorrect
 * - Implements rate limiting to prevent brute force attacks
 * - Credentials are transmitted over HTTPS (enforced by Next.js in production)
 * - Passwords are never logged or stored in browser storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation';
import { AuthResponse } from '@/types/auth';

/**
 * Rate limiting storage (in-memory for now)
 * In production, this should use Redis or a database
 */
const rateLimitStore = new Map<string, { attempts: number; windowStart: number }>();

/**
 * Rate limit configuration
 */
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60000; // 60 seconds

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
 * Record a login attempt
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
 * POST handler for login authentication
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
      const response: AuthResponse = {
        success: false,
        error: {
          type: 'rate_limit',
          message: `Too many attempts. Please wait ${rateLimitCheck.remainingTime} seconds before trying again`,
        },
      };
      return NextResponse.json(response, { status: 429 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const response: AuthResponse = {
        success: false,
        error: {
          type: 'validation',
          message: 'Invalid input data',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { email, password } = validationResult.data;

    // Record the attempt
    recordAttempt(ip);

    // TODO: Implement actual authentication logic with database
    // For now, this is a mock implementation for testing session management
    // In production, this would:
    // 1. Query the database for the user by email
    // 2. Verify the password hash using bcrypt or similar
    
    // Mock authentication - accept test@example.com with password "password123"
    const isValidCredentials = email === 'test@example.com' && password === 'password123';

    if (!isValidCredentials) {
      const response: AuthResponse = {
        success: false,
        error: {
          type: 'authentication',
          message: 'Invalid email or password',
        },
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Authentication successful - create session
    // Requirement 8.1, 8.2: Create session token and set HTTP-only cookie
    const { createSession } = await import('@/lib/session');
    await createSession('user-123', email);

    const response: AuthResponse = {
      success: true,
      redirectUrl: '/dashboard',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Login API error:', error);
    
    const response: AuthResponse = {
      success: false,
      error: {
        type: 'network',
        message: 'Something went wrong. Please try again later',
      },
    };

    return NextResponse.json(response, { status: 500 });
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
