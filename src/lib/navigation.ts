/**
 * Navigation utilities for Tax App Landing Page
 * Handles routing to next steps in application flow with error handling
 */

export interface NavigationOptions {
  replace?: boolean;
  external?: boolean;
}

export interface NavigationResult {
  success: boolean;
  error?: string;
}

/**
 * Navigate to the tax preparation start page
 */
export const navigateToTaxPreparation = async (options: NavigationOptions = {}): Promise<NavigationResult> => {
  try {
    const url = '/tax-preparation/start';
    
    if (options.external) {
      window.open(url, '_blank');
      return { success: true };
    }
    
    if (typeof window !== 'undefined') {
      if (options.replace) {
        window.location.replace(url);
      } else {
        window.location.href = url;
      }
      return { success: true };
    }
    
    return { success: false, error: 'Navigation not available in server environment' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Navigation failed' 
    };
  }
};

/**
 * Navigate to the learn more page
 */
export const navigateToLearnMore = async (options: NavigationOptions = {}): Promise<NavigationResult> => {
  try {
    const url = '/learn-more';
    
    if (options.external) {
      window.open(url, '_blank');
      return { success: true };
    }
    
    if (typeof window !== 'undefined') {
      if (options.replace) {
        window.location.replace(url);
      } else {
        window.location.href = url;
      }
      return { success: true };
    }
    
    return { success: false, error: 'Navigation not available in server environment' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Navigation failed' 
    };
  }
};

/**
 * Navigate to the support page
 */
export const navigateToSupport = async (options: NavigationOptions = {}): Promise<NavigationResult> => {
  try {
    const url = '/support';
    
    if (options.external) {
      window.open(url, '_blank');
      return { success: true };
    }
    
    if (typeof window !== 'undefined') {
      if (options.replace) {
        window.location.replace(url);
      } else {
        window.location.href = url;
      }
      return { success: true };
    }
    
    return { success: false, error: 'Navigation not available in server environment' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Navigation failed' 
    };
  }
};

/**
 * Handle navigation errors with user-friendly messages
 */
export const handleNavigationError = (error: string): void => {
  console.error('Navigation error:', error);
  
  // In a real application, you might want to show a toast notification
  // or redirect to an error page. For now, we'll use an alert.
  if (typeof window !== 'undefined') {
    alert(`Navigation failed: ${error}. Please try again or contact support.`);
  }
};