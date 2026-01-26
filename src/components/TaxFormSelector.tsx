'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TAX_FORMS } from '@/types/taxForm';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * Props for the TaxFormSelector component
 */
export interface TaxFormSelectorProps {
  /**
   * Optional callback fired when a form is selected
   */
  onFormSelect?: (formId: string) => void;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * TaxFormSelector Component
 * 
 * A form selector interface that allows users to choose a tax form
 * from a dropdown and navigate to the form filling page.
 * 
 * Features:
 * - Dropdown/select interface with available tax forms
 * - State management for selected form
 * - Navigation button with disabled state when no form selected
 * - Integration with Next.js router for navigation
 * - Extensible design - automatically includes new forms from TAX_FORMS array
 * 
 * Requirements:
 * - 2.1: Display available tax forms in dropdown/select interface
 * - 2.2: Include 1099-DIV form as available option
 * - 2.3: Display all available form options when user interacts
 * - 2.4: Display default prompt/placeholder when no form selected
 * - 3.1: Enable navigation to form's filling interface when form selected
 * 
 * @example
 * ```tsx
 * <TaxFormSelector
 *   onFormSelect={(formId) => console.log('Selected:', formId)}
 * />
 * ```
 */
export function TaxFormSelector({ onFormSelect, className }: TaxFormSelectorProps) {
  const [selectedForm, setSelectedForm] = useState<string>('');
  const router = useRouter();
  
  /**
   * Handle form selection change
   * Updates local state and calls optional callback
   */
  const handleFormChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const formId = event.target.value;
    setSelectedForm(formId);
    
    if (onFormSelect) {
      onFormSelect(formId);
    }
  };
  
  /**
   * Handle navigation button click
   * Routes to the selected form's path using Next.js router
   */
  const handleNavigate = () => {
    if (selectedForm) {
      const form = TAX_FORMS.find(f => f.id === selectedForm);
      if (form) {
        router.push(form.path);
      }
    }
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Form Selection Dropdown */}
      <div>
        <label 
          htmlFor="tax-form-select" 
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Select Tax Form
        </label>
        <select
          id="tax-form-select"
          value={selectedForm}
          onChange={handleFormChange}
          aria-label="Select a tax form"
          aria-required="true"
          className={cn(
            'w-full px-3 py-2 rounded-md border text-base',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'border-gray-300 focus:ring-blue-500 focus:border-blue-500',
            'focus-visible:ring-blue-500',
            'min-h-[44px] text-base',
            'md:min-h-[40px] md:text-sm',
            'bg-white'
          )}
        >
          <option value="">Select a tax form...</option>
          {TAX_FORMS.map(form => (
            <option key={form.id} value={form.id}>
              {form.displayName}
              {form.description ? ` - ${form.description}` : ''}
            </option>
          ))}
        </select>
      </div>
      
      {/* Navigation Button */}
      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={handleNavigate}
        disabled={!selectedForm}
        className="w-full min-h-[44px] md:min-h-[48px]"
        aria-label="Navigate to selected form"
      >
        Fill Out Form
      </Button>
    </div>
  );
}

export default TaxFormSelector;
