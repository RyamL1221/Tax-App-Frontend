import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export interface BenefitProps {
  title: string;
  description: string;
  metric?: string;
}

export interface BenefitsProps {
  benefits?: BenefitProps[];
}

// Default benefits highlighting advantages over traditional methods
const defaultBenefits: BenefitProps[] = [
  {
    title: "Save Time",
    description: "Reduce tax preparation time from hours to minutes with automated form filling and intelligent data collection.",
    metric: "90% faster"
  },
  {
    title: "Improve Accuracy",
    description: "Eliminate manual entry errors with automated validation and built-in error checking throughout the process.",
    metric: "99.9% accuracy"
  },
  {
    title: "Comprehensive Form Support",
    description: "Support for all major IRS forms including 1040, Schedule C, Schedule D, and many others for various tax situations.",
    metric: "50+ forms"
  },
  {
    title: "Secure & Compliant",
    description: "Bank-level security encryption and full compliance with IRS e-filing requirements and data protection standards.",
    metric: "256-bit SSL"
  }
];

const Benefits: React.FC<BenefitsProps> = ({ benefits = defaultBenefits }) => {
  return (
    <section className="py-16 px-4 sm:py-24 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Why Choose Tax App?
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the advantages of modern tax preparation technology over traditional manual methods.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} variant="default" className="h-full text-center">
              <CardHeader>
                {benefit.metric && (
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {benefit.metric}
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900">
                  {benefit.title}
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Traditional vs. Tax App
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Traditional Methods
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Hours of manual form completion</li>
                  <li>• High risk of calculation errors</li>
                  <li>• Complex form navigation</li>
                  <li>• Limited form support</li>
                  <li>• Time-consuming data entry</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Tax App Advantages
                </h4>
                <ul className="space-y-2 text-gray-600">
                  <li>• Automated form completion in minutes</li>
                  <li>• Built-in error prevention and validation</li>
                  <li>• Intuitive guided process</li>
                  <li>• Comprehensive IRS form coverage</li>
                  <li>• Smart data collection and reuse</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;