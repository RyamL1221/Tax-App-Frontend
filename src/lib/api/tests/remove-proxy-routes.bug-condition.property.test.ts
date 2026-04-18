/**
 * Bug Condition Exploration Test - Proxy Routes Present in Codebase
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 *
 * **Property 1: Bug Condition** - Proxy Routes Present in Codebase
 *
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 *
 * **GOAL**: Surface counterexamples that demonstrate proxy routes are actively used in the codebase.
 * Each test asserts the EXPECTED (fixed) behavior: no proxy references should exist.
 * On unfixed code, these assertions fail, proving the bug condition holds.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Bug Condition Exploration: Proxy Routes Present in Codebase', () => {
  /**
   * Test 1: InlinePreviewPanel should NOT contain /api/proxy/csv in a fetch call
   *
   * On unfixed code, InlinePreviewPanel.tsx fetches CSV previews through
   * `/api/proxy/csv?url=...` instead of fetching the CloudFront URL directly.
   * This proxy route is actively causing 502 errors in production.
   *
   * **Validates: Requirements 1.1**
   */
  test('InlinePreviewPanel.tsx does NOT contain /api/proxy/csv in a fetch call', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/components/forms/InlinePreviewPanel.tsx'
    );
    const source = fs.readFileSync(filePath, 'utf-8');

    // Expected behavior: no proxy URL pattern in the source
    // On unfixed code this WILL fail because the proxy URL is present
    expect(source).not.toMatch(/\/api\/proxy\/csv/);
  });

  /**
   * Test 2: csvUploadService.ts should NOT contain /api/proxy/csv-upload in a fetch call
   *
   * On unfixed code, CsvUploadService.uploadCsv() POSTs to `/api/proxy/csv-upload`
   * instead of directly to `${NEXT_PUBLIC_API_URL}/documents/import/1099-div`.
   *
   * **Validates: Requirements 1.2**
   */
  test('csvUploadService.ts does NOT contain /api/proxy/csv-upload in a fetch call', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/lib/api/csvUploadService.ts'
    );
    const source = fs.readFileSync(filePath, 'utf-8');

    // Expected behavior: no proxy URL pattern in the source
    // On unfixed code this WILL fail because the proxy URL is present
    expect(source).not.toMatch(/\/api\/proxy\/csv-upload/);
  });

  /**
   * Test 3: documentService.ts should NOT contain /api/proxy/download/ in URL construction
   *
   * On unfixed code, DocumentService.downloadDocument() constructs the download URL
   * as `/api/proxy/download/${jobId}` instead of using the direct backend URL.
   *
   * **Validates: Requirements 1.3**
   */
  test('documentService.ts does NOT contain /api/proxy/download/ in URL construction', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/lib/api/documentService.ts'
    );
    const source = fs.readFileSync(filePath, 'utf-8');

    // Expected behavior: no proxy download URL pattern in the source
    // On unfixed code this WILL fail because the proxy URL is present
    expect(source).not.toMatch(/\/api\/proxy\/download\//);
  });

  /**
   * Test 4: CsvUploadClient.tsx should NOT contain /api/proxy/download/ in URL construction
   *
   * On unfixed code, CsvUploadClient.handleDownload() constructs the download URL
   * as `/api/proxy/download/${jobId}` instead of using the direct backend URL.
   *
   * **Validates: Requirements 1.4**
   */
  test('CsvUploadClient.tsx does NOT contain /api/proxy/download/ in URL construction', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/app/forms/1099-div/csv-upload/CsvUploadClient.tsx'
    );
    const source = fs.readFileSync(filePath, 'utf-8');

    // Expected behavior: no proxy download URL pattern in the source
    // On unfixed code this WILL fail because the proxy URL is present
    expect(source).not.toMatch(/\/api\/proxy\/download\//);
  });

  /**
   * Test 5: No proxy route files should exist under src/app/api/proxy/
   *
   * On unfixed code, three proxy route files exist:
   * - src/app/api/proxy/csv/route.ts
   * - src/app/api/proxy/csv-upload/route.ts
   * - src/app/api/proxy/download/[...path]/route.ts
   *
   * **Validates: Requirements 1.5**
   */
  test('no proxy route files exist under src/app/api/proxy/', () => {
    const proxyDir = path.resolve(process.cwd(), 'src/app/api/proxy');

    // Expected behavior: the proxy directory should not exist at all
    // On unfixed code this WILL fail because the directory and files exist
    expect(fs.existsSync(proxyDir)).toBe(false);
  });
});
