'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import ComponentFallback from '@/components/fallbacks/ComponentFallback';
import LoadingFallback from '@/components/fallbacks/LoadingFallback';

// Dynamic imports for code splitting
const Hero = dynamic(() => import('@/components/Hero'), {
  loading: () => <LoadingFallback message="Loading hero section..." />,
  ssr: true // Keep SSR for above-the-fold content
});

const Features = dynamic(() => import('@/components/Features'), {
  loading: () => <LoadingFallback message="Loading features..." />,
  ssr: true // Enable SSR for immediate loading
});

const Benefits = dynamic(() => import('@/components/Benefits'), {
  loading: () => <LoadingFallback message="Loading benefits..." />,
  ssr: true // Enable SSR for immediate loading
});

const CallToAction = dynamic(() => import('@/components/CallToAction'), {
  loading: () => <LoadingFallback message="Loading call to action..." />,
  ssr: true // Enable SSR for immediate loading
});

const Footer = dynamic(() => import('@/components/Footer'), {
  loading: () => <LoadingFallback message="Loading footer..." />,
  ssr: true // Enable SSR for immediate loading
});

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
        {/* Hero Section - Above the fold, keep SSR */}
        <ErrorBoundary 
          fallback={<ComponentFallback componentName="Hero section" minimal />}
        >
          <Suspense fallback={<LoadingFallback message="Loading hero section..." />}>
            <Hero />
          </Suspense>
        </ErrorBoundary>
        
        {/* Features Section - Below the fold, lazy load */}
        <ErrorBoundary 
          fallback={<ComponentFallback componentName="Features section" minimal />}
        >
          <Suspense fallback={<LoadingFallback message="Loading features..." />}>
            <Features />
          </Suspense>
        </ErrorBoundary>
        
        {/* Benefits Section - Below the fold, lazy load */}
        <ErrorBoundary 
          fallback={<ComponentFallback componentName="Benefits section" minimal />}
        >
          <Suspense fallback={<LoadingFallback message="Loading benefits..." />}>
            <Benefits />
          </Suspense>
        </ErrorBoundary>
        
        {/* Call to Action Section - Below the fold, lazy load */}
        <ErrorBoundary 
          fallback={<ComponentFallback componentName="Call to Action section" minimal />}
        >
          <Suspense fallback={<LoadingFallback message="Loading call to action..." />}>
            <CallToAction />
          </Suspense>
        </ErrorBoundary>
      </main>
      
      {/* Footer - Below the fold, lazy load */}
      <ErrorBoundary 
        fallback={<ComponentFallback componentName="Footer" minimal />}
      >
        <Suspense fallback={<LoadingFallback message="Loading footer..." />}>
          <Footer />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}