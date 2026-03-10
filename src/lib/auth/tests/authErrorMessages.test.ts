/**
 * Unit tests for authErrorMessages
 * 
 * Tests all error message constants and helper functions
 * Validates Requirements 9.1, 9.2, 9.3, 9.4, 9.5
 */

import {
  jwtErrorMessages,
  sessionErrorMessages,
  syncErrorMessages,
  apiAuthErrorMessages,
  formDataMessages,
  redirectReasonMessages,
  errorSourceMessages,
  formAuthErrorMessages,
  debugErrorMessages,
  getAuthErrorMessage,
  getRedirectMessage,
  getErrorSourceMessage,
} from '../authErrorMessages';

describe('authErrorMessages', () => {
  describe('JWT Error Messages', () => {
    it('should have message for missing JWT token (Requirement 9.1)', () => {
      expect(jwtErrorMessages.missing).toBeDefined();
      expect(jwtErrorMessages.missing).toContain('log in');
      expect(typeof jwtErrorMessages.missing).toBe('string');
    });

    it('should have message for expired JWT token (Requirement 9.2)', () => {
      expect(jwtErrorMessages.expired).toBeDefined();
      expect(jwtErrorMessages.expired).toContain('expired');
      expect(typeof jwtErrorMessages.expired).toBe('string');
    });

    it('should have message for invalid JWT token (Requirement 9.3)', () => {
      expect(jwtErrorMessages.invalid).toBeDefined();
      expect(jwtErrorMessages.invalid).toContain('error');
      expect(typeof jwtErrorMessages.invalid).toBe('string');
    });

    it('should have message for JWT validation failure', () => {
      expect(jwtErrorMessages.validationFailed).toBeDefined();
      expect(typeof jwtErrorMessages.validationFailed).toBe('string');
    });

    it('should have message for JWT recovery failure', () => {
      expect(jwtErrorMessages.recoveryFailed).toBeDefined();
      expect(typeof jwtErrorMessages.recoveryFailed).toBe('string');
    });

    it('should not contain sensitive information in any JWT error message', () => {
      Object.values(jwtErrorMessages).forEach(message => {
        expect(message.toLowerCase()).not.toContain('token');
        expect(message.toLowerCase()).not.toContain('jwt');
        expect(message.toLowerCase()).not.toContain('bearer');
      });
    });
  });

  describe('Session Error Messages', () => {
    it('should have message for missing session (Requirement 9.1)', () => {
      expect(sessionErrorMessages.missing).toBeDefined();
      expect(sessionErrorMessages.missing).toContain('log in');
      expect(typeof sessionErrorMessages.missing).toBe('string');
    });

    it('should have message for expired session (Requirement 9.2)', () => {
      expect(sessionErrorMessages.expired).toBeDefined();
      expect(sessionErrorMessages.expired).toContain('expired');
      expect(typeof sessionErrorMessages.expired).toBe('string');
    });

    it('should have message for invalid session (Requirement 9.3)', () => {
      expect(sessionErrorMessages.invalid).toBeDefined();
      expect(typeof sessionErrorMessages.invalid).toBe('string');
    });

    it('should have message for session validation failure', () => {
      expect(sessionErrorMessages.validationFailed).toBeDefined();
      expect(typeof sessionErrorMessages.validationFailed).toBe('string');
    });
  });

  describe('Synchronization Error Messages', () => {
    it('should have message for missing session with valid JWT (Requirement 9.3)', () => {
      expect(syncErrorMessages.sessionMissing).toBeDefined();
      expect(typeof syncErrorMessages.sessionMissing).toBe('string');
    });

    it('should have message for missing JWT with valid session (Requirement 9.3)', () => {
      expect(syncErrorMessages.jwtMissing).toBeDefined();
      expect(typeof syncErrorMessages.jwtMissing).toBe('string');
    });

    it('should have message for both invalid (Requirement 9.3)', () => {
      expect(syncErrorMessages.bothInvalid).toBeDefined();
      expect(typeof syncErrorMessages.bothInvalid).toBe('string');
    });

    it('should have message for sync failure', () => {
      expect(syncErrorMessages.syncFailed).toBeDefined();
      expect(typeof syncErrorMessages.syncFailed).toBe('string');
    });
  });

  describe('API Authentication Error Messages', () => {
    it('should have message for 401 unauthorized (Requirement 9.2, 9.3)', () => {
      expect(apiAuthErrorMessages.unauthorized).toBeDefined();
      expect(typeof apiAuthErrorMessages.unauthorized).toBe('string');
    });

    it('should have message for missing auth header', () => {
      expect(apiAuthErrorMessages.headerMissing).toBeDefined();
      expect(typeof apiAuthErrorMessages.headerMissing).toBe('string');
    });

    it('should have message for refresh required', () => {
      expect(apiAuthErrorMessages.refreshRequired).toBeDefined();
      expect(typeof apiAuthErrorMessages.refreshRequired).toBe('string');
    });

    it('should have message for concurrent failures', () => {
      expect(apiAuthErrorMessages.concurrentFailures).toBeDefined();
      expect(typeof apiAuthErrorMessages.concurrentFailures).toBe('string');
    });
  });

  describe('Form Data Preservation Messages', () => {
    it('should have message for data preserved (Requirement 9.5)', () => {
      expect(formDataMessages.preserved).toBeDefined();
      expect(formDataMessages.preserved).toContain('saved');
      expect(formDataMessages.preserved).toContain('restored');
      expect(typeof formDataMessages.preserved).toBe('string');
    });

    it('should have message for data restored (Requirement 9.5)', () => {
      expect(formDataMessages.restored).toBeDefined();
      expect(formDataMessages.restored).toContain('restored');
      expect(typeof formDataMessages.restored).toBe('string');
    });

    it('should have message for expired data (Requirement 9.5)', () => {
      expect(formDataMessages.expired).toBeDefined();
      expect(formDataMessages.expired).toContain('expired');
      expect(typeof formDataMessages.expired).toBe('string');
    });

    it('should have message for preservation failure', () => {
      expect(formDataMessages.preservationFailed).toBeDefined();
      expect(typeof formDataMessages.preservationFailed).toBe('string');
    });

    it('should have message for restoration failure', () => {
      expect(formDataMessages.restorationFailed).toBeDefined();
      expect(typeof formDataMessages.restorationFailed).toBe('string');
    });
  });

  describe('Redirect Reason Messages', () => {
    it('should have message for missing JWT redirect (Requirement 9.1, 9.4)', () => {
      expect(redirectReasonMessages.missingJwt).toBeDefined();
      expect(typeof redirectReasonMessages.missingJwt).toBe('string');
    });

    it('should have message for expired JWT redirect (Requirement 9.2, 9.4)', () => {
      expect(redirectReasonMessages.expiredJwt).toBeDefined();
      expect(redirectReasonMessages.expiredJwt).toContain('expired');
      expect(typeof redirectReasonMessages.expiredJwt).toBe('string');
    });

    it('should have message for invalid JWT redirect (Requirement 9.3, 9.4)', () => {
      expect(redirectReasonMessages.invalidJwt).toBeDefined();
      expect(typeof redirectReasonMessages.invalidJwt).toBe('string');
    });

    it('should have message for invalid session redirect', () => {
      expect(redirectReasonMessages.invalidSession).toBeDefined();
      expect(typeof redirectReasonMessages.invalidSession).toBe('string');
    });

    it('should have message for API unauthorized redirect', () => {
      expect(redirectReasonMessages.apiUnauthorized).toBeDefined();
      expect(typeof redirectReasonMessages.apiUnauthorized).toBe('string');
    });

    it('should have message for recovery failed redirect', () => {
      expect(redirectReasonMessages.recoveryFailed).toBeDefined();
      expect(typeof redirectReasonMessages.recoveryFailed).toBe('string');
    });

    it('should have message for sync failed redirect', () => {
      expect(redirectReasonMessages.syncFailed).toBeDefined();
      expect(typeof redirectReasonMessages.syncFailed).toBe('string');
    });
  });

  describe('Error Source Messages', () => {
    it('should distinguish client-side errors (Requirement 9.3)', () => {
      expect(errorSourceMessages.client).toBeDefined();
      expect(errorSourceMessages.client.title).toBeDefined();
      expect(errorSourceMessages.client.description).toBeDefined();
      expect(typeof errorSourceMessages.client.title).toBe('string');
      expect(typeof errorSourceMessages.client.description).toBe('string');
    });

    it('should distinguish server-side errors (Requirement 9.3)', () => {
      expect(errorSourceMessages.server).toBeDefined();
      expect(errorSourceMessages.server.title).toBeDefined();
      expect(errorSourceMessages.server.description).toBeDefined();
      expect(typeof errorSourceMessages.server.title).toBe('string');
      expect(typeof errorSourceMessages.server.description).toBe('string');
    });

    it('should distinguish network errors (Requirement 9.3)', () => {
      expect(errorSourceMessages.network).toBeDefined();
      expect(errorSourceMessages.network.title).toBeDefined();
      expect(errorSourceMessages.network.description).toBeDefined();
      expect(errorSourceMessages.network.description).toContain('connection');
    });

    it('should distinguish storage errors (Requirement 9.3)', () => {
      expect(errorSourceMessages.storage).toBeDefined();
      expect(errorSourceMessages.storage.title).toBeDefined();
      expect(errorSourceMessages.storage.description).toBeDefined();
      expect(errorSourceMessages.storage.description).toContain('storage');
    });

    it('should have different messages for each error source', () => {
      const sources = ['client', 'server', 'network', 'storage'] as const;
      const descriptions = sources.map(s => errorSourceMessages[s].description);
      const uniqueDescriptions = new Set(descriptions);
      expect(uniqueDescriptions.size).toBe(sources.length);
    });
  });

  describe('Form-Specific Error Messages', () => {
    it('should have message for form load with missing JWT (Requirement 9.1)', () => {
      expect(formAuthErrorMessages.loadMissingJwt).toBeDefined();
      expect(formAuthErrorMessages.loadMissingJwt).toContain('log in');
      expect(typeof formAuthErrorMessages.loadMissingJwt).toBe('string');
    });

    it('should have message for form load with expired JWT (Requirement 9.2)', () => {
      expect(formAuthErrorMessages.loadExpiredJwt).toBeDefined();
      expect(formAuthErrorMessages.loadExpiredJwt).toContain('expired');
      expect(typeof formAuthErrorMessages.loadExpiredJwt).toBe('string');
    });

    it('should have message for form submit with missing JWT', () => {
      expect(formAuthErrorMessages.submitMissingJwt).toBeDefined();
      expect(typeof formAuthErrorMessages.submitMissingJwt).toBe('string');
    });

    it('should have message for form submit with expired JWT', () => {
      expect(formAuthErrorMessages.submitExpiredJwt).toBeDefined();
      expect(typeof formAuthErrorMessages.submitExpiredJwt).toBe('string');
    });

    it('should have message for form submit auth failure', () => {
      expect(formAuthErrorMessages.submitAuthFailed).toBeDefined();
      expect(formAuthErrorMessages.submitAuthFailed).toContain('saved');
      expect(typeof formAuthErrorMessages.submitAuthFailed).toBe('string');
    });

    it('should have message for validation in progress', () => {
      expect(formAuthErrorMessages.validationRequired).toBeDefined();
      expect(typeof formAuthErrorMessages.validationRequired).toBe('string');
    });

    it('should have message for recovery in progress', () => {
      expect(formAuthErrorMessages.recoveryInProgress).toBeDefined();
      expect(typeof formAuthErrorMessages.recoveryInProgress).toBe('string');
    });
  });

  describe('Debug Error Messages', () => {
    it('should generate JWT details message', () => {
      const message = debugErrorMessages.jwtDetails(true, true, false);
      expect(message).toContain('JWT');
      expect(message).toContain('present');
      expect(message).toContain('valid: true');
      expect(message).toContain('expired: false');
    });

    it('should generate session details message', () => {
      const message = debugErrorMessages.sessionDetails(true, true);
      expect(message).toContain('Session');
      expect(message).toContain('present');
      expect(message).toContain('valid: true');
    });

    it('should generate auth state details message', () => {
      const message = debugErrorMessages.authStateDetails(true, true, true);
      expect(message).toContain('Auth State');
      expect(message).toContain('session=true');
      expect(message).toContain('jwt=true');
      expect(message).toContain('authenticated=true');
    });

    it('should generate token operation message', () => {
      const message = debugErrorMessages.tokenOperation('set', true, 'login');
      expect(message).toContain('Token set');
      expect(message).toContain('success');
      expect(message).toContain('login');
    });

    it('should generate redirect details message', () => {
      const message = debugErrorMessages.redirectDetails('/form', '/login', 'expired');
      expect(message).toContain('Redirect');
      expect(message).toContain('/form');
      expect(message).toContain('/login');
      expect(message).toContain('expired');
    });
  });

  describe('getAuthErrorMessage helper', () => {
    it('should return JWT error message for jwt category', () => {
      const message = getAuthErrorMessage('jwt', 'missing');
      expect(message).toBe(jwtErrorMessages.missing);
    });

    it('should return session error message for session category', () => {
      const message = getAuthErrorMessage('session', 'expired');
      expect(message).toBe(sessionErrorMessages.expired);
    });

    it('should return sync error message for sync category', () => {
      const message = getAuthErrorMessage('sync', 'bothInvalid');
      expect(message).toBe(syncErrorMessages.bothInvalid);
    });

    it('should return API error message for api category', () => {
      const message = getAuthErrorMessage('api', 'unauthorized');
      expect(message).toBe(apiAuthErrorMessages.unauthorized);
    });

    it('should return form error message for form category', () => {
      const message = getAuthErrorMessage('form', 'loadMissingJwt');
      expect(message).toBe(formAuthErrorMessages.loadMissingJwt);
    });

    it('should return default message for unknown category', () => {
      const message = getAuthErrorMessage('unknown' as any, 'test');
      expect(message).toContain('Authentication error');
    });

    it('should return default message for unknown error type', () => {
      const message = getAuthErrorMessage('jwt', 'unknownError');
      expect(message).toBe(jwtErrorMessages.invalid);
    });
  });

  describe('getRedirectMessage helper', () => {
    it('should return redirect message without form data preservation (Requirement 9.4)', () => {
      const message = getRedirectMessage('missingJwt', false);
      expect(message).toBe(redirectReasonMessages.missingJwt);
      expect(message).not.toContain('saved');
    });

    it('should return redirect message with form data preservation (Requirement 9.4, 9.5)', () => {
      const message = getRedirectMessage('expiredJwt', true);
      expect(message).toContain(redirectReasonMessages.expiredJwt);
      expect(message).toContain(formDataMessages.preserved);
      expect(message).toContain('saved');
    });

    it('should handle all redirect reason types', () => {
      const reasons: Array<keyof typeof redirectReasonMessages> = [
        'missingJwt',
        'expiredJwt',
        'invalidJwt',
        'invalidSession',
        'apiUnauthorized',
        'recoveryFailed',
        'syncFailed',
      ];

      reasons.forEach(reason => {
        const message = getRedirectMessage(reason, false);
        expect(message).toBeDefined();
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      });
    });

    it('should append preservation message when formDataPreserved is true', () => {
      const messageWithoutPreservation = getRedirectMessage('invalidJwt', false);
      const messageWithPreservation = getRedirectMessage('invalidJwt', true);
      
      expect(messageWithPreservation.length).toBeGreaterThan(messageWithoutPreservation.length);
      expect(messageWithPreservation).toContain(messageWithoutPreservation);
      expect(messageWithPreservation).toContain('saved');
    });
  });

  describe('getErrorSourceMessage helper', () => {
    it('should return client error source message (Requirement 9.3)', () => {
      const message = getErrorSourceMessage('client');
      expect(message).toEqual(errorSourceMessages.client);
      expect(message.title).toBeDefined();
      expect(message.description).toBeDefined();
    });

    it('should return server error source message (Requirement 9.3)', () => {
      const message = getErrorSourceMessage('server');
      expect(message).toEqual(errorSourceMessages.server);
      expect(message.title).toBeDefined();
      expect(message.description).toBeDefined();
    });

    it('should return network error source message (Requirement 9.3)', () => {
      const message = getErrorSourceMessage('network');
      expect(message).toEqual(errorSourceMessages.network);
      expect(message.description).toContain('connection');
    });

    it('should return storage error source message (Requirement 9.3)', () => {
      const message = getErrorSourceMessage('storage');
      expect(message).toEqual(errorSourceMessages.storage);
      expect(message.description).toContain('storage');
    });

    it('should return different messages for different sources', () => {
      const client = getErrorSourceMessage('client');
      const server = getErrorSourceMessage('server');
      const network = getErrorSourceMessage('network');
      const storage = getErrorSourceMessage('storage');

      expect(client.description).not.toBe(server.description);
      expect(server.description).not.toBe(network.description);
      expect(network.description).not.toBe(storage.description);
    });
  });

  describe('Message Quality', () => {
    it('should have user-friendly messages (no technical jargon)', () => {
      const allMessages = [
        ...Object.values(jwtErrorMessages),
        ...Object.values(sessionErrorMessages),
        ...Object.values(syncErrorMessages),
        ...Object.values(apiAuthErrorMessages),
        ...Object.values(formDataMessages),
        ...Object.values(redirectReasonMessages),
        ...Object.values(formAuthErrorMessages),
      ];

      allMessages.forEach(message => {
        // Should not contain technical terms
        expect(message.toLowerCase()).not.toContain('jwt');
        expect(message.toLowerCase()).not.toContain('token');
        expect(message.toLowerCase()).not.toContain('bearer');
        expect(message.toLowerCase()).not.toContain('401');
        expect(message.toLowerCase()).not.toContain('unauthorized');
      });
    });

    it('should have actionable messages (tell user what to do)', () => {
      const allMessages = [
        ...Object.values(jwtErrorMessages),
        ...Object.values(sessionErrorMessages),
        ...Object.values(syncErrorMessages),
        ...Object.values(apiAuthErrorMessages),
        ...Object.values(formAuthErrorMessages),
      ];

      allMessages.forEach(message => {
        // Should contain actionable guidance
        const hasAction = 
          message.toLowerCase().includes('log in') ||
          message.toLowerCase().includes('try again') ||
          message.toLowerCase().includes('check') ||
          message.toLowerCase().includes('verifying') ||
          message.toLowerCase().includes('restoring');
        
        expect(hasAction).toBe(true);
      });
    });

    it('should have consistent tone across all messages', () => {
      const allMessages = [
        ...Object.values(jwtErrorMessages),
        ...Object.values(sessionErrorMessages),
        ...Object.values(syncErrorMessages),
        ...Object.values(apiAuthErrorMessages),
      ];

      allMessages.forEach(message => {
        // Should be polite and professional
        expect(message).not.toContain('!');
        expect(message).not.toContain('ERROR');
        expect(message).not.toContain('FAILED');
        
        // Should end with period
        expect(message.endsWith('.')).toBe(true);
      });
    });

    it('should not expose sensitive information in any message', () => {
      const allMessages = [
        ...Object.values(jwtErrorMessages),
        ...Object.values(sessionErrorMessages),
        ...Object.values(syncErrorMessages),
        ...Object.values(apiAuthErrorMessages),
        ...Object.values(formDataMessages),
        ...Object.values(redirectReasonMessages),
        ...Object.values(formAuthErrorMessages),
      ];

      allMessages.forEach(message => {
        // Should not contain sensitive terms
        expect(message.toLowerCase()).not.toContain('password');
        expect(message.toLowerCase()).not.toContain('secret');
        expect(message.toLowerCase()).not.toContain('key');
        expect(message.toLowerCase()).not.toContain('credential');
      });
    });
  });
});
