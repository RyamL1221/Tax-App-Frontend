import { Metadata } from 'next';
import ForgotPasswordPageClient from './ForgotPasswordPageClient';

export const metadata: Metadata = {
  title: 'Forgot Password - Tax App',
  description: 'Request a password reset email for your Tax App account',
};

/**
 * Forgot Password Page
 * 
 * Server component that renders the forgot password page.
 * Provides metadata for SEO and renders the client component.
 * 
 * Requirements: 10.1
 */
export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
