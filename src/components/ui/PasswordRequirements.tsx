import React from 'react';
import { cn } from '@/lib/utils';

export interface PasswordRequirementsProps {
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * PasswordRequirements Component
 * 
 * Displays a list of password requirements to guide users in creating
 * a secure password. This component provides clear, accessible information
 * about what makes a valid password.
 * 
 * Features:
 * - Clear list of all password requirements
 * - Proper ARIA labeling for accessibility
 * - Consistent styling with other form components
 * - Mobile-friendly responsive design
 * 
 * Requirements: 3.5
 * 
 * @example
 * ```tsx
 * <PasswordRequirements />
 * ```
 */
export function PasswordRequirements({ 
  className 
}: PasswordRequirementsProps) {
  return (
    <div 
      className={cn('mt-2 p-3 bg-gray-50 rounded-md border border-gray-200', className)}
      aria-label="Password requirements"
    >
      <p className="text-sm font-medium text-gray-700 mb-2">
        Password must contain:
      </p>
      <ul className="space-y-1 text-sm text-gray-600">
        <li className="flex items-start">
          <span className="mr-2" aria-hidden="true">•</span>
          <span>At least 8 characters</span>
        </li>
        <li className="flex items-start">
          <span className="mr-2" aria-hidden="true">•</span>
          <span>One uppercase letter</span>
        </li>
        <li className="flex items-start">
          <span className="mr-2" aria-hidden="true">•</span>
          <span>One lowercase letter</span>
        </li>
        <li className="flex items-start">
          <span className="mr-2" aria-hidden="true">•</span>
          <span>One number</span>
        </li>
        <li className="flex items-start">
          <span className="mr-2" aria-hidden="true">•</span>
          <span>One special character</span>
        </li>
      </ul>
    </div>
  );
}
