import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import Hero from '../Hero';
import Features from '../Features';
import Benefits from '../Benefits';
import CallToAction from '../CallToAction';
import { Button } from '../ui/Button';

/**
 * **Feature: tax-app-landing, Property 4: Accessibility compliance**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 */

// Custom generators for accessibility testing
const meaningfulString = (minLength: number, maxLength: number) =>
  fc.oneof(
    fc.array(fc.string({ minLength: 3, maxLength: 12 }).filter(s => /^[a-zA-Z]+$/.test(s)), { minLength: 1, maxLength: 5 })
      .map(words => words.join(' '))
      .filter(s => s.length >= minLength && s.length <= maxLength),
    fc.array(fc.constantFrom('Tax', 'App', 'Form', 'IRS', 'Preparation', 'Filing', 'Data', 'User', 'System', 'Process'), { minLength: 2, maxLength: 6 })
      .map(words => words.join(' '))
      .filter(s => s.length >= minLength && s.length <= maxLength)
  );

describe('Accessibility Compliance Property Tests', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  // Property test for keyboard navigation and focus management
  test('All interactive elements should have proper keyboard navigation support', () => {
    fc.assert(
      fc.property(
        fc.record({
          buttonText: meaningfulString(5, 50),
          variant: fc.constantFrom('primary', 'secondary', 'outline'),
          size: fc.constantFrom('sm', 'md', 'lg')
        }),
        (props) => {
          cleanup();
          const { container } = render(
            <Button 
              variant={props.variant as any}
              size={props.size as any}
            >
              {props.buttonText}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeTruthy();
          
          if (button) {
            // Check keyboard navigation support
            expect(button.tabIndex).not.toBe(-1); // Should be focusable
            expect(button.getAttribute('type')).toBe('button'); // Should have proper type
            
            // Check focus management classes
            const classList = Array.from(button.classList);
            expect(classList.some(cls => cls.includes('focus'))).toBe(true);
            
            // Check that button is accessible via keyboard
            expect(button.tagName).toBe('BUTTON');
          }
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property test for ARIA labels and semantic HTML structure
  test('All components should have proper ARIA labels and semantic HTML structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          headline: meaningfulString(10, 100),
          subtitle: meaningfulString(20, 200),
          ctaText: meaningfulString(5, 50)
        }),
        (props) => {
          cleanup();
          const { container } = render(
            <div>
              <Hero 
                headline={props.headline}
                subtitle={props.subtitle}
                ctaText={props.ctaText}
              />
              <Features />
              <Benefits />
              <CallToAction />
            </div>
          );
          
          // Check semantic HTML structure
          const sections = container.querySelectorAll('section');
          expect(sections.length).toBeGreaterThan(0);
          
          // Check that sections have proper ARIA labels
          sections.forEach(section => {
            const hasAriaLabel = section.hasAttribute('aria-labelledby') || 
                                section.hasAttribute('aria-label') ||
                                section.hasAttribute('role');
            expect(hasAriaLabel).toBe(true);
          });
          
          // Check heading hierarchy
          const h1Elements = container.querySelectorAll('h1');
          const h2Elements = container.querySelectorAll('h2');
          const h3Elements = container.querySelectorAll('h3');
          
          expect(h1Elements.length).toBe(1); // Should have exactly one main heading
          expect(h2Elements.length).toBeGreaterThan(0); // Should have section headings
          
          // Check that headings have proper IDs for aria-labelledby
          const headingsWithIds = container.querySelectorAll('h1[id], h2[id], h3[id]');
          expect(headingsWithIds.length).toBeGreaterThan(0);
          
          // Check that interactive elements have proper labels
          const buttons = container.querySelectorAll('button');
          buttons.forEach(button => {
            const hasLabel = button.hasAttribute('aria-label') || 
                            button.hasAttribute('aria-labelledby') ||
                            button.textContent?.trim().length > 0;
            expect(hasLabel).toBe(true);
          });
          
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property test for descriptive alt text for images and visual content
  test('All visual content should have descriptive alt text or proper ARIA attributes', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            title: meaningfulString(5, 50),
            description: meaningfulString(20, 200),
            icon: fc.constant(<div data-testid="feature-icon">Icon</div>)
          }),
          { minLength: 1, maxLength: 4 }
        ),
        (features) => {
          cleanup();
          const { container } = render(<Features features={features} />);
          
          // Check that SVG icons have proper accessibility attributes
          const svgs = container.querySelectorAll('svg');
          svgs.forEach(svg => {
            const hasAccessibilityAttribute = svg.hasAttribute('aria-label') ||
                                            svg.hasAttribute('aria-labelledby') ||
                                            svg.hasAttribute('aria-hidden') ||
                                            svg.hasAttribute('role');
            expect(hasAccessibilityAttribute).toBe(true);
          });
          
          // Check that decorative elements are properly marked
          const decorativeElements = container.querySelectorAll('[aria-hidden="true"]');
          expect(decorativeElements.length).toBeGreaterThan(0);
          
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property test for logical tab order
  test('Interactive elements should have logical tab order', () => {
    fc.assert(
      fc.property(
        fc.record({
          primaryText: meaningfulString(5, 50),
          secondaryText: meaningfulString(5, 50),
          supportText: meaningfulString(5, 30)
        }),
        (props) => {
          cleanup();
          const { container } = render(
            <CallToAction 
              primaryText={props.primaryText}
              secondaryText={props.secondaryText}
              supportText={props.supportText}
            />
          );
          
          // Get all focusable elements
          const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          // Check that focusable elements don't have negative tabindex (unless intentionally hidden)
          focusableElements.forEach(element => {
            const tabIndex = element.getAttribute('tabindex');
            if (tabIndex !== null) {
              expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(0);
            }
          });
          
          // Check that buttons are in logical order (primary before secondary)
          const buttons = Array.from(container.querySelectorAll('button'));
          expect(buttons.length).toBeGreaterThanOrEqual(2);
          
          // Primary CTA should come before secondary CTA in DOM order
          const primaryButton = buttons.find(btn => btn.textContent?.includes(props.primaryText));
          const secondaryButton = buttons.find(btn => btn.textContent?.includes(props.secondaryText));
          
          if (primaryButton && secondaryButton && primaryButton !== secondaryButton) {
            const primaryIndex = buttons.indexOf(primaryButton);
            const secondaryIndex = buttons.indexOf(secondaryButton);
            expect(primaryIndex).toBeLessThan(secondaryIndex);
          }
          
          cleanup();
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property test for color contrast and visual accessibility
  test('All text and interactive elements should have sufficient contrast and visual accessibility', () => {
    fc.assert(
      fc.property(
        fc.record({
          variant: fc.constantFrom('primary', 'secondary', 'outline'),
          text: meaningfulString(5, 50)
        }),
        (props) => {
          cleanup();
          const { container } = render(
            <Button variant={props.variant as any}>
              {props.text}
            </Button>
          );
          
          const button = container.querySelector('button');
          expect(button).toBeTruthy();
          
          if (button) {
            // Check that button has proper styling classes for contrast
            const classList = Array.from(button.classList);
            
            // Primary buttons should have dark background with light text
            if (props.variant === 'primary') {
              expect(classList.some(cls => cls.includes('bg-blue'))).toBe(true);
              expect(classList.some(cls => cls.includes('text-white'))).toBe(true);
            }
            
            // Secondary buttons should have light background with dark text
            if (props.variant === 'secondary') {
              expect(classList.some(cls => cls.includes('bg-gray'))).toBe(true);
              expect(classList.some(cls => cls.includes('text-gray-900'))).toBe(true);
            }
            
            // Outline buttons should have border and proper text color
            if (props.variant === 'outline') {
              expect(classList.some(cls => cls.includes('border'))).toBe(true);
              expect(classList.some(cls => cls.includes('text-gray'))).toBe(true);
            }
            
            // All buttons should have hover and focus states for visual feedback
            const classString = button.className;
            expect(classString).toMatch(/hover:/);
            expect(classString).toMatch(/focus/);
            
            // Check minimum touch target size (handled by CSS)
            expect(classList.some(cls => cls.includes('h-') || cls.includes('py-'))).toBe(true);
            expect(classList.some(cls => cls.includes('px-'))).toBe(true);
          }
          
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Integration property test for comprehensive accessibility compliance
  test('Complete landing page should meet comprehensive accessibility standards', () => {
    fc.assert(
      fc.property(
        fc.record({
          heroHeadline: meaningfulString(10, 100),
          heroSubtitle: meaningfulString(20, 200),
          ctaText: meaningfulString(5, 50)
        }),
        (props) => {
          cleanup();
          const { container } = render(
            <div>
              <Hero 
                headline={props.heroHeadline}
                subtitle={props.heroSubtitle}
                ctaText={props.ctaText}
              />
              <Features />
              <Benefits />
              <CallToAction />
            </div>
          );
          
          // Check overall semantic structure
          const landmarks = container.querySelectorAll('section, main, nav, header, footer');
          expect(landmarks.length).toBeGreaterThan(0);
          
          // Check heading hierarchy is logical
          const h1 = container.querySelectorAll('h1');
          const h2 = container.querySelectorAll('h2');
          const h3 = container.querySelectorAll('h3');
          
          expect(h1.length).toBe(1); // Exactly one main heading
          expect(h2.length).toBeGreaterThan(0); // Section headings exist
          
          // Check that all interactive elements are keyboard accessible
          const interactiveElements = container.querySelectorAll('button, a, input, select, textarea');
          interactiveElements.forEach(element => {
            expect(element.tabIndex).not.toBe(-1);
          });
          
          // Check that lists are properly structured
          const lists = container.querySelectorAll('[role="list"]');
          lists.forEach(list => {
            const listItems = list.querySelectorAll('[role="listitem"]');
            expect(listItems.length).toBeGreaterThan(0);
          });
          
          // Check that complementary content is properly labeled
          const complementaryElements = container.querySelectorAll('[role="complementary"]');
          complementaryElements.forEach(element => {
            const hasLabel = element.hasAttribute('aria-label') || 
                            element.hasAttribute('aria-labelledby');
            expect(hasLabel).toBe(true);
          });
          
          // Check that all images/icons have accessibility attributes
          const images = container.querySelectorAll('img, svg');
          images.forEach(image => {
            const hasAccessibility = image.hasAttribute('alt') ||
                                   image.hasAttribute('aria-label') ||
                                   image.hasAttribute('aria-labelledby') ||
                                   image.hasAttribute('aria-hidden') ||
                                   image.hasAttribute('role');
            expect(hasAccessibility).toBe(true);
          });
          
          cleanup();
        }
      ),
      { numRuns: 30 }
    );
  });
});