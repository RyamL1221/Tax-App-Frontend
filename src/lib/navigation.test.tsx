import { navigateToTaxPreparation, navigateToLearnMore, navigateToSupport, handleNavigationError } from './navigation';

// Mock window methods
const mockReplace = jest.fn();
const mockOpen = jest.fn();
const mockAlert = jest.fn();

describe('Navigation Utilities Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.location.replace
    delete (window as any).location;
    window.location = { replace: mockReplace, href: '' } as any;
    
    // Mock window.open and window.alert
    window.open = mockOpen;
    window.alert = mockAlert;
  });

  describe('navigateToTaxPreparation', () => {
    test('navigates to tax preparation page with default options', async () => {
      const result = await navigateToTaxPreparation();
      
      expect(result.success).toBe(true);
      expect(window.location.href).toBe('/tax-preparation/start');
    });

    test('navigates with replace option', async () => {
      const result = await navigateToTaxPreparation({ replace: true });
      
      expect(result.success).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/tax-preparation/start');
    });

    test('opens in new tab with external option', async () => {
      const result = await navigateToTaxPreparation({ external: true });
      
      expect(result.success).toBe(true);
      expect(mockOpen).toHaveBeenCalledWith('/tax-preparation/start', '_blank');
    });

    test('handles navigation errors', async () => {
      // Mock an error by making location.href throw
      Object.defineProperty(window.location, 'href', {
        set: () => {
          throw new Error('Navigation blocked');
        }
      });

      const result = await navigateToTaxPreparation();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Navigation blocked');
    });

    test('handles server environment gracefully', async () => {
      // Temporarily remove window
      const originalWindow = global.window;
      delete (global as any).window;

      const result = await navigateToTaxPreparation();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Navigation not available in server environment');

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('navigateToLearnMore', () => {
    test('navigates to learn more page with default options', async () => {
      const result = await navigateToLearnMore();
      
      expect(result.success).toBe(true);
      expect(window.location.href).toBe('/learn-more');
    });

    test('navigates with replace option', async () => {
      const result = await navigateToLearnMore({ replace: true });
      
      expect(result.success).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/learn-more');
    });

    test('opens in new tab with external option', async () => {
      const result = await navigateToLearnMore({ external: true });
      
      expect(result.success).toBe(true);
      expect(mockOpen).toHaveBeenCalledWith('/learn-more', '_blank');
    });

    test('handles navigation errors', async () => {
      Object.defineProperty(window.location, 'href', {
        set: () => {
          throw new Error('Learn more navigation failed');
        }
      });

      const result = await navigateToLearnMore();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Learn more navigation failed');
    });
  });

  describe('navigateToSupport', () => {
    test('navigates to support page with default options', async () => {
      const result = await navigateToSupport();
      
      expect(result.success).toBe(true);
      expect(window.location.href).toBe('/support');
    });

    test('navigates with replace option', async () => {
      const result = await navigateToSupport({ replace: true });
      
      expect(result.success).toBe(true);
      expect(mockReplace).toHaveBeenCalledWith('/support');
    });

    test('opens in new tab with external option', async () => {
      const result = await navigateToSupport({ external: true });
      
      expect(result.success).toBe(true);
      expect(mockOpen).toHaveBeenCalledWith('/support', '_blank');
    });

    test('handles navigation errors', async () => {
      Object.defineProperty(window.location, 'href', {
        set: () => {
          throw new Error('Support navigation failed');
        }
      });

      const result = await navigateToSupport();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Support navigation failed');
    });
  });

  describe('handleNavigationError', () => {
    test('logs error to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      handleNavigationError('Test error message');
      
      expect(consoleSpy).toHaveBeenCalledWith('Navigation error:', 'Test error message');
      
      consoleSpy.mockRestore();
    });

    test('shows alert to user', () => {
      handleNavigationError('Test error message');
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Navigation failed: Test error message. Please try again or contact support.'
      );
    });

    test('handles empty error message', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      handleNavigationError('');
      
      expect(consoleSpy).toHaveBeenCalledWith('Navigation error:', '');
      expect(mockAlert).toHaveBeenCalledWith(
        'Navigation failed: . Please try again or contact support.'
      );
      
      consoleSpy.mockRestore();
    });

    test('handles server environment gracefully', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Should not throw error
      expect(() => handleNavigationError('Server error')).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Navigation error:', 'Server error');
      
      global.window = originalWindow;
      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('handles window.open failures', async () => {
      mockOpen.mockImplementation(() => {
        throw new Error('Popup blocked');
      });

      const result = await navigateToTaxPreparation({ external: true });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Popup blocked');
    });

    test('handles window.location.replace failures', async () => {
      mockReplace.mockImplementation(() => {
        throw new Error('Replace failed');
      });

      const result = await navigateToLearnMore({ replace: true });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Replace failed');
    });

    test('handles non-Error exceptions', async () => {
      Object.defineProperty(window.location, 'href', {
        set: () => {
          throw 'String error';
        }
      });

      const result = await navigateToSupport();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Navigation failed');
    });

    test('handles undefined window properties', async () => {
      const originalLocation = window.location;
      delete (mockWindow as any).location;

      const result = await navigateToTaxPreparation();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      window.location = originalLocation;
    });
  });

  describe('Navigation Options Combinations', () => {
    test('handles both replace and external options', async () => {
      const result = await navigateToTaxPreparation({ replace: true, external: true });
      
      // External should take precedence
      expect(result.success).toBe(true);
      expect(mockOpen).toHaveBeenCalledWith('/tax-preparation/start', '_blank');
      expect(mockReplace).not.toHaveBeenCalled();
    });

    test('handles empty options object', async () => {
      const result = await navigateToLearnMore({});
      
      expect(result.success).toBe(true);
      expect(window.location.href).toBe('/learn-more');
    });

    test('handles undefined options', async () => {
      const result = await navigateToSupport(undefined);
      
      expect(result.success).toBe(true);
      expect(window.location.href).toBe('/support');
    });
  });

  describe('URL Validation', () => {
    test('navigates to correct URLs', async () => {
      await navigateToTaxPreparation();
      expect(window.location.href).toBe('/tax-preparation/start');

      window.location.href = '';
      await navigateToLearnMore();
      expect(window.location.href).toBe('/learn-more');

      window.location.href = '';
      await navigateToSupport();
      expect(window.location.href).toBe('/support');
    });

    test('URLs are properly formatted', async () => {
      await navigateToTaxPreparation({ external: true });
      expect(mockOpen).toHaveBeenCalledWith('/tax-preparation/start', '_blank');

      await navigateToLearnMore({ external: true });
      expect(mockOpen).toHaveBeenCalledWith('/learn-more', '_blank');

      await navigateToSupport({ external: true });
      expect(mockOpen).toHaveBeenCalledWith('/support', '_blank');
    });
  });

  describe('Async Behavior', () => {
    test('all navigation functions return promises', () => {
      const taxPrepPromise = navigateToTaxPreparation();
      const learnMorePromise = navigateToLearnMore();
      const supportPromise = navigateToSupport();

      expect(taxPrepPromise).toBeInstanceOf(Promise);
      expect(learnMorePromise).toBeInstanceOf(Promise);
      expect(supportPromise).toBeInstanceOf(Promise);
    });

    test('promises resolve with correct result structure', async () => {
      const result = await navigateToTaxPreparation();
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });
  });
});
