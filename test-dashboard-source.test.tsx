/**
 * Quick verification test for Task 7
 * Verifies that dashboard page passes 'dashboard' source to hasToken()
 */

import { render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import * as tokenManager from '@/lib/api/tokenManager';
import DashboardPage from '@/app/dashboard/page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/auth/LogoutStateManager', () => ({
  logoutStateManager: {
    isLogoutInProgress: jest.fn(() => false),
  },
}));

jest.mock('@/app/dashboard/DashboardClient', () => {
  return function MockDashboardClient() {
    return <div>Dashboard Content</div>;
  };
});

describe('Task 7: Dashboard source parameter verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
    });
  });

  it('should call hasToken with "dashboard" source parameter', () => {
    // Spy on hasToken to verify it's called with correct source
    const hasTokenSpy = jest.spyOn(tokenManager, 'hasToken');
    
    // Mock hasToken to return true so component renders
    hasTokenSpy.mockReturnValue(true);

    render(<DashboardPage />);

    // Verify hasToken was called with 'dashboard' as source
    expect(hasTokenSpy).toHaveBeenCalledWith('dashboard');
  });

  it('should pass source parameter through to getToken', () => {
    // Spy on getToken to verify source is passed through
    const getTokenSpy = jest.spyOn(tokenManager, 'getToken');
    
    // Mock getToken to return a valid token
    getTokenSpy.mockReturnValue('valid-token');

    render(<DashboardPage />);

    // Verify getToken was called with 'dashboard' as source
    // (hasToken internally calls getToken with the same source)
    expect(getTokenSpy).toHaveBeenCalledWith('dashboard');
  });
});
