import React from 'react';
import HowItWorks from '@/components/HowItWorks';
import Security from '@/components/Security';

export default function Home() {
  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="skip-link"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      <main
        id="main-content"
        className="min-h-screen bg-white"
        role="main"
        aria-label="Tax App landing page"
      >
        <HowItWorks />
        <Security />
      </main>
    </>
  );
}
