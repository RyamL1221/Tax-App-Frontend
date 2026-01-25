import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import Hero from './Hero';
import Features from './Features';
import Benefits from './Benefits';
import CallToAction from './CallToAction';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
// Import Jest functions instead of Node.js test

/**
 * **Feature: tax-app-landing, Property 1: Essential content presence**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 3.1, 3.3, 5.1, 5.2, 5.3, 5.4**
 */

// Custom string generator that creates realistic text content
const meaningfulString = (minLength: number, maxLength: number) =>
  fc.oneof(
    // Generate realistic words and phrases
    fc.array(fc.string({ minLength: 3, maxLength: 12 }).filter(s => /^[a-zA-Z]+$/.test(s)), { minLength: 1, maxLength: 5 })
      .map(words => words.join(' '))
      .filter(s => s.length >= minLength && s.length <= maxLength),
    // Generate simple sentences with tax-related words
    fc.array(fc.constantFrom('Tax', 'App', 'Form', 'IRS', 'Preparation', 'Filing', 'Data', 'User', 'System', 'Process', 'Simple', 'Easy', 'Quick', 'Secure'), { minLength: 2, maxLength: 8 })
      .map(words => words.join(' '))
      .filter(s => s.length >= minLength && s.length <= maxLength)
  );

describe('Essential Content Presence Property Tests', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  // Property test for Hero component essential content
  test('Hero component should always contain essential content elements', () => {
    fc.assert(
      fc.property(
        fc.record({
          headline: meaningfulString(10, 100),
          subtitle: meaningfulString(20, 200),
          ctaText: meaningfulString(5, 50)
        }),
        (props) => {
          cleanup(); // Clean up before each property test run
          const { container } = render(
            <Hero 
              headline={props.headline}
              subtitle={props.subtitle}
              ctaText={props.ctaText}
            />
          );
          
          // Essential content should be present
          expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
          expect(screen.getByText(props.headline)).toBeInTheDocument();
          expect(screen.getByText(props.subtitle)).toBeInTheDocument();
          expect(screen.getByRole('button', { name: props.ctaText })).toBeInTheDocument();
          
          // Should have proper semantic structure
          expect(container.querySelector('section')).toBeInTheDocument();
          
          cleanup(); // Clean up after each property test run
        }
      ),
      { numRuns: 20 }
    );
  });

  // Property test for Features component essential content
  test('Features component should always contain essential feature information', () => {
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
          render(<Features features={features} />);
          
          // Should have main heading
          expect(screen.getByRole('heading', { level: 2, name: /key features/i })).toBeInTheDocument();
          
          // Each feature should have essential elements
          features.forEach((feature) => {
            expect(screen.getByText(feature.title)).toBeInTheDocument();
            expect(screen.getByText(feature.description)).toBeInTheDocument();
          });
          
          // Should have proper grid structure
          const featureCards = screen.getAllByRole('heading', { level: 3 });
          expect(featureCards.length).toBe(features.length);
          
          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  // Property test for Benefits component essential content
  test('Benefits component should always contain essential benefit information', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            title: meaningfulString(5, 50),
            description: meaningfulString(20, 200),
            metric: fc.option(meaningfulString(2, 20), { nil: undefined })
          }).filter(benefit => !benefit.metric || benefit.title !== benefit.metric), // Ensure title and metric are different
          { minLength: 1, maxLength: 4 }
        ),
        (benefits) => {
          cleanup();
          render(<Benefits benefits={benefits} />);
          
          // Should have main heading
          expect(screen.getByRole('heading', { level: 2, name: /why choose tax app/i })).toBeInTheDocument();
          
          // Should have comparison section
          expect(screen.getByText(/traditional vs\. tax app/i)).toBeInTheDocument();
          expect(screen.getByText(/traditional methods/i)).toBeInTheDocument();
          expect(screen.getByText(/tax app advantages/i)).toBeInTheDocument();
          
          // Each benefit should have essential elements
          benefits.forEach((benefit) => {
            expect(screen.getByText(benefit.title)).toBeInTheDocument();
            expect(screen.getByText(benefit.description)).toBeInTheDocument();
            if (benefit.metric) {
              expect(screen.getByText(benefit.metric)).toBeInTheDocument();
            }
          });
          
          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  // Property test for CallToAction component essential content
  test('CallToAction component should always contain essential CTA elements', () => {
    fc.assert(
      fc.property(
        fc.record({
          primaryText: meaningfulString(5, 50),
          secondaryText: meaningfulString(5, 50),
          supportText: meaningfulString(5, 30)
        }),
        (props) => {
          cleanup();
          render(
            <CallToAction 
              primaryText={props.primaryText}
              secondaryText={props.secondaryText}
              supportText={props.supportText}
            />
          );
          
          // Should have main heading
          expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
          
          // Should have primary and secondary CTAs
          expect(screen.getByRole('button', { name: props.primaryText })).toBeInTheDocument();
          expect(screen.getByRole('button', { name: props.secondaryText })).toBeInTheDocument();
          
          // Should have support link
          expect(screen.getByRole('button', { name: props.supportText })).toBeInTheDocument();
          
          // Should have trust indicators
          expect(screen.getByText(/bank-level security/i)).toBeInTheDocument();
          expect(screen.getByText(/irs compliant/i)).toBeInTheDocument();
          expect(screen.getByText(/24\/7 support/i)).toBeInTheDocument();
          
          // Should have security information
          expect(screen.getByText(/256-bit ssl encryption/i)).toBeInTheDocument();
          
          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });

  // Integration property test for all components together
  test('All components together should contain comprehensive essential content', () => {
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
          
          // Should have all major sections
          const sections = container.querySelectorAll('section');
          expect(sections.length).toBe(4); // Hero, Features, Benefits, CTA
          
          // Should have proper heading hierarchy
          const h1Elements = screen.getAllByRole('heading', { level: 1 });
          const h2Elements = screen.getAllByRole('heading', { level: 2 });
          expect(h1Elements.length).toBe(1); // Only one main headline
          expect(h2Elements.length).toBeGreaterThanOrEqual(3); // Features, Benefits, CTA headings
          
          // Should have multiple CTAs
          const buttons = screen.getAllByRole('button');
          expect(buttons.length).toBeGreaterThanOrEqual(3); // Hero CTA, Primary CTA, Secondary CTA, Support
          
          // Should contain tax-related content
          expect(container.textContent).toMatch(/tax/i);
          expect(container.textContent).toMatch(/irs/i);
          expect(container.textContent).toMatch(/form/i);
          
          cleanup();
        }
      ),
      { numRuns: 20 }
    );
  });
});