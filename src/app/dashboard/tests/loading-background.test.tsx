/**
 * Tests for Dashboard Loading UI Background Color
 * 
 * Validates that loading states have proper white background to prevent black screen.
 * 
 * Requirements:
 * - 2.5: Loading state SHALL be visually distinct from black screen error state
 * - 8.5: Background SHALL be white or theme background color in any loading state
 */

import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { hasToken } from '@/lib/api/tokenManager';
import { logoutStateManager } from '@/lib/auth/LogoutStateManager';
import DashboardPage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api/tokenManager', () => ({
  hasToken: jest.fn(),
}));

jest.mock('@/lib/auth/LogoutStateManager', () => ({
  logoutStateManager: {
    isLogoutInProgress: jest.fn(),
  },
}));

jest.mock('./DashboardClient', () => {
  return function MockDashboardClient() {
    return <div>Dashboard Content</div>;
  };
});

describe('Dashboard Loading UI Background Color - Task 5.2', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(false);
  });

  describe('Authentication Loading State - Requirements 2.5, 8.5', () => {
    it('should have white background during authentication check', () => {
      // Mock hasToken to return false (will trigger redirect)
      (hasToken as jest.Mock).mockReturnValue(false);

      const { container } = render(<DashboardPage />);

      // Find the loading state container
      const loadingDiv = container.querySelector('.min-h-screen');
      
      // Verify the loading div exists
      expect(loadingDiv).toBeInTheDocument();
      
      // Verify it has the bg-white class
      expect(loadingDiv).toHaveClass('bg-white');
      
      // Verify it does NOT have any black background classes
      expect(loadingDiv).not.toHaveClass('bg-black');
      expect(loadingDiv).not.toHaveClass('bg-gray-900');
    });

    it('should display loading text with white background', () => {
      (hasToken as jest.Mock).mockReturnValue(false);

      const { container } = render(<DashboardPage />);

      // Verify loading text is present
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Verify parent container has white background
      const loadingDiv = container.querySelector('.min-h-screen');
      expect(loadingDiv).toHaveClass('bg-white');
    });

    it('should have consistent styling classes for loading state', () => {
      (hasToken as jest.Mock).mockReturnValue(false);

      const { container } = render(<DashboardPage />);

      const loadingDiv = container.querySelector('.min-h-screen');
      
      // Verify all expected classes are present
      expect(loadingDiv).toHaveClass('min-h-screen');
      expect(loadingDiv).toHaveClass('flex');
      expect(loadingDiv).toHaveClass('items-center');
      expect(loadingDiv).toHaveClass('justify-center');
      expect(loadingDiv).toHaveClass('bg-white');
    });
  });

  describe('Logout Loading State - Requirements 2.5, 8.5', () => {
    it('should have white background during logout transition', () => {
      // Mock logout in progress
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(true);

      const { container } = render(<DashboardPage />);

      // Find the logout UI container
      const logoutDiv = container.querySelector('.min-h-screen');
      
      // Verify the logout div exists
      expect(logoutDiv).toBeInTheDocument();
      
      // Verify it has the bg-white class
      expect(logoutDiv).toHaveClass('bg-white');
      
      // Verify it does NOT have any black background classes
      expect(logoutDiv).not.toHaveClass('bg-black');
      expect(logoutDiv).not.toHaveClass('bg-gray-900');
    });

    it('should display logout message with white background', () => {
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(true);

      const { container } = render(<DashboardPage />);

      // Verify logout text is present
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
      
      // Verify parent container has white background
      const logoutDiv = container.querySelector('.min-h-screen');
      expect(logoutDiv).toHaveClass('bg-white');
    });

    it('should have consistent styling classes for logout state', () => {
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(true);

      const { container } = render(<DashboardPage />);

      const logoutDiv = container.querySelector('.min-h-screen');
      
      // Verify all expected classes are present
      expect(logoutDiv).toHaveClass('min-h-screen');
      expect(logoutDiv).toHaveClass('flex');
      expect(logoutDiv).toHaveClass('items-center');
      expect(logoutDiv).toHaveClass('justify-center');
      expect(logoutDiv).toHaveClass('bg-white');
    });

    it('should display spinner with white background', () => {
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(true);

      const { container } = render(<DashboardPage />);

      // Find the spinner
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      
      // Verify parent container has white background
      const logoutDiv = container.querySelector('.min-h-screen');
      expect(logoutDiv).toHaveClass('bg-white');
    });
  });

  describe('No Black Screen in Any State - Requirements 1.2, 3.5, 8.3', () => {
    it('should never render with black background class', () => {
      // Test authentication loading state
      (hasToken as jest.Mock).mockReturnValue(false);
      const { container: container1, unmount: unmount1 } = render(<DashboardPage />);
      
      const allDivs1 = container1.querySelectorAll('div');
      allDivs1.forEach(div => {
        expect(div).not.toHaveClass('bg-black');
        expect(div).not.toHaveClass('bg-gray-900');
      });
      
      unmount1();

      // Test logout state
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(true);
      const { container: container2, unmount: unmount2 } = render(<DashboardPage />);
      
      const allDivs2 = container2.querySelectorAll('div');
      allDivs2.forEach(div => {
        expect(div).not.toHaveClass('bg-black');
        expect(div).not.toHaveClass('bg-gray-900');
      });
      
      unmount2();

      // Test authenticated state
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(false);
      (hasToken as jest.Mock).mockReturnValue(true);
      const { container: container3 } = render(<DashboardPage />);
      
      const allDivs3 = container3.querySelectorAll('div');
      allDivs3.forEach(div => {
        expect(div).not.toHaveClass('bg-black');
        expect(div).not.toHaveClass('bg-gray-900');
      });
    });

    it('should always have explicit background color in loading states', () => {
      // Test authentication loading
      (hasToken as jest.Mock).mockReturnValue(false);
      const { container: container1, unmount: unmount1 } = render(<DashboardPage />);
      
      const loadingDiv1 = container1.querySelector('.min-h-screen');
      expect(loadingDiv1).toHaveClass('bg-white');
      
      unmount1();

      // Test logout loading
      (logoutStateManager.isLogoutInProgress as jest.Mock).mockReturnValue(true);
      const { container: container2 } = render(<DashboardPage />);
      
      const loadingDiv2 = container2.querySelector('.min-h-screen');
      expect(loadingDiv2).toHaveClass('bg-white');
    });
  });

  describe('Visual Distinction from Error State - Requirement 2.5', () => {
    it('should have visually distinct loading state from potential error states', () => {
      (hasToken as jest.Mock).mockReturnValue(false);

      const { container } = render(<DashboardPage />);

      const loadingDiv = container.querySelector('.min-h-screen');
      
      // Loading state should have:
      // 1. White background (not black)
      expect(loadingDiv).toHaveClass('bg-white');
      
      // 2. Centered content
      expect(loadingDiv).toHaveClass('flex');
      expect(loadingDiv).toHaveClass('items-center');
      expect(loadingDiv).toHaveClass('justify-center');
      
      // 3. Loading text visible
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // 4. No error indicators
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    });
  });
});
