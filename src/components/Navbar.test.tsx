/**
 * Unit tests for Navbar server component
 * 
 * Tests:
 * - getSession() is called
 * - Session data is passed to NavbarClient
 * - Error handling when getSession() throws
 * - Errors result in null session being passed
 * 
 * Requirements: 4.3
 */

import React from 'react';
import { render } from '@testing-library/react';
import Navbar from './Navbar';
import * as sessionModule from '@/lib/session';
import type { SessionData } from '@/lib/session';

// Mock the session module
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

// Mock the NavbarClient component
jest.mock('./NavbarClient', () => {
  return function MockNavbarClient({ session }: { session: SessionData | null }) {
    return (
      <div data-testid="navbar-client" data-session={JSON.stringify(session)}>
        NavbarClient
      </div>
    );
  };
});

describe('Navbar Server Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call getSession()', async () => {
    const mockGetSession = sessionModule.getSession as jest.MockedFunction<typeof sessionModule.getSession>;
    mockGetSession.mockResolvedValue(null);

    await Navbar();

    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it('should pass session data to NavbarClient when session exists', async () => {
    const mockSession: SessionData = {
      userId: 'user123',
      email: 'test@example.com',
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000000,
    };

    const mockGetSession = sessionModule.getSession as jest.MockedFunction<typeof sessionModule.getSession>;
    mockGetSession.mockResolvedValue(mockSession);

    const result = await Navbar();
    const { getByTestId } = render(result);

    const navbarClient = getByTestId('navbar-client');
    const sessionData = JSON.parse(navbarClient.getAttribute('data-session') || 'null');

    expect(sessionData).toEqual(mockSession);
  });

  it('should pass null to NavbarClient when session does not exist', async () => {
    const mockGetSession = sessionModule.getSession as jest.MockedFunction<typeof sessionModule.getSession>;
    mockGetSession.mockResolvedValue(null);

    const result = await Navbar();
    const { getByTestId } = render(result);

    const navbarClient = getByTestId('navbar-client');
    const sessionData = JSON.parse(navbarClient.getAttribute('data-session') || 'null');

    expect(sessionData).toBeNull();
  });

  it('should handle errors from getSession() and pass null to NavbarClient', async () => {
    const mockGetSession = sessionModule.getSession as jest.MockedFunction<typeof sessionModule.getSession>;
    const testError = new Error('Session retrieval failed');
    mockGetSession.mockRejectedValue(testError);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await Navbar();
    const { getByTestId } = render(result);

    const navbarClient = getByTestId('navbar-client');
    const sessionData = JSON.parse(navbarClient.getAttribute('data-session') || 'null');

    expect(sessionData).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to retrieve session:', testError);
  });

  it('should log error when getSession() throws', async () => {
    const mockGetSession = sessionModule.getSession as jest.MockedFunction<typeof sessionModule.getSession>;
    const testError = new Error('Database connection failed');
    mockGetSession.mockRejectedValue(testError);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await Navbar();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to retrieve session:', testError);
  });

  it('should treat any error as unauthenticated state', async () => {
    const mockGetSession = sessionModule.getSession as jest.MockedFunction<typeof sessionModule.getSession>;
    mockGetSession.mockRejectedValue(new Error('Network error'));

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await Navbar();
    const { getByTestId } = render(result);

    const navbarClient = getByTestId('navbar-client');
    const sessionData = JSON.parse(navbarClient.getAttribute('data-session') || 'null');

    // Should pass null session, treating error as unauthenticated
    expect(sessionData).toBeNull();
  });
});
