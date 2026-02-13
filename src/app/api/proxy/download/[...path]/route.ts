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
    
    console.log('[Proxy] Download request received', {
      jobId,
      timestamp: new Date().toISOString(),
      method: request.method
    });
    
    // Get the Authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.error('[Proxy] Missing authorization header');
      return NextResponse.json(
        { error: 'Missing authentication token' },
        { status: 401 }
      );
    }
    
    console.log('[Proxy] Authorization header present', {
      hasBearer: authHeader.startsWith('Bearer '),
      tokenLength: authHeader.replace('Bearer ', '').length
    });

    // Build the backend URL using jobId
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const downloadUrl = `${backendUrl}/documents/download/${jobId}`;
    
    console.log('[Proxy] Forwarding to backend', {
      backendUrl,
      downloadUrl,
      hasAuthHeader: !!authHeader,
      timeout: '30s'
    });

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
      
      console.log('[Proxy] Backend response received', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('Content-Type'),
        contentLength: response.headers.get('Content-Length'),
        contentDisposition: response.headers.get('Content-Disposition')
      });

      // Handle errors from backend
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Proxy] Backend error', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        let errorMessage = 'Failed to download document';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: response.status }
        );
      }
      
      console.log('[Proxy] Converting backend response to arrayBuffer');

      // Get the response as text first to check if it's base64 encoded
      const responseText = await response.text();
      
      let arrayBuffer: ArrayBuffer;
      
      // Check if the response is base64 encoded (starts with JVBERi which is "%PDF" in base64)
      if (responseText.startsWith('JVBERi')) {
        console.log('[Proxy] Detected base64-encoded PDF, decoding...');
        // Decode base64 to binary
        const binaryString = atob(responseText);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        console.log('[Proxy] Response is already binary');
        // Convert text back to arrayBuffer (shouldn't happen, but handle it)
        const encoder = new TextEncoder();
        arrayBuffer = encoder.encode(responseText).buffer;
      }
      
      console.log('[Proxy] PDF processed successfully', {
        size: arrayBuffer.byteLength,
        sizeKB: (arrayBuffer.byteLength / 1024).toFixed(2)
      });
      
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
        console.error('[Proxy] Request timeout after 30 seconds');
        return NextResponse.json(
          { error: 'Request timeout. The backend took too long to respond.' },
          { status: 504 }
        );
      }
      
      console.error('[Proxy] Fetch error', {
        error: fetchError.message,
        name: fetchError.name,
        stack: fetchError.stack
      });
      
      throw fetchError;
    }

  } catch (error: any) {
    console.error('[Proxy] Error downloading document', {
      error: error.message || error,
      stack: error.stack
    });
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
