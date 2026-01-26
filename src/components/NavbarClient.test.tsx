/**
 * Unit tests for NavbarClient component
 * 
 * Tests verify:
 * - Component rendering with null session (unauthenticated)
 * - Component rendering with valid session (authenticated)
 * - Home link present in both states
 * - Link href attributes are correct
 * - Login and Register links only shown when unauthenticated
 * - Dashboard link only shown when authenticated
 * - Keyboard accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import NavbarClient from './NavbarClient';
import type { SessionData } from '@/lib/session';

describe('NavbarClient', () => {
  const mockSession: SessionData = {
    userId: 'test-user-123',
    email: 'test@example.com',
    createdAt: Date.now() - 1000,
    expiresAt: Date.now() + 10000,
  };

  describe('Unauthenticated State (session=null)', () => {
    it('should render Home link', () => {
      render(<NavbarClient session={null} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should render Login link with correct href', () => {
      render(<NavbarClient session={null} />);

      const loginLink = screen.getByRole('link', { name: /login/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should render Register link with correct href', () => {
      render(<NavbarClient session={null} />);

      const registerLink = screen.getByRole('link', { name: /register/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should NOT render Dashboard link', () => {
      render(<NavbarClient session={null} />);

      const dashboardLink = screen.queryByRole('link', { name: /dashboard/i });
      expect(dashboardLink).not.toBeInTheDocument();
    });

    it('should render exactly 3 links (Home, Login, Register)', () => {
      render(<NavbarClient session={null} />);

      const allLinks = screen.getAllByRole('link');
      expect(allLinks).toHaveLength(3);
    });
  });

  describe('Authenticated State (valid session)', () => {
    it('should render Home link', () => {
      render(<NavbarClient session={mockSession} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should render Dashboard link with correct href', () => {
      render(<NavbarClient session={mockSession} />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('should NOT render Login link', () => {
      render(<NavbarClient session={mockSession} />);

      const loginLink = screen.queryByRole('link', { name: /^login$/i });
      expect(loginLink).not.toBeInTheDocument();
    });

    it('should NOT render Register link', () => {
      render(<NavbarClient session={mockSession} />);

      const registerLink = screen.queryByRole('link', { name: /^register$/i });
      expect(registerLink).not.toBeInTheDocument();
    });

    it('should render exactly 2 links (Home, Dashboard)', () => {
      render(<NavbarClient session={mockSession} />);

      const allLinks = screen.getAllByRole('link');
      expect(allLinks).toHaveLength(2);
    });
  });

  describe('Link Attributes', () => {
    it('should have correct href for Home link', () => {
      render(<NavbarClient session={null} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('should have correct href for Login link when unauthenticated', () => {
      render(<NavbarClient session={null} />);

      const loginLink = screen.getByRole('link', { name: /login/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should have correct href for Register link when unauthenticated', () => {
      render(<NavbarClient session={null} />);

      const registerLink = screen.getByRole('link', { name: /register/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should have correct href for Dashboard link when authenticated', () => {
      render(<NavbarClient session={mockSession} />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should render all links as anchor elements (unauthenticated)', () => {
      render(<NavbarClient session={null} />);

      const allLinks = screen.getAllByRole('link');
      allLinks.forEach(link => {
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href');
      });
    });

    it('should render all links as anchor elements (authenticated)', () => {
      render(<NavbarClient session={mockSession} />);

      const allLinks = screen.getAllByRole('link');
      allLinks.forEach(link => {
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href');
      });
    });

    it('should have proper link role for accessibility', () => {
      render(<NavbarClient session={null} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      const loginLink = screen.getByRole('link', { name: /login/i });
      const registerLink = screen.getByRole('link', { name: /register/i });

      expect(homeLink).toBeInTheDocument();
      expect(loginLink).toBeInTheDocument();
      expect(registerLink).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render a nav element', () => {
      const { container } = render(<NavbarClient session={null} />);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('should have consistent structure for unauthenticated state', () => {
      const { container } = render(<NavbarClient session={null} />);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();

      // Should have Home, Login, and Register links
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(3);
    });

    it('should have consistent structure for authenticated state', () => {
      const { container } = render(<NavbarClient session={mockSession} />);

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();

      // Should have Home and Dashboard links
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });
  });

  describe('Session State Transitions', () => {
    it('should update from unauthenticated to authenticated', () => {
      const { rerender } = render(<NavbarClient session={null} />);

      // Initial unauthenticated state
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();

      // Update to authenticated state
      rerender(<NavbarClient session={mockSession} />);

      expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^register$/i })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('should update from authenticated to unauthenticated', () => {
      const { rerender } = render(<NavbarClient session={mockSession} />);

      // Initial authenticated state
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /register/i })).not.toBeInTheDocument();

      // Update to unauthenticated state
      rerender(<NavbarClient session={null} />);

      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    });

    it('should maintain Home link across state transitions', () => {
      const { rerender } = render(<NavbarClient session={null} />);

      // Home link in unauthenticated state
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();

      // Home link in authenticated state
      rerender(<NavbarClient session={mockSession} />);
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();

      // Home link back in unauthenticated state
      rerender(<NavbarClient session={null} />);
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle session with minimal valid data', () => {
      const minimalSession: SessionData = {
        userId: 'u',
        email: 'a@b.c',
        createdAt: 0,
        expiresAt: 1,
      };

      render(<NavbarClient session={minimalSession} />);

      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
    });

    it('should handle session with very long email', () => {
      const longEmailSession: SessionData = {
        userId: 'test-user',
        email: 'very.long.email.address.that.is.quite.lengthy@example.com',
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      render(<NavbarClient session={longEmailSession} />);

      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('should handle session with special characters in userId', () => {
      const specialSession: SessionData = {
        userId: 'user-123_test@special',
        email: 'test@example.com',
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      render(<NavbarClient session={specialSession} />);

      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });
  });
});
