'use client';

import React from 'react';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Benefits from '@/components/Benefits';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';

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
        {/* Hero Section */}
        <Hero />
        
        {/* Features Section */}
        <Features />
        
        {/* Benefits Section */}
        <Benefits />
        
        {/* Call to Action Section */}
        <CallToAction />
      </main>
      
      {/* Footer */}
      <Footer />
    </>
  );
}