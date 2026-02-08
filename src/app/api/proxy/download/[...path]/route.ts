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
 * 1. Frontend makes request to /api/proxy/download/{jobId}
 * 2. This route extracts JWT token from Authorization header
 * 3. Makes request to backend with JWT token (30 second timeout)
 * 4. Streams PDF response back to frontend using arrayBuffer for efficiency
 * 
 * Features:
 * - 30 second timeout for backend requests
 * - Efficient streaming using arrayBuffer instead of blob
 * - Proper cache control headers (no-cache, no-store, must-revalidate)
 * - Content-Length header for better download progress tracking
 * - Timeout error handling with 504 Gateway Timeout status
 * 
 * Error Responses:
 * - 401: Missing authentication token
 * - 504: Backend request timeout (>30 seconds)
 * - 500: Internal server error
 * - Other status codes: Forwarded from backend
 * 
 * Requirements: CORS workaround for PDF downloads
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the jobId from the dynamic route (should be a single UUID)
    const jobId = params.path.join('/');
    
    // Get the Authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    console.log('[Proxy] Request received for jobId:', jobId);
    
    if (!authHeader) {
      console.log('[Proxy] No authorization header, returning 401');
      return NextResponse.json(
        { error: 'Missing authentication token' },
        { status: 401 }
      );
    }

    // Build the backend URL using jobId
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3000';
    const downloadUrl = `${backendUrl}/documents/download/${jobId}`;
    
    console.log('[Proxy] Forwarding request to backend:', downloadUrl);

    // Make request to backend with JWT token and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/pdf'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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

      // Stream the PDF directly without converting to blob first
      // This is more efficient for large files
      const arrayBuffer = await response.arrayBuffer();
      
      // Return the PDF with proper headers
      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="form-1099-DIV.pdf"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Length': arrayBuffer.byteLength.toString()
        }
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[Proxy] Request timeout');
        return NextResponse.json(
          { error: 'Request timeout. The backend took too long to respond.' },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error('[Proxy] Error downloading document:', error);
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
