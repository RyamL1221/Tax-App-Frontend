/**
 * Bug Condition Exploration Test - CSV Upload Response Parsing and URL Routing
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 *
 * **Property 1: Bug Condition** - CSV Upload Response Parsing and URL Routing
 *
 * **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * **DO NOT attempt to fix the test or the code when it fails**
 * **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
 *
 * **GOAL**: Surface counterexamples that demonstrate the three bug conditions:
 *   1. Response field mismatch: parseCsvUploadResponse() cannot handle backend-shaped responses
 *   2. Direct backend URL: uploadCsv() calls SAM local directly instead of the proxy
 *   3. Wrong proxy path: proxy route forwards to /documents/csv-upload instead of /documents/import/1099-div
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Mock tokenManager before importing the service
jest.mock('../tokenManager', () => ({
  __esModule: true,
  getToken: () => 'mock-jwt-token',
  setToken: () => {},
  clearToken: () => {},
  TOKEN_STORAGE_KEY: 'jwt_token',
}));

// Mock AuthLogger to suppress console output
jest.mock('../../auth/AuthLogger', () => ({
  __esModule: true,
  logTokenOperation: () => {},
}));

// Mock LogoutStateManager
jest.mock('../../auth/LogoutStateManager', () => ({
  __esModule: true,
  logoutStateManager: {
    isLogoutInProgress: () => false,
    getLogoutState: () => 'idle',
    setLogoutInProgress: () => {},
    clearLogoutState: () => {},
  },
}));

import { parseCsvUploadResponse, CsvUploadService } from '../csvUploadService';

describe('Bug Condition Exploration: CSV Upload Response Parsing and URL Routing', () => {

  /**
   * Bug Condition 1: Response Field Mismatch
   *
   * The backend returns { total, succeeded, failed, results } but parseCsvUploadResponse()
   * expects { totalRows, succeededRows, failedRows, errors, successes }.
   *
   * This property generates random valid backend-shaped responses and asserts that
   * parseCsvUploadResponse() returns a valid CsvUploadResult. On unfixed code, this
   * will throw because obj.totalRows is undefined.
   *
   * **Validates: Requirements 1.1**
   */
  test('parseCsvUploadResponse should handle backend-shaped response fields', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100 }).chain((succeeded) =>
          fc.nat({ max: 100 }).chain((failed) =>
            fc.array(
              fc.record({
                row: fc.nat({ max: 1000 }),
                status: fc.constantFrom('success', 'error'),
                message: fc.string(),
                jobId: fc.string(),
              }),
              { minLength: 0, maxLength: 5 }
            ).map((results) => ({
              total: succeeded + failed,
              succeeded,
              failed,
              results,
            }))
          )
        ),
        (backendResponse) => {
          // parseCsvUploadResponse should accept backend-shaped responses
          // and return a valid CsvUploadResult
          const result = parseCsvUploadResponse(backendResponse);

          // Validate the result has the correct shape
          expect(typeof result.totalRows).toBe('number');
          expect(typeof result.succeededRows).toBe('number');
          expect(typeof result.failedRows).toBe('number');
          expect(result.totalRows).toBe(result.succeededRows + result.failedRows);
          expect(Array.isArray(result.errors)).toBe(true);
          expect(Array.isArray(result.successes)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Bug Condition 2: Direct Backend URL
   *
   * uploadCsv() constructs a URL using ${NEXT_PUBLIC_API_URL}/documents/import/1099-div
   * (direct backend) instead of /api/proxy/csv-upload (proxy).
   *
   * This test reads the uploadCsv source code and verifies it uses the proxy URL.
   * On unfixed code, the source will contain the direct backend URL pattern.
   *
   * **Validates: Requirements 1.1**
   */
  test('uploadCsv should use proxy URL instead of direct backend URL', () => {
    const servicePath = path.resolve(
      process.cwd(),
      'src/lib/api/csvUploadService.ts'
    );
    const serviceSource = fs.readFileSync(servicePath, 'utf-8');

    // The uploadCsv method should use the proxy route, NOT the direct backend URL
    // On unfixed code: contains `${apiUrl}/documents/import/1099-div` (direct backend call)
    // On fixed code: contains `/api/proxy/csv-upload` (proxy route) in the fetch call
    // Check that the fetch call uses the proxy URL (look for it in the actual fetch statement)
    expect(serviceSource).toMatch(/fetch\s*\(\s*['"`]\/api\/proxy\/csv-upload['"`]/);
    expect(serviceSource).not.toMatch(/fetch\s*\(\s*`\$\{apiUrl\}\/documents\/import\/1099-div`/);
  });

  /**
   * Bug Condition 3: Wrong Proxy Path
   *
   * The proxy route at src/app/api/proxy/csv-upload/route.ts forwards to
   * /documents/csv-upload (wrong path) instead of /documents/import/1099-div.
   *
   * This test reads the proxy route source file and verifies it contains the
   * correct backend path.
   *
   * **Validates: Requirements 1.2**
   */
  test('proxy route should forward to /documents/import/1099-div', () => {
    const proxyRoutePath = path.resolve(
      process.cwd(),
      'src/app/api/proxy/csv-upload/route.ts'
    );
    const proxyRouteSource = fs.readFileSync(proxyRoutePath, 'utf-8');

    // The proxy route should forward to the correct backend path
    // Check the actual uploadUrl assignment line, not comments
    expect(proxyRouteSource).toMatch(/uploadUrl\s*=\s*`\$\{backendUrl\}\/documents\/import\/1099-div`/);
    // And should NOT have the wrong path in the uploadUrl assignment
    expect(proxyRouteSource).not.toMatch(/uploadUrl\s*=\s*`\$\{backendUrl\}\/documents\/csv-upload`/);
  });
});
