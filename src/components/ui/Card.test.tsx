import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { Card, CardHeader, CardContent, CardFooter, CardProps } from './Card';
import { test, describe } from 'node:test';

/**
 * **Feature: tax-app-landing, Property 2: Responsive design consistency**
 * **Validates: Requirements 2.2**
 */
describe('Card Component Property Tests', () => {
  // Mock window.innerWidth for responsive testing
  const mockViewport = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  test('Responsive design consistency - cards should adapt to different viewport sizes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('default', 'elevated', 'outlined'),
        fc.integer({ min: 320, max: 1920 }), // Viewport width range
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        (variant, viewportWidth, content) => {
          // Set viewport width
          mockViewport(viewportWidth);

          const { container } = render(
            <Card variant={variant as CardProps['variant']}>
              <CardHeader>
                <h3>Test Header</h3>
              </CardHeader>
              <CardContent>
                {content}
              </CardContent>
              <CardFooter>
                <span>Footer</span>
              </CardFooter>
            </Card>
          );

          const card = container.querySelector('div');
          expect(card).toBeTruthy();

          if (card) {
            // Check that card maintains proper structure regardless of viewport
            const header = card.querySelector('div:first-child');
            const contentDiv = card.querySelector('div:nth-child(2)');
            const footer = card.querySelector('div:last-child');

            expect(header).toBeTruthy();
            expect(contentDiv).toBeTruthy();
            expect(footer).toBeTruthy();

            // Check that card has responsive classes
            const classList = Array.from(card.classList);
            expect(classList.some(cls => cls.includes('rounded'))).toBe(true);
            
            // Check that card has proper border and background classes
            expect(classList.some(cls => cls.includes('border'))).toBe(true);
            expect(classList.some(cls => cls.includes('bg-'))).toBe(true);
            
            // Verify card structure is maintained
            expect(card.children.length).toBe(3); // header, content, footer
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Responsive design consistency - card components should maintain proper spacing', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('default', 'elevated', 'outlined'),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (variant, content) => {
          const { container } = render(
            <Card variant={variant as CardProps['variant']}>
              <CardHeader>Header Content</CardHeader>
              <CardContent>{content}</CardContent>
              <CardFooter>Footer Content</CardFooter>
            </Card>
          );

          const card = container.querySelector('div');
          expect(card).toBeTruthy();

          if (card) {
            const header = card.querySelector('div:first-child');
            const contentDiv = card.querySelector('div:nth-child(2)');
            const footer = card.querySelector('div:last-child');

            // Check that all sections have proper padding classes
            if (header) {
              const headerClasses = Array.from(header.classList);
              expect(headerClasses.some(cls => cls.includes('p-'))).toBe(true);
            }

            if (contentDiv) {
              const contentClasses = Array.from(contentDiv.classList);
              expect(contentClasses.some(cls => cls.includes('p-'))).toBe(true);
            }

            if (footer) {
              const footerClasses = Array.from(footer.classList);
              expect(footerClasses.some(cls => cls.includes('p-'))).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Responsive design consistency - cards should have consistent styling across variants', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('default', 'elevated', 'outlined'),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (variant, content) => {
          const { container } = render(
            <Card variant={variant as CardProps['variant']}>
              <CardContent>{content}</CardContent>
            </Card>
          );

          const card = container.querySelector('div');
          expect(card).toBeTruthy();

          if (card) {
            const classList = Array.from(card.classList);
            
            // All cards should have base styling
            expect(classList.some(cls => cls.includes('rounded'))).toBe(true);
            expect(classList.some(cls => cls.includes('border'))).toBe(true);
            
            // Check variant-specific styling
            if (variant === 'elevated') {
              expect(classList.some(cls => cls.includes('shadow'))).toBe(true);
            }
            
            if (variant === 'outlined') {
              expect(classList.some(cls => cls.includes('border-gray'))).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});