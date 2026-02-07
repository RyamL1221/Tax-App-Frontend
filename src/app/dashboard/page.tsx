'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasToken } from '@/lib/api/tokenManager';
import DashboardClient from './DashboardClient';

/**
 * Dashboard Page
 * 
 * Client component that handles authentication verification and renders
 * the dashboard interface for authenticated users.
 * 
 * Requirements:
 * - 1.1: Display dashboard for authenticated users
 * - 1.2: Redirect unauthenticated users to login
 * - 5.1: Use JWT token authentication
 * - 5.4: Accessible at existing dashboard route
 */
export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = () => {
      try {
        // Check for valid JWT token
        const authenticated = hasToken();
        
        if (isMounted) {
          if (!authenticated) {
            // Redirect to login if no valid token
            try {
              router.push('/login');
            } catch (navError) {
              console.error('Navigation failed:', navError);
              // Fallback to hard navigation
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }
          } else {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        if (isMounted) {
          try {
            router.push('/login');
          } catch (navError) {
            console.error('Navigation failed:', navError);
            // Fallback to hard navigation
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Render dashboard for authenticated users
  return <DashboardClient />;
}

/**
 * Metadata for the dashboard page
 */
export const metadata = {
  title: 'Tax Form Dashboard | Tax App',
  description: 'Select and access tax forms for completion',
};
