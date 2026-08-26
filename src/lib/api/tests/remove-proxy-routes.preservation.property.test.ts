/**
 * Preservation Property Tests - parseCsvUploadResponse Behavior Unchanged
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 *
 * **Property 2: Preservation** - Non-Proxy Functionality Unchanged
 *
 * These tests capture the CURRENT behavior of parseCsvUploadResponse() on UNFIXED code.
 * They must PASS now and continue to pass after the proxy removal fix, proving no regressions
 * to the response parsing logic.
 *
 * Tests:
 *   1. Valid backend responses with total/succeeded/failed/results → valid CsvUploadResult with totalRows === succeededRows + failedRows
 *   2. Invalid inputs (non-objects, missing required fields) → throws an error
 *   3. PENDING async responses with importJobId and status: "PENDING" → zero-count result
 *   4. Invariant enforcement: totalRows !== succeededRows + failedRows → throws
 */

import * as fc from 'fast-check';
import { parseCsvUploadResponse, CsvUploadResult } from '../csvUploadService';

// ============================================================================
// Generators
// ============================================================================

/**
 * Generate a valid backend-shaped result item with a status field.
 * Backend returns results as an array of objects with status, row, message, etc.
 */
const backendResultItemArb = (status: 'succeeded' | 'failed', row: number) =>
  fc.record({
    row: fc.constant(row),
    status: fc.constant(status),
    message: status === 'failed' ? fc.string({ minLength: 1, maxLength: 50 }) : fc.constant(undefined),
    recipientName: status === 'succeeded' ? fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }) : fc.constant(undefined),
    jobId: status === 'succeeded' ? fc.option(fc.uuid(), { nil: undefined }) : fc.constant(undefined),
    outputKey: status === 'succeeded' ? fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }) : fc.constant(undefined),
  });

/**
 * Generate a valid backend-shaped response with total, succeeded, failed, results fields.
 * Ensures total === succeeded + failed and results array has matching counts.
 */
const validBackendResponseArb = fc
  .record({
    succeeded: fc.integer({ min: 0, max: 20 }),
    failed: fc.integer({ min: 0, max: 20 }),
  })
  .chain(({ succeeded, failed }) => {
    const total = succeeded + failed;
    // Build results array: succeeded items first, then failed items
    const succeededItems = Array.from({ length: succeeded }, (_, i) =>
      backendResultItemArb('succeeded', i + 1)
    );
    const failedItems = Array.from({ length: failed }, (_, i) =>
      backendResultItemArb('failed', succeeded + i + 1)
    );
    return fc.tuple(
      fc.constant(total),
      fc.constant(succeeded),
      fc.constant(failed),
      fc.tuple(...(succeededItems.length > 0 ? succeededItems : [fc.constant(undefined)]))
        .map(items => items.filter(Boolean)),
      fc.tuple(...(failedItems.length > 0 ? failedItems : [fc.constant(undefined)]))
        .map(items => items.filter(Boolean))
    );
  })
  .map(([total, succeeded, failed, succeededResults, failedResults]) => ({
    total,
    succeeded,
    failed,
    results: [...succeededResults, ...failedResults],
  }));

/**
 * Generate a PENDING async response shape.
 */
const pendingResponseArb = fc.record({
  importJobId: fc.uuid(),
  status: fc.constant('PENDING' as const),
  message: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

/**
 * Generate invalid inputs that should cause parseCsvUploadResponse to throw.
 */
const invalidInputArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.boolean(),
  fc.integer(),
  fc.string(),
  fc.array(fc.anything()),
);

// ============================================================================
// Tests
// ============================================================================

describe('Preservation: parseCsvUploadResponse Behavior Unchanged', () => {

  /**
   * Property 1: Valid backend responses produce valid CsvUploadResult
   *
   * For all valid backend-shaped responses with total, succeeded, failed, results fields,
   * parseCsvUploadResponse returns a valid CsvUploadResult where
   * totalRows === succeededRows + failedRows.
   *
   * **Validates: Requirements 3.4**
   */
  test('valid backend responses produce CsvUploadResult with totalRows === succeededRows + failedRows', () => {
    fc.assert(
      fc.property(validBackendResponseArb, (backendResponse) => {
        const result = parseCsvUploadResponse(backendResponse);

        // totalRows must equal succeededRows + failedRows
        expect(result.totalRows).toBe(result.succeededRows + result.failedRows);

        // Numeric fields must match the input
        expect(result.totalRows).toBe(backendResponse.total);
        expect(result.succeededRows).toBe(backendResponse.succeeded);
        expect(result.failedRows).toBe(backendResponse.failed);

        // errors and successes must be arrays
        expect(Array.isArray(result.errors)).toBe(true);
        expect(Array.isArray(result.successes)).toBe(true);

        // errors array length should match failed count
        expect(result.errors.length).toBe(backendResponse.failed);
        // successes array length should match succeeded count
        expect(result.successes.length).toBe(backendResponse.succeeded);

        // Each error must have row (number) and message (string)
        for (const err of result.errors) {
          expect(typeof err.row).toBe('number');
          expect(typeof err.message).toBe('string');
        }

        // Each success must have row (number)
        for (const succ of result.successes) {
          expect(typeof succ.row).toBe('number');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Invalid inputs throw an error
   *
   * For all invalid inputs (non-objects, missing required fields),
   * parseCsvUploadResponse throws an error.
   *
   * **Validates: Requirements 3.4**
   */
  test('invalid inputs (non-objects, missing required fields) throw an error', () => {
    fc.assert(
      fc.property(invalidInputArb, (invalidInput) => {
        expect(() => parseCsvUploadResponse(invalidInput)).toThrow();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2b: Objects missing required numeric fields throw an error
   *
   * For objects that have some but not all required fields,
   * parseCsvUploadResponse throws an error.
   *
   * **Validates: Requirements 3.4**
   */
  test('objects missing required numeric fields throw an error', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing totalRows/total
          fc.record({
            succeeded: fc.integer({ min: 0, max: 10 }),
            failed: fc.integer({ min: 0, max: 10 }),
          }).map(({ succeeded, failed }) => ({
            succeeded,
            failed,
            results: [],
          })),
          // Missing succeeded
          fc.record({
            total: fc.integer({ min: 0, max: 10 }),
            failed: fc.integer({ min: 0, max: 10 }),
          }).map(({ total, failed }) => ({
            total,
            failed,
            results: [],
          })),
          // Missing failed
          fc.record({
            total: fc.integer({ min: 0, max: 10 }),
            succeeded: fc.integer({ min: 0, max: 10 }),
          }).map(({ total, succeeded }) => ({
            total,
            succeeded,
            results: [],
          }))
        ),
        (partialInput) => {
          expect(() => parseCsvUploadResponse(partialInput)).toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 3: PENDING async responses return zero-count result
   *
   * For all PENDING async responses with importJobId and status: "PENDING",
   * parseCsvUploadResponse returns a zero-count CsvUploadResult.
   *
   * **Validates: Requirements 3.4, 3.6**
   */
  test('PENDING async responses return zero-count result', () => {
    fc.assert(
      fc.property(pendingResponseArb, (pendingResponse) => {
        const result = parseCsvUploadResponse(pendingResponse);

        expect(result).toEqual({
          totalRows: 0,
          succeededRows: 0,
          failedRows: 0,
          errors: [],
          successes: [],
        });
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 4: Invariant enforcement - totalRows !== succeededRows + failedRows throws
   *
   * parseCsvUploadResponse enforces totalRows === succeededRows + failedRows invariant.
   * When the invariant is violated, it throws an error.
   *
   * **Validates: Requirements 3.4**
   */
  test('totalRows !== succeededRows + failedRows throws an error', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (totalRows, succeededRows, failedRows) => {
          // Only test cases where the invariant is violated
          fc.pre(totalRows !== succeededRows + failedRows);

          const input = {
            totalRows,
            succeededRows,
            failedRows,
            errors: [],
            successes: [],
          };

          expect(() => parseCsvUploadResponse(input)).toThrow(
            /totalRows.*must equal.*succeededRows.*failedRows/
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
