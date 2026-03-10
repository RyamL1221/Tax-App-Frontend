import React from 'react';
import { cn } from '@/lib/utils';
import { PasswordStrength } from '@/utils/passwordValidation';

export interface PasswordStrengthIndicatorProps {
  /**
   * The current strength level of the password
   */
  strength: PasswordStrength;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * PasswordStrengthIndicator Component
 * 
 * A visual component that displays password strength with a color-coded bar
 * and descriptive label. Provides real-time feedback to users as they type
 * their password.
 * 
 * Features:
 * - Color-coded strength bar (red/orange/yellow/green)
 * - Descriptive strength labels (Weak/Fair/Good/Strong)
 * - ARIA live region for screen reader announcements
 * - Responsive design
 * - Smooth transitions between strength levels
 * 
 * Requirements: 3.3
 * 
 * @example
 * ```tsx
 * <PasswordStrengthIndicator strength={PasswordStrength.GOOD} />
 * ```
 */
export function PasswordStrengthIndicator({ 
  strength, 
  className 
}: PasswordStrengthIndicatorProps) {
  // Configuration for each strength level
  const strengthConfig = {
    [PasswordStrength.WEAK]: { 
      label: 'Weak', 
      color: 'bg-red-500', 
      width: 'w-1/4' 
    },
    [PasswordStrength.FAIR]: { 
      label: 'Fair', 
      color: 'bg-orange-500', 
      width: 'w-2/4' 
    },
    [PasswordStrength.GOOD]: { 
      label: 'Good', 
      color: 'bg-yellow-500', 
      width: 'w-3/4' 
    },
    [PasswordStrength.STRONG]: { 
      label: 'Strong', 
      color: 'bg-green-500', 
      width: 'w-full' 
    }
  };

  const config = strengthConfig[strength];

  return (
    <div 
      className={cn('w-full mt-2', className)}
      role="status"
      aria-live="polite"
      aria-label={`Password strength: ${config.label}`}
    >
      {/* Strength Bar Container */}
      <div 
        className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
        aria-hidden="true"
      >
        {/* Strength Bar Fill */}
        <div
          className={cn(
            'h-full transition-all duration-300 ease-in-out',
            config.color,
            config.width
          )}
        />
      </div>
      
      {/* Strength Label */}
      <div className="mt-1 flex items-center justify-between">
        <span 
          className={cn(
            'text-xs font-medium',
            strength === PasswordStrength.WEAK && 'text-red-600',
            strength === PasswordStrength.FAIR && 'text-orange-600',
            strength === PasswordStrength.GOOD && 'text-yellow-600',
            strength === PasswordStrength.STRONG && 'text-green-600'
          )}
        >
          Password strength: {config.label}
        </span>
      </div>
    </div>
  );
}
