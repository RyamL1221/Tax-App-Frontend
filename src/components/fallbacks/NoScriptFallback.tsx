import React from 'react';

interface NoScriptFallbackProps {
  children?: React.ReactNode;
}

export const NoScriptFallback: React.FC<NoScriptFallbackProps> = ({ children }) => {
  return (
    <>
      <noscript>
        <div 
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6"
          role="alert"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg 
                className="h-5 w-5 text-yellow-400" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-label="Warning icon"
                role="img"
              >
                <path 
                  fillRule="evenodd" 
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                JavaScript Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  This Tax App landing page works best with JavaScript enabled. 
                  While you can still view the content below, some interactive features may not work properly.
                </p>
                <p className="mt-2">
                  To get the full experience, please enable JavaScript in your browser settings.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Static content for no-JS users */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Tax App - Streamlined IRS Form Preparation
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simplify IRS form preparation with our automated data collection and form-filling technology. 
              Save time and reduce errors in your tax filing process.
            </p>
          </header>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Automated Form Filling</h3>
                <p className="text-gray-600">
                  Our intelligent system automatically populates IRS forms using your provided information, 
                  eliminating manual data entry and reducing errors.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Data Collection</h3>
                <p className="text-gray-600">
                  Streamlined data collection process that guides you through providing only the information 
                  needed for your specific tax situation.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Prevention</h3>
                <p className="text-gray-600">
                  Built-in validation and error checking ensures your tax forms are completed accurately 
                  before submission to the IRS.
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Multiple Form Support</h3>
                <p className="text-gray-600">
                  Support for various IRS forms and tax scenarios, from simple individual returns to 
                  more complex filing situations.
                </p>
              </div>
            </div>
          </section>
          
          <section className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Tax App?</h2>
            <div className="max-w-2xl mx-auto space-y-4 text-gray-600">
              <p>Save hours of manual form completion with our automated system.</p>
              <p>Reduce errors with built-in validation and intelligent data checking.</p>
              <p>Support for multiple IRS forms and complex tax scenarios.</p>
              <p>Secure, reliable, and designed with your privacy in mind.</p>
            </div>
          </section>
          
          <section className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-6">
              Contact us to learn more about how Tax App can streamline your tax preparation process.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Email: support@taxapp.com
              </p>
              <p className="text-sm text-gray-500">
                Phone: 1-800-TAX-HELP
              </p>
            </div>
          </section>
        </div>
      </noscript>
      {children}
    </>
  );
};

export default NoScriptFallback;