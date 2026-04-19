/**
 * Decodes a base64-encoded PDF response from API Gateway into a Blob.
 *
 * API Gateway returns binary responses with `isBase64Encoded: true`,
 * so the response body is a base64 string rather than raw binary.
 * This function detects base64-encoded content and decodes it,
 * or falls back to using the response as-is if it's already binary.
 *
 * @param response - The fetch Response object
 * @returns A Blob containing the decoded PDF binary data
 */
export async function decodePdfResponse(response: Response): Promise<Blob> {
  const contentType = response.headers.get('Content-Type') || 'application/pdf';

  // Read as text first to check if it's base64-encoded
  const text = await response.text();

  // Base64-encoded PDFs start with "JVBERi" which is "%PDF-" in base64
  if (text.startsWith('JVBERi') || !text.startsWith('%PDF')) {
    // Decode base64 to binary
    const binaryString = atob(text);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: contentType });
  }

  // Already raw binary (unlikely via API Gateway, but handle it)
  const encoder = new TextEncoder();
  return new Blob([encoder.encode(text)], { type: contentType });
}
