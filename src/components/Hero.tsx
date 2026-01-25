import React from 'react';
import { Button } from '@/components/ui/Button';
import { navigateToTaxPreparation, handleNavigationError } from '@/lib/navigation';

export interface HeroProps {
  headline?: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

const Hero: React.FC<HeroProps> = ({
  headline = "Streamline Your Tax Preparation with Tax App",
  subtitle = "Simplify IRS form preparation with our automated data collection and form-filling technology. Save time and reduce errors in your tax filing process.",
  ctaText = "Start Your Tax Preparation",
  onCtaClick
}) => {
  const handleCtaClick = async () => {
    if (onCtaClick) {
      onCtaClick();
      return;
    }
    
    const result = await navigateToTaxPreparation();
    if (!result.success && result.error) {
      handleNavigationError(result.error);
    }
  };
  return (
    <section 
      className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 px-4 sm:py-24 sm:px-6 lg:px-8"
      aria-labelledby="hero-heading"
      role="banner"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h1 
          id="hero-heading"
          className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
        >
          {headline}
        </h1>
        <p 
          className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          aria-describedby="hero-heading"
        >
          {subtitle}
        </p>
        <div className="mt-10">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCtaClick}
            className="px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            aria-describedby="hero-heading"
            aria-label={`${ctaText} - Begin your tax preparation process`}
          >
            {ctaText}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;