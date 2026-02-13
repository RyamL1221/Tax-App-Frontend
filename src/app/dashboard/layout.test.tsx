/**
 * Unit tests for Dashboard Layout
 * 
 * Tests that the dashboard layout:
 * - Exports correct metadata
 * - Renders children correctly
 * 
 * **Validates: Requirement 6.3**
 */

import React from 'react';
import { render } from '@testing-library/react';
import DashboardLayout, { metadata } from './layout';

describe('Dashboard Layout', () => {
  describe('Metadata', () => {
    test('exports metadata with correct title', () => {
      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('Tax Form Dashboard | Tax App');
    });

    test('exports metadata with correct description', () => {
      expect(metadata).toBeDefined();
      expect(metadata.description).toBe('Select and access tax forms for completion');
    });
  });

  describe('Layout Rendering', () => {
    test('renders children correctly', () => {
      const { getByText } = render(
        <DashboardLayout>
          <div>Test Child Content</div>
        </DashboardLayout>
      );

      expect(getByText('Test Child Content')).toBeInTheDocument();
    });

    test('renders multiple children', () => {
      const { getByText } = render(
        <DashboardLayout>
          <div>First Child</div>
          <div>Second Child</div>
        </DashboardLayout>
      );

      expect(getByText('First Child')).toBeInTheDocument();
      expect(getByText('Second Child')).toBeInTheDocument();
    });
  });
});
