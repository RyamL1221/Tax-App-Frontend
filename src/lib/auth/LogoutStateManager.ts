/**
 * LogoutStateManager - Manages global logout state during authentication transitions
 * 
 * This module provides a centralized way to track logout operations across the application.
 * It prevents race conditions where components attempt to access authentication state
 * after tokens have been cleared but before the logout redirect completes.
 * 
 * The logout state is persisted in sessionStorage to survive component re-renders
 * and unmounts during the logout transition period.
 * 
 * Usage:
 * ```typescript
 * // At start of logout
 * logoutStateManager.setLogoutInProgress();
 * 
 * // In components that need to check
 * if (logoutStateManager.isLogoutInProgress()) {
 *   // Skip auth checks, show loading state
 * }
 * 
 * // After redirect completes (e.g., on login page mount)
 * logoutStateManager.clearLogoutState();
 * ```
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4, 4.5
 */

/**
 * Logout state values representing the current phase of the logout process
 * 
 * - 'idle': No logout operation in progress (default state)
 * - 'in-progress': Logout initiated, tokens being cleared, redirect pending
 * - 'complete': Logout finished, redirect complete (rarely used, typically cleared to idle)
 */
export type LogoutState = 'idle' | 'in-progress' | 'complete';

/**
 * Interface for the logout state manager
 * 
 * Provides methods to manage the global logout state across the application.
 * All methods are safe to call in both client and server environments.
 */
export interface ILogoutStateManager {
  /**
   * Set logout state to in-progress
   * 
   * Call this at the very start of the logout process, before clearing tokens
   * or performing any other logout operations. This signals to all components
   * that a logout is in progress and they should adjust their behavior accordingly.
   * 
   * Requirements: 2.1, 4.2
   * 
   * @example
   * ```typescript
   * // In logout handler
   * logoutStateManager.setLogoutInProgress();
   * clearAuth('user-logout');
   * router.push('/login');
   * ```
   */
  setLogoutInProgress(): void;

  /**
   * Check if logout is currently in progress
   * 
   * Use this method in components to determine if they should skip authentication
   * checks or display logout transition UI. Returns true if logout state is
   * 'in-progress', false otherwise.
   * 
   * Requirements: 2.2, 4.4
   * 
   * @returns true if logout is in progress, false otherwise
   * 
   * @example
   * ```typescript
   * // In Dashboard component
   * if (logoutStateManager.isLogoutInProgress()) {
   *   return <LogoutTransitionUI />;
   * }
   * ```
   */
  isLogoutInProgress(): boolean;

  /**
   * Clear logout state back to idle
   * 
   * Call this after the logout redirect completes, typically in the login page's
   * useEffect hook. This resets the logout state so the next logout operation
   * can proceed normally.
   * 
   * Requirements: 2.4, 4.3
   * 
   * @example
   * ```typescript
   * // In login page
   * useEffect(() => {
   *   logoutStateManager.clearLogoutState();
   * }, []);
   * ```
   */
  clearLogoutState(): void;

  /**
   * Get current logout state
   * 
   * Returns the current logout state value. Useful for debugging and logging.
   * Most components should use isLogoutInProgress() instead for simpler boolean checks.
   * 
   * Requirements: 4.1, 4.5
   * 
   * @returns Current logout state ('idle', 'in-progress', or 'complete')
   * 
   * @example
   * ```typescript
   * // In logger
   * const state = logoutStateManager.getLogoutState();
   * console.log('Current logout state:', state);
   * ```
   */
  getLogoutState(): LogoutState;
}

/**
 * Implementation of ILogoutStateManager using sessionStorage for persistence
 * 
 * Uses sessionStorage instead of React state or localStorage because:
 * - Persists across component re-renders and unmounts
 * - Isolated per browser tab (no cross-tab interference)
 * - Automatically cleared when tab closes
 * - Simple and performant
 * 
 * The implementation is safe to use in server-side rendering contexts
 * (returns default values when window is undefined).
 */
class LogoutStateManagerImpl implements ILogoutStateManager {
  /**
   * sessionStorage key for storing logout state
   * @private
   */
  private readonly STORAGE_KEY = 'logout_state';

  /**
   * Timeout duration in milliseconds for automatic state clearing
   * After this duration, logout state is considered stale and will be automatically cleared
   * @private
   */
  private readonly LOGOUT_TIMEOUT_MS = 5000;

  /**
   * Set logout state to in-progress
   *
   * Stores 'in-progress' with timestamp in sessionStorage as JSON object.
   * Dispatches a custom event to notify listeners of the state change.
   * Safe to call on server (no-op when window is undefined).
   */
  setLogoutInProgress(): void {
    if (typeof window !== 'undefined') {
      const stateData = {
        state: 'in-progress',
        timestamp: Date.now()
      };
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateData));
      
      // Dispatch custom event to notify listeners (e.g., ErrorBoundary)
      window.dispatchEvent(new CustomEvent('logoutStateChange', { 
        detail: { state: 'in-progress' } 
      }));
    }
  }

  /**
   * Check if logout is currently in progress
   *
   * Returns true if sessionStorage contains 'in-progress' and the elapsed time
   * is less than LOGOUT_TIMEOUT_MS. If the elapsed time exceeds the timeout,
   * automatically clears the stale state and returns false.
   * Always returns false on server (when window is undefined).
   *
   * @returns true if logout is in progress, false otherwise
   */
  isLogoutInProgress(): boolean {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;

      try {
        const stateData = JSON.parse(stored);
        const elapsedTime = Date.now() - stateData.timestamp;

        // If elapsed time exceeds timeout, clear stale state and return false
        if (elapsedTime > this.LOGOUT_TIMEOUT_MS) {
          this.clearLogoutState();
          return false;
        }

        // Otherwise, return true if state is 'in-progress'
        return stateData.state === 'in-progress';
      } catch (error) {
        // If JSON parsing fails, clear invalid state
        this.clearLogoutState();
        return false;
      }
    }
    return false;
  }

  /**
   * Clear logout state back to idle
   *
   * Removes the entire JSON object from sessionStorage.
   * Dispatches a custom event to notify listeners of the state change.
   * Safe to call on server (no-op when window is undefined).
   */
  clearLogoutState(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.STORAGE_KEY);
      
      // Dispatch custom event to notify listeners (e.g., ErrorBoundary)
      window.dispatchEvent(new CustomEvent('logoutStateChange', { 
        detail: { state: 'idle' } 
      }));
    }
  }

  /**
   * Get current logout state
   *
   * Returns the current state from sessionStorage by parsing the JSON object,
   * or 'idle' if not set or if running on server.
   *
   * @returns Current logout state
   */
  getLogoutState(): LogoutState {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (!stored) return 'idle';

      try {
        const stateData = JSON.parse(stored);
        if (stateData.state === 'in-progress') return 'in-progress';
        if (stateData.state === 'complete') return 'complete';
      } catch (error) {
        // If JSON parsing fails, return idle
        return 'idle';
      }
    }
    return 'idle';
  }
}

/**
 * Singleton instance of LogoutStateManager
 * 
 * Import and use this instance throughout the application:
 * 
 * ```typescript
 * import { logoutStateManager } from '@/lib/auth/LogoutStateManager';
 * 
 * // Set logout in progress
 * logoutStateManager.setLogoutInProgress();
 * 
 * // Check if logout in progress
 * if (logoutStateManager.isLogoutInProgress()) {
 *   // Handle logout transition
 * }
 * 
 * // Clear logout state
 * logoutStateManager.clearLogoutState();
 * ```
 */
export const logoutStateManager = new LogoutStateManagerImpl();
