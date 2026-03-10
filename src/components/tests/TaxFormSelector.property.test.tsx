/**
 * Property-Based Tests for TaxFormSelector Component
 * 
 * Feature: tax-form-dashboard
 * Property 3: Form Data Drives Selector Options
 * 
 * **Validates: Requirements 2.3, 4.2**
 * 
 * This test file uses property-based testing to verify that the form selector
 * displays exactly the forms present in the data structure, for ANY possible
 * set of tax forms.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { TaxFormSelector } from '../TaxFormSelector';
import type { TaxForm } from '@/types/taxForm';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the TAX_FORMS import so we can override it in tests
let mockTaxForms: TaxForm[] = [];
jest.mock('@/types/taxForm', () => ({
  get TAX_FORMS() {
    return mockTaxForms;
  },
}));

/**
 * Arbitrary generator for TaxForm objects
 * Generates valid tax form data structures
 */
const taxFormArbitrary = fc.record({
  id: fc.stringMatching(/^[a-z0-9-]+$/), // Valid ID format (lowercase, numbers, hyphens)
  displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  path: fc.stringMatching(/^\/forms\/[a-z0-9-]+$/), // Valid path format
  description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

/**
 * Arbitrary generator for arrays of unique TaxForm objects
 * Ensures no duplicate IDs in the generated array
 */
const uniqueTaxFormsArbitrary = fc
  .array(taxFormArbitrary, { minLength: 0, maxLength: 10 })
  .map(forms => {
    // Remove duplicates by ID
    const seen = new Set<string>();
    return forms.filter(form => {
      if (seen.has(form.id)) {
        return false;
      }
      seen.add(form.id);
      return true;
    });
  });

describe('Property-Based Tests: TaxFormSelector Form Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: tax-form-dashboard, Property 3: Form Data Drives Selector Options
   * 
   * For ANY set of tax forms in the data structure, the form selector should
   * display exactly those forms as selectable options.
   * 
   * **Validates: Requirements 2.3, 4.2**
   */
  test('Property 3: Form Data Drives Selector Options', () => {
    fc.assert(
      fc.property(uniqueTaxFormsArbitrary, (taxForms) => {
        // Set the mock tax forms
        mockTaxForms = taxForms;

        const { unmount } = render(<TaxFormSelector />);

        try {
          // Get the select element
          const select = screen.getByLabelText(/select a tax form/i);
          expect(select).toBeInTheDocument();

          // Get all option elements (excluding the placeholder)
          const options = screen.getAllByRole('option');
          
          // First option should be the placeholder
          expect(options[0]).toHaveTextContent('Select a tax form...');
          expect(options[0]).toHaveValue('');

          // Remaining options should match the tax forms exactly
          const formOptions = options.slice(1);
          
          // Should have exactly the same number of options as forms
          expect(formOptions).toHaveLength(taxForms.length);

          // Each form should have a corresponding option
          taxForms.forEach((form, index) => {
            const option = formOptions[index];
            
            // Option should exist
            expect(option).toBeInTheDocument();
            
            // Option value should match form ID
            expect(option).toHaveValue(form.id);
            
            // Option text should include display name
            const optionText = option.textContent || '';
            expect(optionText).toContain(form.displayName);
            
            // If description exists, it should be included in the text
            if (form.description) {
              expect(optionText).toContain(form.description);
            }
          });

          // Verify no extra options exist beyond placeholder and forms
          expect(options.length).toBe(taxForms.length + 1);
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 100,
        // Increase timeout for rendering operations
        timeout: 10000,
        // Skip shrinking to avoid timeout issues
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Empty form array displays only placeholder
   * 
   * When the tax forms array is empty, the selector should display
   * only the placeholder option with no form options.
   * 
   * **Validates: Requirements 2.3, 2.4**
   */
  test('Property: Empty form array displays only placeholder', () => {
    fc.assert(
      fc.property(fc.constant([]), (emptyForms) => {
        // Set empty tax forms
        mockTaxForms = emptyForms;

        const { unmount } = render(<TaxFormSelector />);

        try {
          const select = screen.getByLabelText(/select a tax form/i);
          expect(select).toBeInTheDocument();

          // Should only have the placeholder option
          const options = screen.getAllByRole('option');
          expect(options).toHaveLength(1);
          expect(options[0]).toHaveTextContent('Select a tax form...');
          expect(options[0]).toHaveValue('');
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 20,
        timeout: 5000,
      }
    );
  });

  /**
   * Property: Single form displays correctly
   * 
   * For ANY single tax form, the selector should display that form
   * as the only selectable option (plus placeholder).
   * 
   * **Validates: Requirements 2.3, 4.2**
   */
  test('Property: Single form displays correctly', () => {
    fc.assert(
      fc.property(taxFormArbitrary, (taxForm) => {
        // Set single tax form
        mockTaxForms = [taxForm];

        const { unmount } = render(<TaxFormSelector />);

        try {
          const select = screen.getByLabelText(/select a tax form/i);
          expect(select).toBeInTheDocument();

          // Should have placeholder + 1 form option
          const options = screen.getAllByRole('option');
          expect(options).toHaveLength(2);

          // First is placeholder
          expect(options[0]).toHaveTextContent('Select a tax form...');
          expect(options[0]).toHaveValue('');

          // Second is the form
          expect(options[1]).toHaveValue(taxForm.id);
          const optionText = options[1].textContent || '';
          expect(optionText).toContain(taxForm.displayName);
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Form order is preserved
   * 
   * For ANY ordered array of tax forms, the selector should display
   * the forms in the exact same order they appear in the array.
   * 
   * **Validates: Requirements 2.3, 4.2**
   */
  test('Property: Form order is preserved', () => {
    fc.assert(
      fc.property(uniqueTaxFormsArbitrary, (taxForms) => {
        // Skip if less than 2 forms (order doesn't matter)
        fc.pre(taxForms.length >= 2);

        // Set the mock tax forms
        mockTaxForms = taxForms;

        const { unmount } = render(<TaxFormSelector />);

        try {
          const options = screen.getAllByRole('option');
          const formOptions = options.slice(1); // Skip placeholder

          // Verify forms appear in the same order
          taxForms.forEach((form, index) => {
            expect(formOptions[index]).toHaveValue(form.id);
          });
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: All form IDs are unique in options
   * 
   * For ANY set of tax forms with unique IDs, each form ID should
   * appear exactly once in the selector options.
   * 
   * **Validates: Requirements 2.3, 4.2**
   */
  test('Property: All form IDs are unique in options', () => {
    fc.assert(
      fc.property(uniqueTaxFormsArbitrary, (taxForms) => {
        // Skip if no forms
        fc.pre(taxForms.length > 0);

        // Set the mock tax forms
        mockTaxForms = taxForms;

        const { unmount } = render(<TaxFormSelector />);

        try {
          const options = screen.getAllByRole('option');
          const formOptions = options.slice(1); // Skip placeholder

          // Collect all option values
          const optionValues = formOptions.map(option => option.getAttribute('value'));

          // All values should be unique
          const uniqueValues = new Set(optionValues);
          expect(uniqueValues.size).toBe(optionValues.length);

          // All form IDs should be present
          taxForms.forEach(form => {
            expect(optionValues).toContain(form.id);
          });
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Form descriptions are optional
   * 
   * For ANY tax form with or without a description, the selector
   * should display the form correctly, including the description
   * only when it exists.
   * 
   * **Validates: Requirements 2.3, 4.2**
   */
  test('Property: Form descriptions are optional', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.stringMatching(/^[a-z0-9-]+$/),
          displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          path: fc.stringMatching(/^\/forms\/[a-z0-9-]+$/),
          description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        }),
        (taxForm) => {
          // Set single tax form
          mockTaxForms = [taxForm];

          const { unmount } = render(<TaxFormSelector />);

          try {
            const options = screen.getAllByRole('option');
            const formOption = options[1]; // Skip placeholder

            // Display name should always be present
            const optionText = formOption.textContent || '';
            expect(optionText).toContain(taxForm.displayName);

            // Description should be present only if defined
            if (taxForm.description) {
              expect(optionText).toContain(taxForm.description);
            }
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 10000,
        endOnFailure: true,
      }
    );
  });
});
