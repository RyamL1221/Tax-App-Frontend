/**
 * Bug Condition Exploration Test - CSV Upload Response Parsing and URL Routing
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.2**
 *
 * **Property 1: Bug Condition** - CSV Upload Response Parsing and URL Routing
 *
 * Tests verify:
 *   1. Response field normalization: parseCsvUploadResponse() handles backend-shaped responses
 *   2. Direct backend URL: uploadCsv() calls the backend directly (not through proxy)
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
   * Bug Condition 2 (Fixed): Direct Backend URL
   *
   * uploadCsv() now constructs a URL using ${NEXT_PUBLIC_API_URL}/documents/import/1099-div
   * (direct backend) instead of /api/proxy/csv-upload (proxy).
   *
   * This test reads the uploadCsv source code and verifies it uses the direct backend URL.
   *
   * **Validates: Requirements 2.2**
   */
  test('uploadCsv should use direct backend URL instead of proxy URL', () => {
    const servicePath = path.resolve(
      process.cwd(),
      'src/lib/api/csvUploadService.ts'
    );
    const serviceSource = fs.readFileSync(servicePath, 'utf-8');

    // The uploadCsv method should use the direct backend URL, NOT the proxy route
    // Fixed code: contains `${process.env.NEXT_PUBLIC_API_URL}/documents/import/1099-div` (direct backend call)
    expect(serviceSource).toMatch(/documents\/import\/1099-div/);
    expect(serviceSource).not.toMatch(/fetch\s*\(\s*['"`]\/api\/proxy\/csv-upload['"`]/);
  });

});
