/**
 * LoginFlowTracer - Trace ID management for authentication flow correlation
 * 
 * Generates and manages trace IDs throughout the authentication flow, allowing
 * correlation of operations from login submission through token storage to
 * dashboard authentication check.
 * 
 * Features:
 * - UUID v4 trace ID generation
 * - SessionStorage persistence across page navigation
 * - Trace ID injection into log contexts
 * - Trace lifecycle management (start, get, clear)
 * 
 * Requirements: 5.1, 5.3, 5.5
 */

const TRACE_ID_KEY = 'auth_trace_id' as const;

/**
 * Generate a UUID v4 trace ID
 * @returns A unique trace ID string
 */
function generateTraceId(): string {
  // Simple UUID v4 implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Start a new authentication flow trace
 * Generates a new trace ID and stores it in sessionStorage
 * 
 * @returns The generated trace ID
 * 
 * @example
 * ```typescript
 * const traceId = startTrace();
 * console.log('Starting auth flow:', traceId);
 * ```
 * 
 * Requirements: 5.1
 */
export function startTrace(): string {
  const traceId = generateTraceId();
  
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(TRACE_ID_KEY, traceId);
      console.log('[LoginFlowTracer] Trace started:', traceId);
    }
  } catch (error) {
    console.warn('[LoginFlowTracer] Failed to store trace ID:', error);
  }
  
  return traceId;
}

/**
 * Get the current trace ID from sessionStorage
 * 
 * @returns The current trace ID or null if none exists
 * 
 * @example
 * ```typescript
 * const traceId = getTraceId();
 * if (traceId) {
 *   console.log('Current trace:', traceId);
 * }
 * ```
 * 
 * Requirements: 5.3
 */
export function getTraceId(): string | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(TRACE_ID_KEY);
    }
  } catch (error) {
    console.warn('[LoginFlowTracer] Failed to retrieve trace ID:', error);
  }
  
  return null;
}

/**
 * Clear the current trace ID from sessionStorage
 * Should be called after successful dashboard load
 * 
 * @example
 * ```typescript
 * clearTrace();
 * console.log('Trace cleared');
 * ```
 * 
 * Requirements: 5.5
 */
export function clearTrace(): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(TRACE_ID_KEY);
      console.log('[LoginFlowTracer] Trace cleared');
    }
  } catch (error) {
    console.warn('[LoginFlowTracer] Failed to clear trace ID:', error);
  }
}

/**
 * Inject trace ID into a context object
 * Adds the current trace ID to the provided context if one exists
 * 
 * @param context - The context object to inject trace ID into
 * @returns The context object with trace ID added (if available)
 * 
 * @example
 * ```typescript
 * const context = { operation: 'login', userId: '123' };
 * const enriched = injectTraceId(context);
 * // enriched = { operation: 'login', userId: '123', traceId: 'abc-123' }
 * ```
 * 
 * Requirements: 5.3
 */
export function injectTraceId<T extends object>(context: T): T & { traceId?: string } {
  const traceId = getTraceId();
  
  if (traceId) {
    return { ...context, traceId };
  }
  
  return context;
}

/**
 * Check if a trace is currently active
 * 
 * @returns True if a trace ID exists in sessionStorage
 */
export function hasActiveTrace(): boolean {
  return getTraceId() !== null;
}
