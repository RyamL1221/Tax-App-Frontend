/**
 * CsvUploadService - CSV Upload API methods for bulk 1099-DIV generation
 *
 * This service provides:
 * - Typed interfaces for CSV upload results (CsvUploadResult, CsvUploadRowError, CsvUploadRowSuccess)
 * - A pure `parseCsvUploadResponse` function for validating and parsing backend JSON
 * - A `CsvUploadService` class that sends multipart/form-data uploads with JWT auth and 60s timeout
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4
 */

import { getToken } from './tokenManager';

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Represents a single failed row from the CSV upload response.
 */
export interface CsvUploadRowError {
  /** 1-indexed row number in the CSV file */
  row: number;
  /** Human-readable error description */
  message: string;
}

/**
 * Represents a single successfully processed row from the CSV upload response.
 */
export interface CsvUploadRowSuccess {
  /** 1-indexed row number in the CSV file */
  row: number;
  /** Recipient name from the CSV row (display identifier) */
  recipientName?: string;
  /** Backend job ID for downloading the PDF */
  jobId?: string;
  /** S3 output key for the generated document */
  outputKey?: string;
}

/**
 * Structured result from a CSV upload operation.
 *
 * Invariant: totalRows === succeededRows + failedRows
 */
export interface CsvUploadResult {
  totalRows: number;
  succeededRows: number;
  failedRows: number;
  errors: CsvUploadRowError[];
  successes: CsvUploadRowSuccess[];
}

// ============================================================================
// Response Parser (pure function)
// ============================================================================

/**
 * Parse and validate a raw JSON response into a CsvUploadResult.
 *
 * Validates:
 * - Required fields exist (totalRows, succeededRows, failedRows, errors, successes)
 * - Numeric fields are numbers
 * - totalRows === succeededRows + failedRows
 * - errors is an array of { row: number, message: string }
 * - successes is an array of { row: number } with optional recipientName, jobId, outputKey
 *
 * @param json - The raw parsed JSON value from the backend response
 * @returns A validated CsvUploadResult
 * @throws Error with a descriptive message if the structure is invalid
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
export function parseCsvUploadResponse(json: unknown): CsvUploadResult {
  if (json === null || json === undefined || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('Invalid CSV upload response: expected a JSON object');
  }

  const obj = json as Record<string, unknown>;

  // ---------------------------------------------------------------------------
  // Handle HTTP 202 async response (large uploads >10 rows)
  // Backend returns { importJobId, status: "PENDING", message } with no row counts
  // ---------------------------------------------------------------------------
  if (obj.status === 'PENDING' && typeof obj.importJobId === 'string') {
    return {
      totalRows: 0,
      succeededRows: 0,
      failedRows: 0,
      errors: [],
      successes: [],
    };
  }

  // ---------------------------------------------------------------------------
  // Normalize backend field names to frontend field names
  // Backend returns: total, succeeded, failed, results
  // Frontend expects: totalRows, succeededRows, failedRows, errors, successes
  // ---------------------------------------------------------------------------
  if (obj.total !== undefined && obj.totalRows === undefined) {
    obj.totalRows = obj.total;
  }
  if (obj.succeeded !== undefined && obj.succeededRows === undefined) {
    obj.succeededRows = obj.succeeded;
  }
  if (obj.failed !== undefined && obj.failedRows === undefined) {
    obj.failedRows = obj.failed;
  }
  if (Array.isArray(obj.results) && !Array.isArray(obj.errors)) {
    // Split results into errors and successes based on status
    const results = obj.results as Record<string, unknown>[];
    obj.errors = results
      .filter((r) => r.status !== 'succeeded')
      .map((r) => ({
        row: r.row,
        message: r.message || r.error || `Row ${r.row} failed`,
      }));
    obj.successes = results
      .filter((r) => r.status === 'succeeded')
      .map((r) => ({
        row: r.row,
        recipientName: r.recipientName,
        jobId: r.jobId,
        outputKey: r.outputKey,
      }));
  }

  // Validate required numeric fields
  if (typeof obj.totalRows !== 'number') {
    throw new Error('Invalid CSV upload response: totalRows must be a number');
  }
  if (typeof obj.succeededRows !== 'number') {
    throw new Error('Invalid CSV upload response: succeededRows must be a number');
  }
  if (typeof obj.failedRows !== 'number') {
    throw new Error('Invalid CSV upload response: failedRows must be a number');
  }

  const totalRows = obj.totalRows as number;
  const succeededRows = obj.succeededRows as number;
  const failedRows = obj.failedRows as number;

  // Validate totalRows invariant
  if (totalRows !== succeededRows + failedRows) {
    throw new Error(
      `Invalid CSV upload response: totalRows (${totalRows}) must equal succeededRows (${succeededRows}) + failedRows (${failedRows})`
    );
  }

  // Validate errors array
  if (!Array.isArray(obj.errors)) {
    throw new Error('Invalid CSV upload response: errors must be an array');
  }

  const errors: CsvUploadRowError[] = (obj.errors as unknown[]).map((item, index) => {
    if (item === null || item === undefined || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Invalid CSV upload response: errors[${index}] must be an object`);
    }
    const errorObj = item as Record<string, unknown>;
    if (typeof errorObj.row !== 'number') {
      throw new Error(`Invalid CSV upload response: errors[${index}].row must be a number`);
    }
    if (typeof errorObj.message !== 'string') {
      throw new Error(`Invalid CSV upload response: errors[${index}].message must be a string`);
    }
    return {
      row: errorObj.row as number,
      message: errorObj.message as string,
    };
  });

  // Validate successes array
  if (!Array.isArray(obj.successes)) {
    throw new Error('Invalid CSV upload response: successes must be an array');
  }

  const successes: CsvUploadRowSuccess[] = (obj.successes as unknown[]).map((item, index) => {
    if (item === null || item === undefined || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Invalid CSV upload response: successes[${index}] must be an object`);
    }
    const successObj = item as Record<string, unknown>;
    if (typeof successObj.row !== 'number') {
      throw new Error(`Invalid CSV upload response: successes[${index}].row must be a number`);
    }

    const result: CsvUploadRowSuccess = {
      row: successObj.row as number,
    };

    if (successObj.recipientName !== undefined) {
      if (typeof successObj.recipientName !== 'string') {
        throw new Error(`Invalid CSV upload response: successes[${index}].recipientName must be a string`);
      }
      result.recipientName = successObj.recipientName as string;
    }

    if (successObj.jobId !== undefined) {
      if (typeof successObj.jobId !== 'string') {
        throw new Error(`Invalid CSV upload response: successes[${index}].jobId must be a string`);
      }
      result.jobId = successObj.jobId as string;
    }

    if (successObj.outputKey !== undefined) {
      if (typeof successObj.outputKey !== 'string') {
        throw new Error(`Invalid CSV upload response: successes[${index}].outputKey must be a string`);
      }
      result.outputKey = successObj.outputKey as string;
    }

    return result;
  });

  return {
    totalRows,
    succeededRows,
    failedRows,
    errors,
    successes,
  };
}

// ============================================================================
// Service Class
// ============================================================================

/**
 * CsvUploadService handles uploading CSV files for bulk 1099-DIV generation.
 *
 * - Builds FormData with the file attached
 * - Sends POST to ${NEXT_PUBLIC_API_URL}/documents/import/1099-div with JWT Authorization header
 * - Uses AbortController with a 60-second timeout
 * - Parses and validates the response via parseCsvUploadResponse
 * - Throws { status, message } for non-OK responses
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export class CsvUploadService {
  /**
   * Upload a CSV file for bulk 1099-DIV generation.
   *
   * @param file - The CSV File to upload
   * @returns A validated CsvUploadResult
   * @throws {{ status: number; message: string }} for non-OK responses, timeouts, or network errors
   */
  async uploadCsv(file: File): Promise<CsvUploadResult> {
    const token = getToken();

    const formData = new FormData();
    formData.append('file', file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/import/1099-div`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let message = 'An unexpected error occurred. Please try again.';
        try {
          const body = await response.json();
          message = body.message || body.error || message;
        } catch {
          // Response body is not JSON
        }
        throw { status: response.status, message };
      }

      const json = await response.json();
      return parseCsvUploadResponse(json);
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error?.name === 'AbortError') {
        throw { status: 504, message: 'Request timeout. Please try again.' };
      }

      // Re-throw structured errors (already have status + message)
      if (typeof error === 'object' && error !== null && 'status' in error && 'message' in error) {
        throw error;
      }

      // Network or unknown error
      throw {
        status: 0,
        message: 'Unable to connect. Please check your internet connection.',
      };
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/** Singleton CsvUploadService instance */
export const csvUploadService = new CsvUploadService();
