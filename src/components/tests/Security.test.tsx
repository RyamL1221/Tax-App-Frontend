import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Security from '../Security';

describe('Security Component', () => {
  describe('Heading', () => {
    test('renders the heading with correct text', () => {
      render(<Security />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Your Data is Secure');
    });
  });

  describe('AWS / Encryption Copy', () => {
    test('paragraph mentions AWS', () => {
      render(<Security />);

      expect(screen.getByText(/AWS/)).toBeInTheDocument();
    });

    test('paragraph mentions encryption', () => {
      render(<Security />);

      expect(
        screen.getByText(/encrypted at rest and in transit/i)
      ).toBeInTheDocument();
    });
  });

  describe('Service Badges', () => {
    test('renders S3 badge with description', () => {
      render(<Security />);

      expect(screen.getByText('S3')).toBeInTheDocument();
      expect(screen.getByText('Encrypted file storage')).toBeInTheDocument();
    });

    test('renders Lambda badge with description', () => {
      render(<Security />);

      expect(screen.getByText('Lambda')).toBeInTheDocument();
      expect(screen.getByText('Serverless processing')).toBeInTheDocument();
    });

    test('renders DynamoDB badge with description', () => {
      render(<Security />);

      expect(screen.getByText('DynamoDB')).toBeInTheDocument();
      expect(screen.getByText('Encrypted database')).toBeInTheDocument();
    });

    test('renders all 3 badges', () => {
      render(<Security />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });
  });

  describe('Accessibility / Semantics', () => {
    test('wraps content in a section with aria-labelledby', () => {
      render(<Security />);

      const section = screen.getByRole('region', { name: /your data is secure/i });
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-labelledby', 'security-heading');
    });

    test('heading has the correct id referenced by aria-labelledby', () => {
      render(<Security />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveAttribute('id', 'security-heading');
    });

    test('badges are wrapped in a list container', () => {
      render(<Security />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    test('each badge has role="listitem"', () => {
      render(<Security />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
      items.forEach((item) => {
        expect(item).toHaveAttribute('role', 'listitem');
      });
    });
  });
});
