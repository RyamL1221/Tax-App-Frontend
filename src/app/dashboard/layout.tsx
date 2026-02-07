import type { Metadata } from 'next';

/**
 * Metadata for the dashboard page
 */
export const metadata: Metadata = {
  title: 'Tax Form Dashboard | Tax App',
  description: 'Select and access tax forms for completion',
};

/**
 * Dashboard Layout
 * 
 * Server component that provides metadata for the dashboard section.
 * The actual authentication logic is handled by the client component page.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
