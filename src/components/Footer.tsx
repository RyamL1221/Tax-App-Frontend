import React from 'react';

export interface FooterProps {
  companyName?: string;
  supportEmail?: string;
  privacyPolicyUrl?: string;
}

const Footer: React.FC<FooterProps> = ({
  companyName = "Tax App",
  supportEmail = "support@taxapp.com",
  privacyPolicyUrl = "/privacy"
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">{companyName}</h3>
            <p className="text-gray-300 mb-4 max-w-md">
              Streamlining tax preparation with intelligent automation and secure form completion. 
              Making tax filing faster, more accurate, and stress-free for everyone.
            </p>
            <div className="flex space-x-4">
              <a 
                href={`mailto:${supportEmail}`}
                className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm px-2 py-1"
                aria-label={`Email support at ${supportEmail}`}
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/features" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm px-2 py-1"
                  aria-label="Learn about Tax App features"
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="/pricing" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm px-2 py-1"
                  aria-label="View Tax App pricing plans"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a 
                  href="/support" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm px-2 py-1"
                  aria-label="Get help and support"
                >
                  Support
                </a>
              </li>
              <li>
                <a 
                  href="/contact" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm px-2 py-1"
                  aria-label="Contact Tax App team"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal & Security</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href={privacyPolicyUrl} 
                  className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm px-2 py-1"
                  aria-label="Read our privacy policy"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="/terms" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm px-2 py-1"
                  aria-label="Read terms of service"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a 
                  href="/security" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm px-2 py-1"
                  aria-label="Learn about our security measures"
                >
                  Security
                </a>
              </li>
              <li>
                <a 
                  href="/compliance" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 rounded-sm px-2 py-1"
                  aria-label="View compliance information"
                >
                  IRS Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} {companyName}. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <span className="text-gray-400 text-sm">Secured by 256-bit SSL encryption</span>
              <div className="flex items-center">
                <svg 
                  className="w-4 h-4 text-green-400 mr-1" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                  aria-label="Security verified icon"
                  role="img"
                >
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-400 text-sm">IRS Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;