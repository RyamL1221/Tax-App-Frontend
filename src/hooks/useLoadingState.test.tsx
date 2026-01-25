import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useLoadingState } from './useLoadingState';

describe('useLoadingState Hook Unit Tests', () => {
  describe('Initial State', () => {
    test('returns default initial state', () => {
      const { result } = renderHook(() => useLoadingState());
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
    });

    test('accepts custom initial loading state', () => {
      const { result } = renderHook(() => useLoadingState({ initialLoading: true }));
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
    });
  });

  describe('setLoading Function', () => {
    test('sets loading state to true', () => {
      const { result } = renderHook(() => useLoadingState());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
    });

    test('sets loading state to false', () => {
      const { result } = renderHook(() => useLoadingState({ initialLoading: true }));
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });

    test('clears error when starting new loading', () => {
      const { result } = renderHook(() => useLoadingState());
      
      // Set an error first
      act(() => {
        result.current.setError(new Error('Test error'));
      });
      
      expect(result.current.error).not.toBe(null);
      
      // Start loading should clear error
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(true);
    });

    test('clears success when starting new loading', () => {
      const { result } = renderHook(() => useLoadingState());
      
      // Set success first
      act(() => {
        result.current.setSuccess();
      });
      
      expect(result.current.success).toBe(true);
      
      // Start loading should clear success
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.success).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('setError Function', () => {
    test('sets error and stops loading', () => {
      const { result } = renderHook(() => useLoadingState({ initialLoading: true }));
      
      const testError = new Error('Test error');
      
      act(() => {
        result.current.setError(testError);
      });
      
      expect(result.current.error).toBe(testError);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.success).toBe(false);
    });

    test('clears error when set to null', () => {
      const { result } = renderHook(() => useLoadingState());
      
      // Set error first
      act(() => {
        result.current.setError(new Error('Test error'));
      });
      
      expect(result.current.error).not.toBe(null);
      
      // Clear error
      act(() => {
        result.current.setError(null);
      });
      
      expect(result.current.error).toBe(null);
    });

    test('calls onError callback when error is set', () => {
      const mockOnError = jest.fn();
      const { result } = renderHook(() => useLoadingState({ onError: mockOnError }));
      
      const testError = new Error('Test error');
      
      act(() => {
        result.current.setError(testError);
      });
      
      expect(mockOnError).toHaveBeenCalledWith(testError);
    });

    test('does not call onError callback when error is cleared', () => {
      const mockOnError = jest.fn();
      const { result } = renderHook(() => useLoadingState({ onError: mockOnError }));
      
      act(() => {
        result.current.setError(null);
      });
      
      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe('setSuccess Function', () => {
    test('sets success and stops loading', () => {
      const { result } = renderHook(() => useLoadingState({ initialLoading: true }));
      
      act(() => {
        result.current.setSuccess();
      });
      
      expect(result.current.success).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('calls onSuccess callback when success is set', () => {
      const mockOnSuccess = jest.fn();
      const { result } = renderHook(() => useLoadingState({ onSuccess: mockOnSuccess }));
      
      act(() => {
        result.current.setSuccess();
      });
      
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset Function', () => {
    test('resets all state to initial values', () => {
      const { result } = renderHook(() => useLoadingState());
      
      // Set some state
      act(() => {
        result.current.setLoading(true);
        result.current.setError(new Error('Test error'));
        result.current.setSuccess();
      });
      
      // Reset
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
    });
  });

  describe('executeAsync Function', () => {
    test('executes successful async operation', async () => {
      const { result } = renderHook(() => useLoadingState());
      
      const mockAsyncFn = jest.fn().mockResolvedValue('success result');
      
      let asyncResult: any;
      await act(async () => {
        asyncResult = await result.current.executeAsync(mockAsyncFn);
      });
      
      expect(mockAsyncFn).toHaveBeenCalledTimes(1);
      expect(asyncResult).toBe('success result');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.success).toBe(true);
      expect(result.current.error).toBe(null);
    });

    test('handles async operation errors', async () => {
      const { result } = renderHook(() => useLoadingState());
      
      const testError = new Error('Async error');
      const mockAsyncFn = jest.fn().mockRejectedValue(testError);
      
      let asyncResult: any;
      await act(async () => {
        asyncResult = await result.current.executeAsync(mockAsyncFn);
      });
      
      expect(mockAsyncFn).toHaveBeenCalledTimes(1);
      expect(asyncResult).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.success).toBe(false);
      expect(result.current.error).toBe(testError);
    });

    test('handles non-Error exceptions', async () => {
      const { result } = renderHook(() => useLoadingState());
      
      const mockAsyncFn = jest.fn().mockRejectedValue('String error');
      
      let asyncResult: any;
      await act(async () => {
        asyncResult = await result.current.executeAsync(mockAsyncFn);
      });
      
      expect(asyncResult).toBe(null);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Unknown error');
    });

    test('calls onSuccess callback on successful execution', async () => {
      const mockOnSuccess = jest.fn();
      const { result } = renderHook(() => useLoadingState({ onSuccess: mockOnSuccess }));
      
      const mockAsyncFn = jest.fn().mockResolvedValue('success');
      
      await act(async () => {
        await result.current.executeAsync(mockAsyncFn);
      });
      
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    test('calls onError callback on failed execution', async () => {
      const mockOnError = jest.fn();
      const { result } = renderHook(() => useLoadingState({ onError: mockOnError }));
      
      const testError = new Error('Execution failed');
      const mockAsyncFn = jest.fn().mockRejectedValue(testError);
      
      await act(async () => {
        await result.current.executeAsync(mockAsyncFn);
      });
      
      expect(mockOnError).toHaveBeenCalledWith(testError);
    });
  });

  describe('State Transitions', () => {
    test('loading -> success transition', () => {
      const { result } = renderHook(() => useLoadingState());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.success).toBe(false);
      
      act(() => {
        result.current.setSuccess();
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.success).toBe(true);
    });

    test('loading -> error transition', () => {
      const { result } = renderHook(() => useLoadingState());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      
      const testError = new Error('Test error');
      act(() => {
        result.current.setError(testError);
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(testError);
    });

    test('error -> loading transition clears error', () => {
      const { result } = renderHook(() => useLoadingState());
      
      act(() => {
        result.current.setError(new Error('Test error'));
      });
      
      expect(result.current.error).not.toBe(null);
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(true);
    });

    test('success -> loading transition clears success', () => {
      const { result } = renderHook(() => useLoadingState());
      
      act(() => {
        result.current.setSuccess();
      });
      
      expect(result.current.success).toBe(true);
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.success).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('handles multiple rapid state changes', () => {
      const { result } = renderHook(() => useLoadingState());
      
      act(() => {
        result.current.setLoading(true);
        result.current.setError(new Error('Error'));
        result.current.setSuccess();
        result.current.reset();
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
    });

    test('handles undefined options', () => {
      const { result } = renderHook(() => useLoadingState(undefined));
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
    });

    test('handles empty options object', () => {
      const { result } = renderHook(() => useLoadingState({}));
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
    });
  });

  describe('Callback Stability', () => {
    test('callback functions are stable across re-renders', () => {
      const { result, rerender } = renderHook(() => useLoadingState());
      
      const initialSetLoading = result.current.setLoading;
      const initialSetError = result.current.setError;
      const initialSetSuccess = result.current.setSuccess;
      const initialReset = result.current.reset;
      const initialExecuteAsync = result.current.executeAsync;
      
      rerender();
      
      expect(result.current.setLoading).toBe(initialSetLoading);
      expect(result.current.setError).toBe(initialSetError);
      expect(result.current.setSuccess).toBe(initialSetSuccess);
      expect(result.current.reset).toBe(initialReset);
      expect(result.current.executeAsync).toBe(initialExecuteAsync);
    });

    test('callbacks remain stable when options change', () => {
      const { result, rerender } = renderHook(
        ({ onSuccess, onError }) => useLoadingState({ onSuccess, onError }),
        {
          initialProps: {
            onSuccess: jest.fn(),
            onError: jest.fn()
          }
        }
      );
      
      const initialSetError = result.current.setError;
      const initialSetSuccess = result.current.setSuccess;
      
      rerender({
        onSuccess: jest.fn(),
        onError: jest.fn()
      });
      
      // These should be new references because the callbacks changed
      expect(result.current.setError).not.toBe(initialSetError);
      expect(result.current.setSuccess).not.toBe(initialSetSuccess);
    });
  });
});