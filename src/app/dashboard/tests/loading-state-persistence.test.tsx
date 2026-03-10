/**
 * Loading State Persistence Test
 * 
 * Verifies that the loading state persists during redirect to prevent black screen.
 * 
 * Requirements:
 * - 2.2: Loading state persists during redirect
 * - 2.3: Loading UI visible until navigation completes
 * 
 * Task 5.1: Ensure loading state persists during redirect
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardPage from '../page';
import * as tokenManager from '@/lib/api/tokenManager';
import { logoutStateManager } from '@/lib/auth/LogoutStateManager';

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

describe('Dashboard Loading State Persistence - Task 5.1', () => {
  let mockPush: jest.Mock;
  let mockHasToken: jest.Mock;
  let mockIsLogoutInProgress: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockHasToken = tokenManager.hasToken as jest.Mock;
    mockIsLogoutInProgress = logoutStateManager.isLogoutInProgress as jest.Mock;
    mockIsLogoutInProgress.mockReturnValue(false);
  });

  it('keeps loading state visible during redirect (does not clear isAuthenticated)', async () => {
    // Requirement 2.2, 2.3: Loading state persists during redirect
    mockHasToken.mockReturnValue(false);

    const { container } = render(<DashboardPage />);

    // Initially, loading state should be visible
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for redirect to be initiated
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    // After redirect is initiated, loading state should STILL be visible
    // because isAuthenticated is never set to false - it stays null
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Verify no black screen or error state
    const loadingDiv = container.querySelector('.min-h-screen');
    expect(loadingDiv).toBeInTheDocument();
    expect(loadingDiv).not.toHaveClass('bg-black');
  });

  it('never sets isAuthenticated to false during redirect', async () => {
    // Requirement 2.2: Don't clear isAuthenticated from null until redirect completes
    mockHasToken.mockReturnValue(false);

    render(<DashboardPage />);

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    // The component should still show loading state, not dashboard content
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
  });

  it('maintains loading UI until navigation completes', async () => {
    // Requirement 2.3: Keep loading UI visible during navigation
    mockHasToken.mockReturnValue(false);

    const { rerender } = render(<DashboardPage />);

    // Initial loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    // Even after redirect is called, loading state persists
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Simulate re-render (as would happen during navigation)
    rerender(<DashboardPage />);

    // Loading state should still be visible
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('only sets isAuthenticated to true when authentication succeeds', async () => {
    // Verify that isAuthenticated is only set to true, never false
    mockHasToken.mockReturnValue(true);

    render(<DashboardPage />);

    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    // Dashboard content should be visible (isAuthenticated = true)
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('has comment explaining why state is not cleared', () => {
    // Verify the code has the required comment
    // This is a meta-test to ensure documentation is present
    const fs = require('fs');
    const path = require('path');
    const dashboardCode = fs.readFileSync(
      path.join(__dirname, 'page.tsx'),
      'utf-8'
    );

    // Check for the comment explaining Task 5.1
    expect(dashboardCode).toContain('Task 5.1: Keep isAuthenticated as null during redirect');
    expect(dashboardCode).toContain('This ensures the loading UI remains visible during navigation');
    expect(dashboardCode).toContain('preventing a black screen or flash of content');
  });
});
