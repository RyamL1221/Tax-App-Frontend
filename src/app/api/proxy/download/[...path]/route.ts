/**
 * Proxy API Route for Document Downloads
 * 
 * This route acts as a proxy between the frontend and backend to bypass CORS issues.
 * It forwards authenticated requests to the backend and streams the PDF response back.
 * 
 * Why this is needed:
 * - The backend at http://127.0.0.1:3000 doesn't have CORS headers configured
 * - Direct fetch from browser is blocked by CORS policy
 * - This proxy runs on the Next.js server (same origin as frontend)
 * - Browser sees same-origin request, no CORS issues
 * 
 * Flow:
 * 1. Frontend makes request to /api/proxy/download/[path]
 * 2. This route extracts JWT token from Authorization header
 * 3. Makes request to backend with JWT token
 * 4. Streams PDF response back to frontend
 * 
 * Requirements: CORS workaround for PDF downloads
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the full path from the dynamic route
    const path = params.path.join('/');
    
    // Get the Authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    console.log('[Proxy] Request received for path:', path);
    console.log('[Proxy] Authorization header present:', !!authHeader);
    console.log('[Proxy] Authorization header (first 20 chars):', authHeader?.substring(0, 20));
    
    if (!authHeader) {
      console.log('[Proxy] No authorization header, returning 401');
      return NextResponse.json(
        { error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    // Build the backend URL
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
    const downloadUrl = `${backendUrl}/documents/download/${path}`;
    
    console.log('[Proxy] Forwarding request to backend:', downloadUrl);

    // Make request to backend with JWT token
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/pdf'
      }
    });
    
    console.log('[Proxy] Backend response status:', response.status);

    console.log('[Proxy] Backend response status:', response.status);

    // Handle errors from backend
    if (!response.ok) {
      const errorText = await response.text();
      console.log('[Proxy] Backend error response:', errorText);
      let errorMessage = 'Failed to download document';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      console.log('[Proxy] Returning error to frontend:', errorMessage, 'Status:', response.status);

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
    
    console.log('[Proxy] Successfully received PDF from backend, streaming to frontend');

    // Get the PDF blob from backend
    const blob = await response.blob();
    
    // Stream the PDF back to the frontend
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="form-1099-DIV.pdf"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('[Proxy] Error downloading document:', error);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
