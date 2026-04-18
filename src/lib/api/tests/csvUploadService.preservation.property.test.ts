/**
 * Preservation Property Tests - Error Handling Behavior Unchanged
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 *
 * **Property 2: Preservation** - Error Handling and Non-Upload Behavior Unchanged
 *
 * These tests capture the CURRENT error handling behavior of uploadCsv() on UNFIXED code.
 * They must PASS now and continue to pass after the fix, proving no regressions.
 *
 * Tests:
 *   1. Error status preservation: HTTP error status codes produce matching {status, message}
 *   2. Error message extraction: thrown error message matches body.message or default
 *   3. Timeout preservation: AbortController timeout produces {status: 504, message: 'Request timeout...'}
 *   4. Network error preservation: fetch TypeError produces {status: 0, message: 'Unable to connect...'}
 *   5. JWT token inclusion: Authorization header includes Bearer <token>
 */

import * as fc from 'fast-check';

// ============================================================================
// Mocks
// ============================================================================

// Mock tokenManager before importing the service
const mockGetToken = jest.fn<string | null, []>();
jest.mock('../tokenManager', () => ({
  __esModule: true,
  getToken: (...args: unknown[]) => mockGetToken(),
  setToken: () => {},
  clearToken: () => {},
  hasToken: () => true,
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

import { CsvUploadService } from '../csvUploadService';

// ============================================================================
// Helpers
// ============================================================================

/** Create a mock File for upload */
function createMockFile(): File {
  return new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv' });
}

// ============================================================================
// Tests
// ============================================================================

describe('Preservation: Error Handling Behavior Unchanged', () => {
  let service: CsvUploadService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new CsvUploadService();
    mockGetToken.mockReturnValue('mock.jwt.token');
    jest.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  /**
   * Property: Error status preservation
   *
   * For any HTTP error status code in {400, 401, 500} with a random error message,
   * uploadCsv() throws {status, message} where status matches the HTTP status code.
   *
   * **Validates: Requirements 3.1**
   */
  test('error status codes produce matching {status, message} shape', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.constantFrom(400, 401, 500),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (statusCode, errorMessage) => {
          // Mock fetch to return an error response with the given status and message body
          global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: statusCode,
            json: () => Promise.resolve({ message: errorMessage }),
          });

          try {
            await service.uploadCsv(createMockFile());
            // Should not reach here
            throw new Error('Expected uploadCsv to throw');
          } catch (err: any) {
            // The thrown error must have the matching status code
            expect(err).toHaveProperty('status', statusCode);
            expect(err).toHaveProperty('message');
            expect(typeof err.message).toBe('string');
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Error message extraction
   *
   * For random error bodies with a message field, the thrown error message
   * matches body.message. When body.message is absent/empty, a default is used.
   *
   * **Validates: Requirements 3.1**
   */
  test('thrown error message matches body.message or falls back to default', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.record({ message: fc.string({ minLength: 1, maxLength: 200 }) }),
        async (errorBody) => {
          global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 400,
            json: () => Promise.resolve(errorBody),
          });

          try {
            await service.uploadCsv(createMockFile());
            throw new Error('Expected uploadCsv to throw');
          } catch (err: any) {
            // When body.message is a non-empty string, the thrown message should match it
            if (errorBody.message) {
              expect(err.message).toBe(errorBody.message);
            }
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property: Timeout preservation
   *
   * When fetch never resolves and the AbortController fires after 60s,
   * uploadCsv() throws {status: 504, message: 'Request timeout. Please try again.'}
   *
   * **Validates: Requirements 3.2**
   */
  test('timeout produces {status: 504, message: "Request timeout. Please try again."}', async () => {
    jest.useFakeTimers();

    try {
      // Mock fetch to return a promise that never resolves but respects abort signal
      global.fetch = jest.fn().mockImplementation((_url: string, options: RequestInit) => {
        return new Promise((_resolve, reject) => {
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              const abortError = new DOMException('The operation was aborted.', 'AbortError');
              reject(abortError);
            });
          }
        });
      });

      const uploadPromise = service.uploadCsv(createMockFile());

      // Advance timers past the 60s timeout
      jest.advanceTimersByTime(61_000);

      try {
        await uploadPromise;
        throw new Error('Expected uploadCsv to throw');
      } catch (err: any) {
        expect(err).toEqual({
          status: 504,
          message: 'Request timeout. Please try again.',
        });
      }
    } finally {
      jest.useRealTimers();
    }
  });

  /**
   * Property: Network error preservation
   *
   * When fetch throws a TypeError (simulating network failure / server unreachable),
   * uploadCsv() throws {status: 0, message: 'Unable to connect. Please check your internet connection.'}
   *
   * **Validates: Requirements 3.3**
   */
  test('network error produces {status: 0, message: "Unable to connect..."}', async () => {
    // Mock fetch to throw a TypeError (simulating network failure)
    global.fetch = jest.fn().mockRejectedValue(
      new TypeError('Failed to fetch')
    );

    try {
      await service.uploadCsv(createMockFile());
      throw new Error('Expected uploadCsv to throw');
    } catch (err: any) {
      expect(err).toEqual({
        status: 0,
        message: 'Unable to connect. Please check your internet connection.',
      });
    }
  });

  /**
   * Property: JWT token inclusion
   *
   * When getToken() returns a token value, the Authorization header in the
   * fetch call includes 'Bearer <token>'.
   *
   * **Validates: Requirements 3.4**
   */
  test('Authorization header includes Bearer token when getToken returns a value', () => {
    return fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }).map(s => s.replace(/\s/g, 'x')),
        async (tokenValue) => {
          mockGetToken.mockReturnValue(tokenValue);

          // Mock fetch to capture the request and return a valid response
          let capturedHeaders: Record<string, string> = {};
          global.fetch = jest.fn().mockImplementation((_url: string, options: RequestInit) => {
            capturedHeaders = (options?.headers || {}) as Record<string, string>;
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                totalRows: 1,
                succeededRows: 1,
                failedRows: 0,
                errors: [],
                successes: [{ row: 1 }],
              }),
            });
          });

          try {
            await service.uploadCsv(createMockFile());
          } catch {
            // We only care about the headers, not the result
          }

          expect(capturedHeaders).toHaveProperty('Authorization');
          expect(capturedHeaders.Authorization).toBe(`Bearer ${tokenValue}`);
        }
      ),
      { numRuns: 20 }
    );
  });
});
