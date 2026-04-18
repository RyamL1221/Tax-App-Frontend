/**
 * Proxy API Route for CSV Upload
 *
 * Forwards multipart/form-data CSV uploads to the backend to bypass CORS issues.
 * Follows the same proxy pattern as /api/proxy/download/[...path]/route.ts.
 *
 * Flow:
 * 1. Frontend POSTs to /api/proxy/csv-upload with FormData containing the CSV file
 * 2. This route extracts the JWT token from the Authorization header
 * 3. Forwards the FormData to backend /documents/import/1099-div with auth header (60s timeout)
 * 4. Returns the JSON response from backend
 *
 * Error Responses:
 * - 401: Missing authentication token
 * - 504: Backend request timeout (>60 seconds)
 * - 500: Internal server error
 * - Other status codes: Forwarded from backend
 *
 * Requirements: 8.2, 8.3, 4.4, 4.5
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const uploadUrl = `${backendUrl}/documents/import/1099-div`;

    const formData = await request.formData();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let body: Record<string, unknown> = { error: 'An unexpected error occurred' };
        try {
          body = await response.json();
        } catch {
          // Response body is not JSON — keep default
        }

        return NextResponse.json(body, { status: response.status });
      }

      const json = await response.json();
      return NextResponse.json(json);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout. The backend took too long to respond.' },
          { status: 504 }
        );
      }

      throw fetchError;
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
