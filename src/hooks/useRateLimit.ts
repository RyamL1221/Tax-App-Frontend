'use client';

import { useState, useEffect, useCallback } from 'react';
import { RateLimitState } from '@/types/auth';

/**
 * Configuration for rate limiting
 */
const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,
  WINDOW_DURATION_MS: 60000, // 60 seconds
  STORAGE_KEY: 'login_rate_limit',
} as const;

/**
 * Hook for managing rate limiting of login attempts
 * Implements 5 attempts per 60 seconds with sessionStorage persistence
 * 
 * @returns Object containing rate limit state and control functions
 */
export const useRateLimit = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    attempts: 0,
    windowStart: Date.now(),
    isLocked: false,
    unlockTime: undefined,
  });

  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  /**
   * Load rate limit state from sessionStorage on mount
   */
  useEffect(() => {
    const loadStateFromStorage = () => {
      try {
        const stored = sessionStorage.getItem(RATE_LIMIT_CONFIG.STORAGE_KEY);
        if (stored) {
          const parsedState: RateLimitState = JSON.parse(stored);
          const now = Date.now();
          
          // Check if the window has expired
          if (now - parsedState.windowStart >= RATE_LIMIT_CONFIG.WINDOW_DURATION_MS) {
            // Window expired, reset state
            const newState: RateLimitState = {
              attempts: 0,
              windowStart: now,
              isLocked: false,
              unlockTime: undefined,
            };
            setRateLimitState(newState);
            sessionStorage.setItem(RATE_LIMIT_CONFIG.STORAGE_KEY, JSON.stringify(newState));
          } else {
            // Window still active, use stored state
            setRateLimitState(parsedState);
            
            // If locked, calculate remaining time
            if (parsedState.isLocked && parsedState.unlockTime) {
              const remaining = Math.max(0, parsedState.unlockTime - now);
              setRemainingTime(Math.ceil(remaining / 1000));
            }
          }
        }
      } catch (error) {
        console.error('Failed to load rate limit state from sessionStorage:', error);
      }
    };

    loadStateFromStorage();
  }, []);

  /**
   * Save rate limit state to sessionStorage whenever it changes
   */
  useEffect(() => {
    if (isResetting) {
      setIsResetting(false);
      return;
    }
    
    try {
      sessionStorage.setItem(RATE_LIMIT_CONFIG.STORAGE_KEY, JSON.stringify(rateLimitState));
    } catch (error) {
      console.error('Failed to save rate limit state to sessionStorage:', error);
    }
  }, [rateLimitState, isResetting]);

  /**
   * Update remaining time countdown when locked
   */
  useEffect(() => {
    if (!rateLimitState.isLocked || !rateLimitState.unlockTime) {
      setRemainingTime(0);
      return;
    }

    const updateRemainingTime = () => {
      const now = Date.now();
      const remaining = Math.max(0, rateLimitState.unlockTime! - now);
      const remainingSeconds = Math.ceil(remaining / 1000);
      
      setRemainingTime(remainingSeconds);

      // If time has expired, unlock
      if (remaining <= 0) {
        setRateLimitState({
          attempts: 0,
          windowStart: now,
          isLocked: false,
          unlockTime: undefined,
        });
      }
    };

    // Update immediately
    updateRemainingTime();

    // Update every second
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [rateLimitState.isLocked, rateLimitState.unlockTime]);

  /**
   * Record a failed login attempt
   * Increments the attempt counter and locks if limit is reached
   */
  const recordAttempt = useCallback(() => {
    setRateLimitState((prevState) => {
      const now = Date.now();
      
      // Check if we're in a new window
      if (now - prevState.windowStart >= RATE_LIMIT_CONFIG.WINDOW_DURATION_MS) {
        // New window, reset counter
        return {
          attempts: 1,
          windowStart: now,
          isLocked: false,
          unlockTime: undefined,
        };
      }

      // Same window, increment attempts
      const newAttempts = prevState.attempts + 1;
      
      // Check if we've hit the limit
      if (newAttempts >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
        const unlockTime = prevState.windowStart + RATE_LIMIT_CONFIG.WINDOW_DURATION_MS;
        return {
          attempts: newAttempts,
          windowStart: prevState.windowStart,
          isLocked: true,
          unlockTime,
        };
      }

      return {
        ...prevState,
        attempts: newAttempts,
      };
    });
  }, []);

  /**
   * Reset the rate limit state
   * Useful for testing or after successful authentication
   */
  const reset = useCallback(() => {
    try {
      sessionStorage.removeItem(RATE_LIMIT_CONFIG.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear rate limit state from sessionStorage:', error);
    }
    
    setIsResetting(true);
    const newState: RateLimitState = {
      attempts: 0,
      windowStart: Date.now(),
      isLocked: false,
      unlockTime: undefined,
    };
    setRateLimitState(newState);
    setRemainingTime(0);
  }, []);

  /**
   * Check if rate limit is currently active
   */
  const isLocked = rateLimitState.isLocked;

  return {
    isLocked,
    remainingTime,
    attempts: rateLimitState.attempts,
    recordAttempt,
    reset,
  };
};

export default useRateLimit;
