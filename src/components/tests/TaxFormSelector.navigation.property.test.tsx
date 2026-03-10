/**
 * Property-Based Tests for TaxFormSelector Navigation
 * 
 * Feature: tax-form-dashboard
 * Property 4: Form Selection Navigates to Correct Path
 * 
 * **Validates: Requirements 3.1, 3.2**
 * 
 * This test file uses property-based testing to verify that form selection
 * and navigation work correctly for ANY possible tax form configuration.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  .array(taxFormArbitrary, { minLength: 1, maxLength: 10 })
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
  })
  .filter(forms => forms.length > 0); // Ensure at least one form

describe('Property-Based Tests: TaxFormSelector Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: tax-form-dashboard, Property 4: Form Selection Navigates to Correct Path
   * 
   * For ANY tax form with a defined path, when a user selects and confirms that form,
   * the navigation handler should route to the form's specified path.
   * 
   * **Validates: Requirements 3.1, 3.2**
   */
  test('Property 4: Form Selection Navigates to Correct Path', async () => {
    await fc.assert(
      fc.asyncProperty(uniqueTaxFormsArbitrary, async (taxForms) => {
        // Clear mocks for this iteration
        jest.clearAllMocks();
        
        // Set the mock tax forms
        mockTaxForms = taxForms;

        const user = userEvent.setup();
        const { unmount } = render(<TaxFormSelector />);

        try {
          // Get the select element and button
          const select = screen.getByLabelText(/select a tax form/i);
          const button = screen.getByRole('button', { name: /navigate to selected form/i });

          // Button should be disabled initially
          expect(button).toBeDisabled();

          // Select a random form from the available forms
          const randomIndex = Math.floor(Math.random() * taxForms.length);
          const selectedForm = taxForms[randomIndex];

          // Select the form
          await user.selectOptions(select, selectedForm.id);

          // Button should now be enabled
          expect(button).toBeEnabled();

          // Click the navigation button
          await user.click(button);

          // Verify router.push was called with the correct path
          expect(mockPush).toHaveBeenCalledTimes(1);
          expect(mockPush).toHaveBeenCalledWith(selectedForm.path);
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 100,
        timeout: 15000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Navigation only occurs when form is selected
   * 
   * For ANY set of tax forms, the navigation button should remain disabled
   * and no navigation should occur when no form is selected.
   * 
   * **Validates: Requirements 3.1**
   */
  test('Property: Navigation only occurs when form is selected', async () => {
    await fc.assert(
      fc.asyncProperty(uniqueTaxFormsArbitrary, async (taxForms) => {
        // Clear mocks for this iteration
        jest.clearAllMocks();
        
        // Set the mock tax forms
        mockTaxForms = taxForms;

        const user = userEvent.setup();
        const { unmount } = render(<TaxFormSelector />);

        try {
          // Get the button
          const button = screen.getByRole('button', { name: /navigate to selected form/i });

          // Button should be disabled when no form is selected
          expect(button).toBeDisabled();

          // Attempt to click the disabled button (should not trigger navigation)
          // Note: userEvent.click on disabled button doesn't actually click it
          // but we verify the button state
          expect(mockPush).not.toHaveBeenCalled();
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
   * Property: Each form navigates to its own unique path
   * 
   * For ANY set of tax forms with unique paths, selecting and confirming
   * each form should navigate to that specific form's path.
   * 
   * **Validates: Requirements 3.1, 3.2**
   */
  test('Property: Each form navigates to its own unique path', async () => {
    await fc.assert(
      fc.asyncProperty(uniqueTaxFormsArbitrary, async (taxForms) => {
        // Skip if only one form (need multiple to test uniqueness)
        fc.pre(taxForms.length >= 2);

        // Set the mock tax forms
        mockTaxForms = taxForms;

        const user = userEvent.setup();

        // Test each form individually
        for (const form of taxForms) {
          // Clear mocks for each form test
          jest.clearAllMocks();

          const { unmount } = render(<TaxFormSelector />);

          try {
            // Get the select element and button
            const select = screen.getByLabelText(/select a tax form/i);
            const button = screen.getByRole('button', { name: /navigate to selected form/i });

            // Select the form
            await user.selectOptions(select, form.id);

            // Click the navigation button
            await user.click(button);

            // Verify router.push was called with this form's specific path
            expect(mockPush).toHaveBeenCalledTimes(1);
            expect(mockPush).toHaveBeenCalledWith(form.path);
          } finally {
            unmount();
          }
        }
      }),
      {
        numRuns: 30, // Reduced runs since we test multiple forms per run
        timeout: 30000, // Increased timeout for multiple renders
        endOnFailure: true,
      }
    );
  }, 35000); // Jest test timeout

  /**
   * Property: Changing form selection updates navigation target
   * 
   * For ANY two different tax forms, when a user selects one form,
   * then changes to another form, the navigation should go to the
   * second form's path.
   * 
   * **Validates: Requirements 3.1, 3.2**
   */
  test('Property: Changing form selection updates navigation target', async () => {
    await fc.assert(
      fc.asyncProperty(uniqueTaxFormsArbitrary, async (taxForms) => {
        // Need at least 2 forms to test changing selection
        fc.pre(taxForms.length >= 2);

        // Clear mocks for this iteration
        jest.clearAllMocks();
        
        // Set the mock tax forms
        mockTaxForms = taxForms;

        const user = userEvent.setup();
        const { unmount } = render(<TaxFormSelector />);

        try {
          // Get the select element and button
          const select = screen.getByLabelText(/select a tax form/i);
          const button = screen.getByRole('button', { name: /navigate to selected form/i });

          // Select the first form
          const firstForm = taxForms[0];
          await user.selectOptions(select, firstForm.id);

          // Select a different form
          const secondForm = taxForms[1];
          await user.selectOptions(select, secondForm.id);

          // Click the navigation button
          await user.click(button);

          // Verify router.push was called with the SECOND form's path
          expect(mockPush).toHaveBeenCalledTimes(1);
          expect(mockPush).toHaveBeenCalledWith(secondForm.path);
          expect(mockPush).not.toHaveBeenCalledWith(firstForm.path);
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 100,
        timeout: 15000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: onFormSelect callback is invoked on selection
   * 
   * For ANY tax form, when a user selects that form, the optional
   * onFormSelect callback should be invoked with the form's ID.
   * 
   * **Validates: Requirements 3.1**
   */
  test('Property: onFormSelect callback is invoked on selection', async () => {
    await fc.assert(
      fc.asyncProperty(uniqueTaxFormsArbitrary, async (taxForms) => {
        // Clear mocks for this iteration
        jest.clearAllMocks();
        
        // Set the mock tax forms
        mockTaxForms = taxForms;

        const mockCallback = jest.fn();
        const user = userEvent.setup();
        const { unmount } = render(<TaxFormSelector onFormSelect={mockCallback} />);

        try {
          // Get the select element
          const select = screen.getByLabelText(/select a tax form/i);

          // Select a random form
          const randomIndex = Math.floor(Math.random() * taxForms.length);
          const selectedForm = taxForms[randomIndex];

          // Select the form
          await user.selectOptions(select, selectedForm.id);

          // Verify callback was invoked with the correct form ID
          expect(mockCallback).toHaveBeenCalledTimes(1);
          expect(mockCallback).toHaveBeenCalledWith(selectedForm.id);
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 100,
        timeout: 15000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Navigation works for forms with various path formats
   * 
   * For ANY valid path format (following /forms/[id] pattern), the
   * navigation should work correctly.
   * 
   * **Validates: Requirements 3.2**
   */
  test('Property: Navigation works for forms with various path formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.stringMatching(/^[a-z0-9-]+$/),
          displayName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          path: fc.stringMatching(/^\/forms\/[a-z0-9-]+$/),
          description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        }),
        async (taxForm) => {
          // Clear mocks for this iteration
          jest.clearAllMocks();
          
          // Set single tax form
          mockTaxForms = [taxForm];

          const user = userEvent.setup();
          const { unmount } = render(<TaxFormSelector />);

          try {
            // Get the select element and button
            const select = screen.getByLabelText(/select a tax form/i);
            const button = screen.getByRole('button', { name: /navigate to selected form/i });

            // Select the form
            await user.selectOptions(select, taxForm.id);

            // Click the navigation button
            await user.click(button);

            // Verify router.push was called with the correct path
            expect(mockPush).toHaveBeenCalledTimes(1);
            expect(mockPush).toHaveBeenCalledWith(taxForm.path);

            // Verify the path follows the expected format
            expect(taxForm.path).toMatch(/^\/forms\/[a-z0-9-]+$/);
          } finally {
            unmount();
          }
        }
      ),
      {
        numRuns: 100,
        timeout: 15000,
        endOnFailure: true,
      }
    );
  });

  /**
   * Property: Button state reflects selection state
   * 
   * For ANY tax form, the navigation button should be disabled when
   * no form is selected and enabled when a form is selected.
   * 
   * **Validates: Requirements 3.1**
   */
  test('Property: Button state reflects selection state', async () => {
    await fc.assert(
      fc.asyncProperty(uniqueTaxFormsArbitrary, async (taxForms) => {
        // Clear mocks for this iteration
        jest.clearAllMocks();
        
        // Set the mock tax forms
        mockTaxForms = taxForms;

        const user = userEvent.setup();
        const { unmount } = render(<TaxFormSelector />);

        try {
          // Get the select element and button
          const select = screen.getByLabelText(/select a tax form/i);
          const button = screen.getByRole('button', { name: /navigate to selected form/i });

          // Initially, button should be disabled
          expect(button).toBeDisabled();

          // Select a form
          const randomIndex = Math.floor(Math.random() * taxForms.length);
          const selectedForm = taxForms[randomIndex];
          await user.selectOptions(select, selectedForm.id);

          // Button should now be enabled
          expect(button).toBeEnabled();

          // Deselect (select placeholder)
          await user.selectOptions(select, '');

          // Button should be disabled again
          expect(button).toBeDisabled();
        } finally {
          unmount();
        }
      }),
      {
        numRuns: 100,
        timeout: 15000,
        endOnFailure: true,
      }
    );
  });
});
