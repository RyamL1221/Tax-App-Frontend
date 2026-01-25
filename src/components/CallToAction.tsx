import React from 'react';
import { Button } from '@/components/ui/Button';
import { navigateToTaxPreparation, navigateToLearnMore, navigateToSupport, handleNavigationError } from '@/lib/navigation';

export interface CallToActionProps {
  primaryText?: string;
  primaryAction?: () => void;
  secondaryText?: string;
  secondaryAction?: () => void;
  supportText?: string;
  supportAction?: () => void;
}

const CallToAction: React.FC<CallToActionProps> = ({
  primaryText = "Start Your Tax Preparation Now",
  primaryAction,
  secondaryText = "Learn More About Our Process",
  secondaryAction,
  supportText = "Contact Support",
  supportAction
}) => {
  const handlePrimaryClick = async () => {
    if (primaryAction) {
      primaryAction();
      return;
    }
    
    const result = await navigateToTaxPreparation();
    if (!result.success && result.error) {
      handleNavigationError(result.error);
    }
  };

  const handleSecondaryClick = async () => {
    if (secondaryAction) {
      secondaryAction();
      return;
    }
    
    const result = await navigateToLearnMore();
    if (!result.success && result.error) {
      handleNavigationError(result.error);
    }
  };

  const handleSupportClick = async () => {
    if (supportAction) {
      supportAction();
      return;
    }
    
    const result = await navigateToSupport();
    if (!result.success && result.error) {
      handleNavigationError(result.error);
    }
  };
  return (
    <section className="py-16 px-4 sm:py-24 sm:px-6 lg:px-8 bg-blue-600">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to Simplify Your Tax Filing?
        </h2>
        <p className="mt-6 text-xl text-blue-100 max-w-3xl mx-auto">
          Join thousands of users who have streamlined their tax preparation process with Tax App. 
          Get started today and experience the difference automated form filling can make.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handlePrimaryClick}
            className="bg-white text-blue-600 hover:bg-gray-50 active:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            {primaryText}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleSecondaryClick}
            className="border-white text-white hover:bg-white hover:text-blue-600 active:bg-gray-50 px-8 py-4 text-lg font-semibold transition-all duration-200"
          >
            {secondaryText}
          </Button>
        </div>
        
        <div className="mt-8">
          <button
            onClick={handleSupportClick}
            className="text-blue-100 hover:text-white underline text-lg transition-colors duration-200"
          >
            {supportText}
          </button>
        </div>
        
        {/* Trust indicators and security information */}
        <div className="mt-12 pt-8 border-t border-blue-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 text-blue-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-1">Bank-Level Security</h3>
              <p className="text-blue-100 text-sm">256-bit SSL encryption protects your sensitive tax information</p>
            </div>
            
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 text-blue-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-1">IRS Compliant</h3>
              <p className="text-blue-100 text-sm">Fully compliant with all IRS e-filing requirements and standards</p>
            </div>
            
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 text-blue-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 3v6m0 6v6m6-12h-6m-6 0h6" />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-1">24/7 Support</h3>
              <p className="text-blue-100 text-sm">Expert support available whenever you need assistance</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;