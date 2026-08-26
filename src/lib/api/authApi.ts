/**
 * Standalone Auth API client for forgot/reset password flows
 *
 * Unlike the class-based AuthService (which throws on non-2xx), these functions
 * always resolve with { ok, status, data } so callers can branch on status codes
 * (400, 401, 429, 500) without try/catch.
 *
 * No Authorization header is sent — these endpoints don't require a token.
 * The reset token travels in the request body, not a header.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface AuthApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * Request a password reset email.
 *
 * POST /auth/forgot-password
 * Body: { email }
 *
 * Returns { ok, status, data } regardless of HTTP status.
 */
export async function forgotPassword(email: string): Promise<AuthApiResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

/**
 * Reset the user's password using a token from the reset email.
 *
 * POST /auth/reset-password
 * Body: { token, new_password }  ← snake_case key required by backend
 *
 * Returns { ok, status, data } regardless of HTTP status.
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<AuthApiResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}
