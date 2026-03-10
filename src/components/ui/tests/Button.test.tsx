import React from 'react';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { Button, ButtonProps } from '../Button';

/**
 * **Feature: tax-app-landing, Property 3: Visual design consistency**
 * **Validates: Requirements 2.3, 3.4**
 */
describe('Button Component Property Tests', () => {
  test('Visual design consistency - buttons of same variant should have consistent styling', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'outline'),
        fc.constantFrom('sm', 'md', 'lg'),
        fc.string({ minLength: 1, maxLength: 50 }),
        (variant, size, text) => {
          // Render two buttons with the same variant and size
          const { container: container1 } = render(
            <Button variant={variant as ButtonProps['variant']} size={size as ButtonProps['size']}>
              {text}
            </Button>
          );
          
          const { container: container2 } = render(
            <Button variant={variant as ButtonProps['variant']} size={size as ButtonProps['size']}>
              Different Text
            </Button>
          );

          const button1 = container1.querySelector('button');
          const button2 = container2.querySelector('button');

          expect(button1).toBeTruthy();
          expect(button2).toBeTruthy();

          if (button1 && button2) {
            // Get computed styles
            const styles1 = window.getComputedStyle(button1);
            const styles2 = window.getComputedStyle(button2);

            // Check that buttons with same variant have consistent styling properties
            expect(styles1.backgroundColor).toBe(styles2.backgroundColor);
            expect(styles1.color).toBe(styles2.color);
            expect(styles1.borderRadius).toBe(styles2.borderRadius);
            expect(styles1.fontWeight).toBe(styles2.fontWeight);
            expect(styles1.height).toBe(styles2.height);
            expect(styles1.paddingLeft).toBe(styles2.paddingLeft);
            expect(styles1.paddingRight).toBe(styles2.paddingRight);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Visual design consistency - all buttons should have proper accessibility attributes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'outline'),
        fc.constantFrom('sm', 'md', 'lg'),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (variant, size, text) => {
          const { container } = render(
            <Button variant={variant as ButtonProps['variant']} size={size as ButtonProps['size']}>
              {text}
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeTruthy();

          if (button) {
            // Check that button has proper semantic HTML
            expect(button.tagName).toBe('BUTTON');
            expect(button.type).toBe('button');
            
            // Check that button content is accessible
            expect(button.textContent).toBe(text);
            
            // Check that button has focus management
            expect(button.tabIndex).not.toBe(-1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Visual design consistency - buttons should provide visual feedback states', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('primary', 'secondary', 'outline'),
        fc.string({ minLength: 1, maxLength: 50 }),
        (variant, text) => {
          const { container } = render(
            <Button variant={variant as ButtonProps['variant']}>
              {text}
            </Button>
          );

          const button = container.querySelector('button');
          expect(button).toBeTruthy();

          if (button) {
            // Check that button has transition classes for visual feedback
            const classList = Array.from(button.classList);
            expect(classList.some(cls => cls.includes('transition'))).toBe(true);
            
            // Check that button has hover, focus, and active state classes
            const classString = button.className;
            expect(classString).toMatch(/hover:/);
            expect(classString).toMatch(/active:/);
            expect(classString).toMatch(/focus-visible:/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});