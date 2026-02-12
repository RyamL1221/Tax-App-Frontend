/**
 * Unit tests for AuthLogger
 * 
 * Tests log generation for all operation types, log format, required fields,
 * environment-based filtering, and security requirements.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import {
  logAuthStateChange,
  logTokenOperation,
  logAuthFailure,
  logRedirect,
  logAuthEvent,
  createAuthState,
  AuthLogger,
  authLogger,
  AuthState,
} from './AuthLogger';

describe('AuthLogger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    
    // Restore NODE_ENV
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    }
  });

  describe('createAuthState', () => {
    it('should create auth state with all fields', () => {
      const state = createAuthState(true, 'user123', 'user@example.com');
      
      expect(state).toEqual({
        isAuthenticated: true,
        userId: 'user123',
        email: 'user@example.com',
      });
    });

    it('should set isAuthenticated based on parameter', () => {
      expect(createAuthState(true).isAuthenticated).toBe(true);
      expect(createAuthState(false).isAuthenticated).toBe(false);
    });

    it('should handle null userId and email', () => {
      const state = createAuthState(true, null, null);
      
      expect(state.userId).toBeNull();
      expect(state.email).toBeNull();
    });

    it('should default userId and email to null when not provided', () => {
      const state = createAuthState(true);
      
      expect(state.userId).toBeNull();
      expect(state.email).toBeNull();
    });
  });

  describe('logAuthStateChange', () => {
    it('should log auth state change with all required fields', () => {
      process.env.NODE_ENV = 'development';
      
      const oldState = createAuthState(false);
      const newState = createAuthState(true, 'user123', 'user@example.com');
      
      logAuthStateChange('User logged in', oldState, newState);
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const call = consoleLogSpy.mock.calls[0];
      
      // Check message format
      expect(call[0]).toContain('[AuthLogger');
      expect(call[0]).toContain('Auth State Change: User logged in');
      
      // Check log data
      expect(call[1]).toHaveProperty('level', 'info');
      expect(call[1]).toHaveProperty('authState', newState);
      expect(call[1].context).toHaveProperty('oldState', oldState);
      expect(call[1].context.changes).toEqual({
        isAuthenticated: true,
      });
    });

    it('should include custom context', () => {
      process.env.NODE_ENV = 'development';
      
      const oldState = createAuthState(true);
      const newState = createAuthState(false);
      const context = { reason: 'session expired', component: 'FormPage' };
      
      logAuthStateChange('User logged out', oldState, newState, context);
      
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1].context).toMatchObject(context);
    });

    it('should detect changes between states', () => {
      process.env.NODE_ENV = 'development';
      
      const oldState = createAuthState(false);
      const newState = createAuthState(true);
      
      logAuthStateChange('JWT recovered', oldState, newState);
      
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1].context.changes).toEqual({
        isAuthenticated: true,
      });
    });

    it('should log in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      const oldState = createAuthState(false);
      const newState = createAuthState(true);
      
      logAuthStateChange('User logged in', oldState, newState);
      
      // In production, info logs are not shown
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('logTokenOperation', () => {
    it('should log successful token operation', () => {
      process.env.NODE_ENV = 'development';
      
      logTokenOperation('set', true, undefined, 'LoginForm');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const call = consoleLogSpy.mock.calls[0];
      
      expect(call[0]).toContain('Token set succeeded');
      expect(call[1]).toHaveProperty('level', 'info');
      expect(call[1].context).toMatchObject({
        operation: 'set',
        success: true,
        source: 'LoginForm',
        note: 'Token value not logged for security',
      });
    });

    it('should log failed token operation with warning level', () => {
      process.env.NODE_ENV = 'development';
      
      logTokenOperation('validate', false, 'Token expired', 'FormAuthGuard');
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const call = consoleWarnSpy.mock.calls[0];
      
      expect(call[0]).toContain('Token validate failed');
      expect(call[1]).toHaveProperty('level', 'warn');
      expect(call[1].context).toMatchObject({
        operation: 'validate',
        success: false,
        reason: 'Token expired',
        source: 'FormAuthGuard',
      });
    });

    it('should never log token values', () => {
      process.env.NODE_ENV = 'development';
      
      logTokenOperation('get', true);
      
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1].context.note).toBe('Token value not logged for security');
      
      // Verify no token-like strings in any arguments
      const allArgs = call.flat();
      allArgs.forEach((arg: any) => {
        if (typeof arg === 'string') {
          expect(arg).not.toMatch(/eyJ[A-Za-z0-9-_]+\./); // JWT pattern
        }
      });
    });

    it('should log all operation types', () => {
      process.env.NODE_ENV = 'development';
      
      const operations: Array<'set' | 'get' | 'clear' | 'validate'> = ['set', 'get', 'clear', 'validate'];
      
      operations.forEach(op => {
        consoleLogSpy.mockClear();
        logTokenOperation(op, true);
        
        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        const call = consoleLogSpy.mock.calls[0];
        expect(call[0]).toContain(`Token ${op} succeeded`);
      });
    });

    it('should log warnings in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      logTokenOperation('validate', false, 'Invalid token');
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Token validate failed');
    });
  });

  describe('logAuthFailure', () => {
    it('should log API auth failure with all details', () => {
      process.env.NODE_ENV = 'development';
      
      const authState = createAuthState(false);
      
      logAuthFailure('/api/documents/generate', 401, authState, true);
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const call = consoleWarnSpy.mock.calls[0];
      
      expect(call[0]).toContain('API Auth Failure: 401 /api/documents/generate');
      expect(call[1]).toHaveProperty('level', 'warn');
      expect(call[1]).toHaveProperty('authState', authState);
      expect(call[1].context).toMatchObject({
        url: '/api/documents/generate',
        status: 401,
        willRetry: true,
      });
    });

    it('should include custom context', () => {
      process.env.NODE_ENV = 'development';
      
      const authState = createAuthState(false);
      const context = { attemptNumber: 2, maxRetries: 3 };
      
      logAuthFailure('/api/test', 401, authState, false, context);
      
      const call = consoleWarnSpy.mock.calls[0];
      expect(call[1].context).toMatchObject(context);
    });

    it('should log warnings in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      const authState = createAuthState(true);
      
      logAuthFailure('/api/test', 401, authState, false);
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle different status codes', () => {
      process.env.NODE_ENV = 'development';
      
      const authState = createAuthState(true);
      const statuses = [401, 403, 500];
      
      statuses.forEach(status => {
        consoleWarnSpy.mockClear();
        logAuthFailure('/api/test', status, authState, false);
        
        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        const call = consoleWarnSpy.mock.calls[0];
        expect(call[0]).toContain(`API Auth Failure: ${status}`);
      });
    });
  });

  describe('logRedirect', () => {
    it('should log redirect with all details', () => {
      process.env.NODE_ENV = 'development';
      
      const authState = createAuthState(false);
      
      logRedirect('/forms/1099-div', '/login', 'Session expired', authState);
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const call = consoleLogSpy.mock.calls[0];
      
      expect(call[0]).toContain('Auth Redirect: /forms/1099-div → /login');
      expect(call[1]).toHaveProperty('level', 'info');
      expect(call[1]).toHaveProperty('authState', authState);
      expect(call[1].context).toMatchObject({
        from: '/forms/1099-div',
        to: '/login',
        reason: 'Session expired',
      });
    });

    it('should include custom context', () => {
      process.env.NODE_ENV = 'development';
      
      const authState = createAuthState(false);
      const context = { returnUrl: '/forms/1099-div', preservedData: true };
      
      logRedirect('/forms/1099-div', '/login', 'JWT missing', authState, context);
      
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1].context).toMatchObject(context);
    });

    it('should not log in production mode (info level)', () => {
      process.env.NODE_ENV = 'production';
      
      const authState = createAuthState(false);
      
      logRedirect('/dashboard', '/login', 'Not authenticated', authState);
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('logAuthEvent', () => {
    it('should log info level events', () => {
      process.env.NODE_ENV = 'development';
      
      logAuthEvent('Custom auth event', 'info');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const call = consoleLogSpy.mock.calls[0];
      
      expect(call[0]).toContain('Custom auth event');
      expect(call[1]).toHaveProperty('level', 'info');
    });

    it('should log warn level events', () => {
      process.env.NODE_ENV = 'development';
      
      logAuthEvent('Warning event', 'warn');
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    it('should log error level events', () => {
      process.env.NODE_ENV = 'development';
      
      logAuthEvent('Error event', 'error');
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should include auth state when provided', () => {
      process.env.NODE_ENV = 'development';
      
      const authState = createAuthState(true, 'user123', 'user@example.com');
      
      logAuthEvent('Event with state', 'info', authState);
      
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1]).toHaveProperty('authState', authState);
    });

    it('should include context when provided', () => {
      process.env.NODE_ENV = 'development';
      
      const context = { component: 'TestComponent', action: 'test' };
      
      logAuthEvent('Event with context', 'info', undefined, context);
      
      const call = consoleLogSpy.mock.calls[0];
      // Context should include the provided context plus logoutInProgress
      expect(call[1].context).toMatchObject(context);
      expect(call[1].context).toHaveProperty('logoutInProgress');
    });

    it('should log errors in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      logAuthEvent('Production error', 'error');
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should log warnings in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      logAuthEvent('Production warning', 'warn');
      
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('environment-based filtering', () => {
    it('should log all levels in development', () => {
      process.env.NODE_ENV = 'development';
      
      logAuthEvent('Info event', 'info');
      logAuthEvent('Debug event', 'debug');
      logAuthEvent('Warn event', 'warn');
      logAuthEvent('Error event', 'error');
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // info and debug
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should only log warnings and errors in production', () => {
      process.env.NODE_ENV = 'production';
      
      logAuthEvent('Info event', 'info');
      logAuthEvent('Debug event', 'debug');
      logAuthEvent('Warn event', 'warn');
      logAuthEvent('Error event', 'error');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should include full details in development', () => {
      process.env.NODE_ENV = 'development';
      
      const authState = createAuthState(true);
      const context = { test: 'data' };
      
      logAuthEvent('Test event', 'info', authState, context);
      
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1]).toHaveProperty('authState');
      expect(call[1]).toHaveProperty('context');
    });

    it('should include minimal details in production', () => {
      process.env.NODE_ENV = 'production';
      
      const authState = createAuthState(true);
      const context = { test: 'data' };
      
      logAuthEvent('Test warning', 'warn', authState, context);
      
      const call = consoleWarnSpy.mock.calls[0];
      // In production, only the message is logged
      expect(call.length).toBe(1);
      expect(typeof call[0]).toBe('string');
    });
  });

  describe('log format and required fields', () => {
    it('should include timestamp in all logs', () => {
      process.env.NODE_ENV = 'development';
      
      const beforeTime = Date.now();
      logAuthEvent('Test event', 'info');
      const afterTime = Date.now();
      
      const call = consoleLogSpy.mock.calls[0];
      expect(call[0]).toMatch(/\[AuthLogger \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
      
      // Verify timestamp is within reasonable range
      const timestampMatch = call[0].match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
      if (timestampMatch) {
        const logTime = new Date(timestampMatch[0]).getTime();
        expect(logTime).toBeGreaterThanOrEqual(beforeTime);
        expect(logTime).toBeLessThanOrEqual(afterTime);
      }
    });

    it('should include event type in all logs', () => {
      process.env.NODE_ENV = 'development';
      
      logAuthEvent('Custom event type', 'info');
      
      const call = consoleLogSpy.mock.calls[0];
      expect(call[0]).toContain('Custom event type');
    });

    it('should include log level in all logs', () => {
      process.env.NODE_ENV = 'development';
      
      logAuthEvent('Test', 'info');
      
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1]).toHaveProperty('level', 'info');
    });
  });

  describe('AuthLogger class', () => {
    it('should provide same functionality as functions', () => {
      process.env.NODE_ENV = 'development';
      
      const logger = new AuthLogger();
      const oldState = createAuthState(false);
      const newState = createAuthState(true);
      
      logger.logAuthStateChange('Test', oldState, newState);
      logger.logTokenOperation('set', true);
      logger.logAuthFailure('/api/test', 401, newState, false);
      logger.logRedirect('/from', '/to', 'reason', newState);
      logger.logAuthEvent('Test', 'info');
      
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should have createAuthState method', () => {
      const logger = new AuthLogger();
      const state = logger.createAuthState(true, 'user123', 'user@example.com');
      
      expect(state).toEqual({
        isAuthenticated: true,
        userId: 'user123',
        email: 'user@example.com',
      });
    });
  });

  describe('singleton instance', () => {
    it('should provide authLogger singleton', () => {
      process.env.NODE_ENV = 'development';
      
      const oldState = createAuthState(false);
      const newState = createAuthState(true);
      
      authLogger.logAuthStateChange('Test', oldState, newState);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('security requirements', () => {
    it('should never log actual token values', () => {
      process.env.NODE_ENV = 'development';
      
      // Simulate various operations that might involve tokens
      logTokenOperation('set', true, undefined, 'LoginForm');
      logTokenOperation('get', true);
      logTokenOperation('clear', true);
      logTokenOperation('validate', false, 'Token expired');
      
      // Check all console calls
      const allCalls = [
        ...consoleLogSpy.mock.calls,
        ...consoleWarnSpy.mock.calls,
        ...consoleErrorSpy.mock.calls,
      ];
      
      allCalls.forEach(call => {
        call.forEach(arg => {
          if (typeof arg === 'string') {
            // Should not contain JWT-like patterns
            expect(arg).not.toMatch(/eyJ[A-Za-z0-9-_]+\./);
          }
          if (typeof arg === 'object' && arg !== null) {
            // Should not have token properties
            expect(arg).not.toHaveProperty('token');
            expect(arg).not.toHaveProperty('jwt');
            expect(arg).not.toHaveProperty('accessToken');
          }
        });
      });
    });

    it('should include security note in token operations', () => {
      process.env.NODE_ENV = 'development';
      
      logTokenOperation('set', true);
      
      const call = consoleLogSpy.mock.calls[0];
      expect(call[1].context.note).toBe('Token value not logged for security');
    });
  });
});
