'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { getAuthState } from '@/lib/auth/AuthCoordinator';

/**
 * Client Component: Forgot Password Page
 * 
 * This component provides the forgot password user interface with:
 * - Card-based layout for the form
 * - Page title and description
 * - Responsive design (mobile and desktop)
 * - Authentication state checking (redirects if already logged in)
 * 
 * Requirements: 10.1, 10.6
 */
export default function ForgotPasswordPageClient() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  /**
   * Check if user is already authenticated
   * If so, redirect to dashboard
   * Requirements: 10.6
   */
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const authState = await getAuthState();
        
        if (authState.isAuthenticated) {
          console.log('[ForgotPasswordPageClient] User already authenticated, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
        
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('[ForgotPasswordPageClient] Error checking auth state:', error);
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card variant="elevated" className="shadow-xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Forgot Password
            </h1>
            <p className="text-sm text-gray-600 sm:text-base">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </CardHeader>

          <CardContent className="pb-8">
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
