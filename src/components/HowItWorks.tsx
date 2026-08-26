'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { navigateToTaxPreparation, handleNavigationError } from '@/lib/navigation';
import { useLoadingState } from '@/hooks/useLoadingState';

const steps = [
  'Create your account',
  'Enter or upload your tax data',
  'Download completed IRS forms',
];

const HowItWorks: React.FC = () => {
  const { isLoading, executeAsync } = useLoadingState();

  const handleCtaClick = async () => {
    await executeAsync(async () => {
      const result = await navigateToTaxPreparation();
      if (!result.success && result.error) {
        handleNavigationError(result.error);
        throw new Error(result.error);
      }
      return result;
    });
  };

  return (
    <section
      className="py-16 px-4 sm:py-20 sm:px-6 lg:px-8 bg-white"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-3xl mx-auto text-center">
        <h2
          id="how-it-works-heading"
          className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        >
          Complete your IRS forms in three simple steps
        </h2>

        <ol className="mt-10 space-y-6 text-left max-w-md mx-auto">
          {steps.map((step, index) => (
            <li
              key={index}
              className="flex items-start gap-4 text-lg text-gray-700"
            >
              <span
                className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-sm"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCtaClick}
            loading={isLoading}
            loadingText="Starting..."
            aria-label="Get started — create your account"
          >
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
