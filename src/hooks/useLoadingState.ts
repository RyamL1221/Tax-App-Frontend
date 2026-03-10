'use client';

import { useState, useCallback } from 'react';

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  success: boolean;
}

export const useLoadingState = (options: UseLoadingStateOptions = {}) => {
  const { initialLoading = false, onSuccess, onError } = options;
  
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    success: false
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
      error: loading ? null : prev.error, // Clear error when starting new loading
      success: loading ? false : prev.success // Clear success when starting new loading
    }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false,
      success: false
    }));
    
    if (error && onError) {
      onError(error);
    }
  }, [onError]);

  const setSuccess = useCallback(() => {
    setState(prev => ({
      ...prev,
      success: true,
      isLoading: false,
      error: null
    }));
    
    if (onSuccess) {
      onSuccess();
    }
  }, [onSuccess]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false
    });
  }, []);

  // Helper function to wrap async operations
  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      const result = await asyncFn();
      setSuccess();
      return result;
    } catch (error) {
      setError(error instanceof Error ? error : new Error('Unknown error'));
      return null;
    }
  }, [setLoading, setSuccess, setError]);

  return {
    ...state,
    setLoading,
    setError,
    setSuccess,
    reset,
    executeAsync
  };
};

export default useLoadingState;