/**
 * Tax Form Data Structures and Types
 * 
 * This module defines the data structures for tax forms used throughout
 * the tax form dashboard feature. The design is extensible to support
 * additional forms by simply adding entries to the TAX_FORMS array.
 * 
 * Requirements: 4.1, 4.3
 */

/**
 * Represents a tax form available in the system
 */
export interface TaxForm {
  /** Unique identifier for the form (e.g., "1099-div") */
  id: string;
  
  /** User-facing display name (e.g., "1099-DIV") */
  displayName: string;
  
  /** Navigation route to the form filling page (e.g., "/forms/1099-div") */
  path: string;
  
  /** Optional description of the form's purpose */
  description?: string;
}

/**
 * Available tax forms in the system
 * 
 * This array drives the form selector UI. New forms can be added
 * by appending entries here - the selector component will automatically
 * include them without requiring code changes.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
export const TAX_FORMS: TaxForm[] = [
  {
    id: '1099-div',
    displayName: '1099-DIV',
    path: '/forms/1099-div',
    description: 'Dividends and Distributions'
  }
];
