/**
 * TEST ENDPOINT - Remove in production!
 * Creates a dummy session for testing the dashboard
 */

import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';

export async function GET() {
  try {
    // Create a dummy session
    await createSession('test-user-123', 'test@example.com');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test session created! You can now access /dashboard',
      user: {
        userId: 'test-user-123',
        email: 'test@example.com'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create session' 
    }, { status: 500 });
  }
}
