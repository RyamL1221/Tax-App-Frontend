import { Metadata } from 'next';
import ResetPasswordPageClient from './ResetPasswordPageClient';

export const metadata: Metadata = {
  title: 'Reset Password - Tax App',
  description: 'Set a new password for your Tax App account',
};

/**
 * Reset Password Page
 * 
 * Server component that renders the reset password page.
 * Provides metadata for SEO and renders the client component.
 * 
 * Requirements: 10.2
 */
export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}
