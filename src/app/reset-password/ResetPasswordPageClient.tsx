'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { getAuthState } from '@/lib/auth/AuthCoordinator';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const token = searchParams.get('token');

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const authState = await getAuthState();
        if (authState.isAuthenticated) {
          router.push('/dashboard');
          return;
        }
        setIsCheckingAuth(false);
      } catch (error) {
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

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <Card variant="elevated" className="shadow-xl">
            <CardContent className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Invalid Reset Link</h1>
                <p className="mt-2 text-sm text-gray-600">This password reset link is invalid or has expired.</p>
              </div>
              <div className="pt-4">
                <Link href="/forgot-password" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Request a New Reset Link
                </Link>
              </div>
              <div>
                <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">Back to Login</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card variant="elevated" className="shadow-xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Reset Password</h1>
            <p className="text-sm text-gray-600 sm:text-base">Enter your new password below.</p>
          </CardHeader>
          <CardContent className="pb-8">
            <ResetPasswordForm token={token} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPageClient() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-gray-600">Loading...</div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
