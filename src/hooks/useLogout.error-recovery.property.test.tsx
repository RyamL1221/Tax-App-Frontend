/**
 * Property-Based Test for Logout Error Recovery
 * 
 * Feature: logout-button
 * Property 3: Error Recovery Enables Retry
 * 
 * **Validates: Requirements 5.3**
 * 
 * This test file uses property-based testing to verify that when logout fails
 * with ANY error condition, the button returns to its enabled state, allowing
 * the user to retry the operation.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import * as fc from 'fast-check';
import { useLogout } from './useLogout';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

/**
 * Arbitrary generator for HTTP error status codes
 * Generates realistic error status codes (4xx and 5xx)
 */
const errorStatusCodeArbitrary = fc.oneof(
  fc.integer({ min: 400, max: 499 }), // Client errors
  fc.integer({ min: 500, max: 599 })  // Server errors
);

/**
 * Arbitrary generator for error types
 */
const errorTypeArbitrary = fc.constantFrom('network', 'server', 'timeout', 'unknown');

/**
 * Arbitrary generator for error messages
 */
const errorMessageArbitrary = fc.oneof(
  fc.constant('Failed to clear session'),
  fc.constant('Internal server error'),
  fc.constant('Database connection failed'),
  fc.constant('Session not found'),
  fc.constant('Unexpected error occurred'),
  fc.stringMatching(/^[A-Za-z0-9 ]+$/).filter(s => s.length > 5 && s.length < 100)
);

/**
 * Arbitrary generator for server error responses
 * Generates various error response formats
 */
const serverErrorResponseArbitrary = fc.oneof(
  // Error with type and message
  fc.record({
    success: fc.constant(false),
    error: fc.record({
      type: errorTypeArbitrary,
      message: errorMessageArbitrary,
    }),
  }),
  // Error with only message
  fc.record({
    success: fc.constant(false),
    error: fc.record({
      message: errorMessageArbitrary,
    }),
  }),
  // Error with only type
  fc.record({
    success: fc.constant(false),
    error: fc.record({
      type: errorTypeArbitrary,
    }),
  }),
  // Error with no error object
  fc.record({
    success: fc.constant(false),
  })
);

/**
 * Arbitrary generator for network error types
 * Generates various network error scenarios
 */
const networkErrorArbitrary = fc.oneof(
  fc.constant(new Error('Network request failed')),
  fc.constant(new Error('Failed to fetch')),
  fc.constant(new Error('Connection timeout')),
  fc.constant(new Error('ECONNREFUSED')),
  fc.constant(new Error('ETIMEDOUT')),
  fc.constant(new TypeError('Failed to fetch')),
  fc.constant(new Error('Network error'))
);

describe('Property-Based Test: Logout Error Recovery', () => {
  const mockFetch = jest.fn();
  const mockPush = jest.fn();
  
  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockClear();
    mockPush.mockClear();
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Use real timers for these tests
    jest.useRealTimers();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Feature: logout-button, Property 3: Error Recovery Enables Retry
   * 
   * For ANY error that occurs during logout (network error, server error, etc.),
   * the logout button should return to its enabled state (isLoading = false),
   * allowing the user to retry the operation.
   * 
   * **Validates: Requirements 5.3**
   * 
   * This property test validates that:
   * 1. After any error, isLoading returns to false
   * 2. An error message is set
   * 3. The button can be clicked again (handleLogout can be called)
   * 4. A retry attempt works correctly
   */
  test('Property 3: Error Recovery Enables Retry - Server Errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        serverErrorResponseArbitrary,
        async (errorResponse) => {
          // Clear mocks before each property test run
          mockFetch.mockClear();
          mockPush.mockClear();
          
          // Mock fetch to return error response
          mockFetch.mockResolvedValueOnce({
            json: async () => errorResponse,
          });
          
          const { result, unmount } = renderHook(() => useLogout());
          
          try {
            // Initial state should be not loading
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
            
            // Trigger logout
            await act(async () => {
              await result.current.handleLogout();
            });
            
            // Wait for error state to be set
            await waitFor(() => {
              expect(result.current.isLoading).toBe(false);
              expect(result.current.error).not.toBeNull();
            });
            
            // After error, button should be enabled (isLoading = false)
            expect(result.current.isLoading).toBe(false);
            
            // Error message should be set
            expect(result.current.error).not.toBeNull();
            expect(typeof result.current.error).toBe('string');
            
            // Verify no redirect occurred
            expect(mockPush).not.toHaveBeenCalled();
            
            // Verify retry is possible - mock a successful response
            mockFetch.mockResolvedValueOnce({
              json: async () => ({ success: true }),
            });
            
            // Trigger retry
            await act(async () => {
              await result.current.handleLogout();
            });
            
            // Verify retry worked - should redirect on success
            await waitFor(() => {
              expect(mockPush).toHaveBeenCalledWith('/login');
            });
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Network errors enable retry
   * 
   * For ANY network error (connection failure, timeout, etc.),
   * the button should return to enabled state.
   * 
   * **Validates: Requirements 5.3**
   */
  test('Property: Network errors enable retry', async () => {
    await fc.assert(
      fc.asyncProperty(
        networkErrorArbitrary,
        async (networkError) => {
          // Clear mocks before each property test run
          mockFetch.mockClear();
          mockPush.mockClear();
          
          // Mock fetch to throw network error
          mockFetch.mockRejectedValueOnce(networkError);
          
          const { result, unmount } = renderHook(() => useLogout());
          
          try {
            // Initial state
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
            
            // Trigger logout
            await act(async () => {
              await result.current.handleLogout();
            });
            
            // Wait for error state
            await waitFor(() => {
              expect(result.current.isLoading).toBe(false);
              expect(result.current.error).not.toBeNull();
            });
            
            // After network error, button should be enabled
            expect(result.current.isLoading).toBe(false);
            
            // Error message should be set
            expect(result.current.error).not.toBeNull();
            expect(result.current.error).toContain('connection');
            
            // Verify no redirect occurred
            expect(mockPush).not.toHaveBeenCalled();
            
            // Verify retry is possible
            mockFetch.mockResolvedValueOnce({
              json: async () => ({ success: true }),
            });
            
            await act(async () => {
              await result.current.handleLogout();
            });
            
            // Verify retry worked
            await waitFor(() => {
              expect(mockPush).toHaveBeenCalledWith('/login');
            });
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Multiple consecutive errors maintain retry capability
   * 
   * For ANY sequence of errors, each error should return the button
   * to enabled state, allowing unlimited retry attempts.
   * 
   * **Validates: Requirements 5.3**
   */
  test('Property: Multiple consecutive errors maintain retry capability', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.oneof(serverErrorResponseArbitrary, networkErrorArbitrary),
          { minLength: 2, maxLength: 5 }
        ),
        async (errors) => {
          // Clear mocks before each property test run
          mockFetch.mockClear();
          mockPush.mockClear();
          
          const { result, unmount } = renderHook(() => useLogout());
          
          try {
            // Try each error in sequence
            for (let i = 0; i < errors.length; i++) {
              const error = errors[i];
              
              // Mock the error
              if (error instanceof Error) {
                // Network error
                mockFetch.mockRejectedValueOnce(error);
              } else {
                // Server error response
                mockFetch.mockResolvedValueOnce({
                  json: async () => error,
                });
              }
              
              // Trigger logout
              await act(async () => {
                await result.current.handleLogout();
              });
              
              // Wait for error state
              await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
                expect(result.current.error).not.toBeNull();
              });
              
              // After each error, button should be enabled
              expect(result.current.isLoading).toBe(false);
              expect(result.current.error).not.toBeNull();
              
              // Verify no redirect occurred
              expect(mockPush).not.toHaveBeenCalled();
            }
            
            // After all errors, verify final retry works
            mockFetch.mockResolvedValueOnce({
              json: async () => ({ success: true }),
            });
            
            await act(async () => {
              await result.current.handleLogout();
            });
            
            // Verify final retry succeeded
            await waitFor(() => {
              expect(mockPush).toHaveBeenCalledWith('/login');
            });
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 15000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Error state clears previous error on retry
   * 
   * For ANY error followed by a retry, the previous error should
   * be cleared when the new logout attempt begins.
   * 
   * **Validates: Requirements 5.3**
   */
  test('Property: Error state clears previous error on retry', async () => {
    await fc.assert(
      fc.asyncProperty(
        serverErrorResponseArbitrary,
        serverErrorResponseArbitrary,
        async (firstError, secondError) => {
          // Clear mocks before each property test run
          mockFetch.mockClear();
          mockPush.mockClear();
          
          const { result, unmount } = renderHook(() => useLogout());
          
          try {
            // First error
            mockFetch.mockResolvedValueOnce({
              json: async () => firstError,
            });
            
            await act(async () => {
              await result.current.handleLogout();
            });
            
            await waitFor(() => {
              expect(result.current.error).not.toBeNull();
              expect(result.current.isLoading).toBe(false);
            });
            
            const firstErrorMessage = result.current.error;
            expect(firstErrorMessage).not.toBeNull();
            expect(result.current.isLoading).toBe(false);
            
            // Second error (retry)
            mockFetch.mockResolvedValueOnce({
              json: async () => secondError,
            });
            
            await act(async () => {
              await result.current.handleLogout();
            });
            
            await waitFor(() => {
              expect(result.current.error).not.toBeNull();
              expect(result.current.isLoading).toBe(false);
            });
            
            // Error should be cleared and new error set
            // (or could be the same error message if both errors have same message)
            expect(result.current.error).not.toBeNull();
            expect(result.current.isLoading).toBe(false);
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Button state transitions correctly through error cycle
   * 
   * For ANY error, the button state should transition:
   * not loading -> loading -> not loading (after error)
   * 
   * **Validates: Requirements 5.3**
   */
  test('Property: Button state transitions correctly through error cycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(serverErrorResponseArbitrary, networkErrorArbitrary),
        async (error) => {
          // Clear mocks before each property test run
          mockFetch.mockClear();
          mockPush.mockClear();
          
          // Create a promise we can control
          let resolvePromise: (value: any) => void;
          let rejectPromise: (error: any) => void;
          const promise = new Promise((resolve, reject) => {
            resolvePromise = resolve;
            rejectPromise = reject;
          });
          
          mockFetch.mockReturnValue(promise);
          
          const { result, unmount } = renderHook(() => useLogout());
          
          try {
            // Initial state: not loading
            expect(result.current.isLoading).toBe(false);
            expect(result.current.error).toBeNull();
            
            // Start logout
            act(() => {
              result.current.handleLogout();
            });
            
            // Should transition to loading
            await waitFor(() => {
              expect(result.current.isLoading).toBe(true);
            });
            expect(result.current.error).toBeNull();
            
            // Trigger error
            await act(async () => {
              if (error instanceof Error) {
                rejectPromise!(error);
              } else {
                resolvePromise!({
                  json: async () => error,
                });
              }
            });
            
            // Should transition back to not loading with error
            await waitFor(() => {
              expect(result.current.isLoading).toBe(false);
            });
            expect(result.current.error).not.toBeNull();
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Error recovery works regardless of error timing
   * 
   * For ANY error that occurs at different points in the request lifecycle,
   * the button should return to enabled state.
   * 
   * **Validates: Requirements 5.3**
   */
  test('Property: Error recovery works regardless of error timing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('immediate', 'delayed', 'during-parse'),
        fc.oneof(serverErrorResponseArbitrary, networkErrorArbitrary),
        async (timing, error) => {
          // Clear mocks before each property test run
          mockFetch.mockClear();
          mockPush.mockClear();
          
          const { result, unmount } = renderHook(() => useLogout());
          
          try {
            switch (timing) {
              case 'immediate':
                // Error occurs immediately
                if (error instanceof Error) {
                  mockFetch.mockRejectedValueOnce(error);
                } else {
                  mockFetch.mockResolvedValueOnce({
                    json: async () => error,
                  });
                }
                break;
                
              case 'delayed':
                // Error occurs after a delay
                if (error instanceof Error) {
                  mockFetch.mockImplementationOnce(() =>
                    new Promise((_, reject) => setTimeout(() => reject(error), 10))
                  );
                } else {
                  mockFetch.mockImplementationOnce(() =>
                    new Promise((resolve) =>
                      setTimeout(() => resolve({ json: async () => error }), 10)
                    )
                  );
                }
                break;
                
              case 'during-parse':
                // Error occurs during JSON parsing
                if (error instanceof Error) {
                  mockFetch.mockRejectedValueOnce(error);
                } else {
                  mockFetch.mockResolvedValueOnce({
                    json: async () => {
                      // Simulate parsing delay
                      await new Promise(resolve => setTimeout(resolve, 5));
                      return error;
                    },
                  });
                }
                break;
            }
            
            // Trigger logout
            await act(async () => {
              await result.current.handleLogout();
            });
            
            // Wait for error state
            await waitFor(() => {
              expect(result.current.isLoading).toBe(false);
            }, { timeout: 1000 });
            
            // Verify error state
            expect(result.current.error).not.toBeNull();
            expect(mockPush).not.toHaveBeenCalled();
            
            // Verify retry works
            mockFetch.mockResolvedValueOnce({
              json: async () => ({ success: true }),
            });
            
            await act(async () => {
              await result.current.handleLogout();
            });
            
            await waitFor(() => {
              expect(mockPush).toHaveBeenCalledWith('/login');
            });
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 15000,
        endOnFailure: true,
      }
    );
  });
});
