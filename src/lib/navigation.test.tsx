import { navigateToTaxPreparation, navigateToLearnMore, navigateToSupport, handleNavigationError } from './navigation';

// Mock window object
const mockWindow = {
  location: {
    href: '',
    replace: jest.fn(),
  },
  open: jest.fn(),
  alert: jest.fn()
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

describe('Navigation Utilities Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindow.location.href = '';
    mockWindow.location.replace.mockClear();
    mockWindow.open.mockClear();
    mockWindow.alert.mockClear();
  });

  describe('navigateToTaxPreparation', () => {
    test('navigates to tax preparation page with default options', async () => {
      const result = await navigateToTaxPreparation();
      
      expect(result.success).toBe(true);
      expect(mockWindow.location.href).toBe('/tax-preparation/start');
    });

    test('navigates with replace option', async () => {
      const result = await navigateToTaxPreparation({ replace: true });
      
      expect(result.success).toBe(true);
      expect(mockWindow.location.replace).toHaveBeenCalledWith('/tax-preparation/start');
    });

    test('opens in new tab with external option', async () => {
      const result = await navigateToTaxPreparation({ external: true });
      
      expect(result.success).toBe(true);
      expect(mockWindow.open).toHaveBeenCalledWith('/tax-preparation/start', '_blank');
    });

    test('handles navigation errors', async () => {
      // Mock an error by making location.href throw
      Object.defineProperty(mockWindow.location, 'href', {
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
      expect(mockWindow.location.href).toBe('/learn-more');
    });

    test('navigates with replace option', async () => {
      const result = await navigateToLearnMore({ replace: true });
      
      expect(result.success).toBe(true);
      expect(mockWindow.location.replace).toHaveBeenCalledWith('/learn-more');
    });

    test('opens in new tab with external option', async () => {
      const result = await navigateToLearnMore({ external: true });
      
      expect(result.success).toBe(true);
      expect(mockWindow.open).toHaveBeenCalledWith('/learn-more', '_blank');
    });

    test('handles navigation errors', async () => {
      Object.defineProperty(mockWindow.location, 'href', {
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
      expect(mockWindow.location.href).toBe('/support');
    });

    test('navigates with replace option', async () => {
      const result = await navigateToSupport({ replace: true });
      
      expect(result.success).toBe(true);
      expect(mockWindow.location.replace).toHaveBeenCalledWith('/support');
    });

    test('opens in new tab with external option', async () => {
      const result = await navigateToSupport({ external: true });
      
      expect(result.success).toBe(true);
      expect(mockWindow.open).toHaveBeenCalledWith('/support', '_blank');
    });

    test('handles navigation errors', async () => {
      Object.defineProperty(mockWindow.location, 'href', {
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
      
      expect(mockWindow.alert).toHaveBeenCalledWith(
        'Navigation failed: Test error message. Please try again or contact support.'
      );
    });

    test('handles empty error message', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      handleNavigationError('');
      
      expect(consoleSpy).toHaveBeenCalledWith('Navigation error:', '');
      expect(mockWindow.alert).toHaveBeenCalledWith(
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
      mockWindow.open.mockImplementation(() => {
        throw new Error('Popup blocked');
      });

      const result = await navigateToTaxPreparation({ external: true });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Popup blocked');
    });

    test('handles window.location.replace failures', async () => {
      mockWindow.location.replace.mockImplementation(() => {
        throw new Error('Replace failed');
      });

      const result = await navigateToLearnMore({ replace: true });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Replace failed');
    });

    test('handles non-Error exceptions', async () => {
      Object.defineProperty(mockWindow.location, 'href', {
        set: () => {
          throw 'String error';
        }
      });

      const result = await navigateToSupport();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Navigation failed');
    });

    test('handles undefined window properties', async () => {
      const originalLocation = mockWindow.location;
      delete (mockWindow as any).location;

      const result = await navigateToTaxPreparation();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      mockWindow.location = originalLocation;
    });
  });

  describe('Navigation Options Combinations', () => {
    test('handles both replace and external options', async () => {
      const result = await navigateToTaxPreparation({ replace: true, external: true });
      
      // External should take precedence
      expect(result.success).toBe(true);
      expect(mockWindow.open).toHaveBeenCalledWith('/tax-preparation/start', '_blank');
      expect(mockWindow.location.replace).not.toHaveBeenCalled();
    });

    test('handles empty options object', async () => {
      const result = await navigateToLearnMore({});
      
      expect(result.success).toBe(true);
      expect(mockWindow.location.href).toBe('/learn-more');
    });

    test('handles undefined options', async () => {
      const result = await navigateToSupport(undefined);
      
      expect(result.success).toBe(true);
      expect(mockWindow.location.href).toBe('/support');
    });
  });

  describe('URL Validation', () => {
    test('navigates to correct URLs', async () => {
      await navigateToTaxPreparation();
      expect(mockWindow.location.href).toBe('/tax-preparation/start');

      mockWindow.location.href = '';
      await navigateToLearnMore();
      expect(mockWindow.location.href).toBe('/learn-more');

      mockWindow.location.href = '';
      await navigateToSupport();
      expect(mockWindow.location.href).toBe('/support');
    });

    test('URLs are properly formatted', async () => {
      await navigateToTaxPreparation({ external: true });
      expect(mockWindow.open).toHaveBeenCalledWith('/tax-preparation/start', '_blank');

      await navigateToLearnMore({ external: true });
      expect(mockWindow.open).toHaveBeenCalledWith('/learn-more', '_blank');

      await navigateToSupport({ external: true });
      expect(mockWindow.open).toHaveBeenCalledWith('/support', '_blank');
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