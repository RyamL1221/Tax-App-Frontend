import React from 'react';
import { render, screen } from '@testing-library/react';
import { PasswordRequirements } from '../PasswordRequirements';

describe('PasswordRequirements', () => {
  describe('Rendering (Requirements 3.5)', () => {
    it('renders the requirements title', () => {
      render(<PasswordRequirements />);
      
      expect(screen.getByText('Password must contain:')).toBeInTheDocument();
    });

    it('renders all five password requirements', () => {
      render(<PasswordRequirements />);
      
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
      expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
      expect(screen.getByText('One number')).toBeInTheDocument();
      expect(screen.getByText('One special character')).toBeInTheDocument();
    });

    it('renders requirements in a list format', () => {
      const { container } = render(<PasswordRequirements />);
      
      const list = container.querySelector('ul');
      expect(list).toBeInTheDocument();
      
      const listItems = container.querySelectorAll('li');
      expect(listItems).toHaveLength(5);
    });
  });

  describe('Accessibility (Requirements 7.1)', () => {
    it('has proper ARIA label for accessibility', () => {
      const { container } = render(<PasswordRequirements />);
      
      const requirementsContainer = container.querySelector('[aria-label="Password requirements"]');
      expect(requirementsContainer).toBeInTheDocument();
    });

    it('uses aria-hidden for decorative bullet points', () => {
      const { container } = render(<PasswordRequirements />);
      
      const bullets = container.querySelectorAll('[aria-hidden="true"]');
      expect(bullets.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('has proper container styling', () => {
      const { container } = render(<PasswordRequirements />);
      
      const requirementsContainer = container.querySelector('[aria-label="Password requirements"]');
      expect(requirementsContainer).toHaveClass('mt-2', 'p-3', 'bg-gray-50', 'rounded-md', 'border', 'border-gray-200');
    });

    it('has proper title styling', () => {
      render(<PasswordRequirements />);
      
      const title = screen.getByText('Password must contain:');
      expect(title).toHaveClass('text-sm', 'font-medium', 'text-gray-700', 'mb-2');
    });

    it('has proper list styling', () => {
      const { container } = render(<PasswordRequirements />);
      
      const list = container.querySelector('ul');
      expect(list).toHaveClass('space-y-1', 'text-sm', 'text-gray-600');
    });

    it('has proper list item styling', () => {
      const { container } = render(<PasswordRequirements />);
      
      const listItems = container.querySelectorAll('li');
      listItems.forEach(item => {
        expect(item).toHaveClass('flex', 'items-start');
      });
    });
  });

  describe('Custom props', () => {
    it('accepts custom className', () => {
      const { container } = render(<PasswordRequirements className="custom-class" />);
      
      const requirementsContainer = container.querySelector('[aria-label="Password requirements"]');
      expect(requirementsContainer).toHaveClass('custom-class');
    });

    it('maintains default classes with custom className', () => {
      const { container } = render(<PasswordRequirements className="custom-class" />);
      
      const requirementsContainer = container.querySelector('[aria-label="Password requirements"]');
      expect(requirementsContainer).toHaveClass('mt-2', 'p-3', 'bg-gray-50', 'custom-class');
    });
  });

  describe('Content accuracy', () => {
    it('displays correct minimum character requirement', () => {
      render(<PasswordRequirements />);
      
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    });

    it('displays correct uppercase requirement', () => {
      render(<PasswordRequirements />);
      
      expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    });

    it('displays correct lowercase requirement', () => {
      render(<PasswordRequirements />);
      
      expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
    });

    it('displays correct number requirement', () => {
      render(<PasswordRequirements />);
      
      expect(screen.getByText('One number')).toBeInTheDocument();
    });

    it('displays correct special character requirement', () => {
      render(<PasswordRequirements />);
      
      expect(screen.getByText('One special character')).toBeInTheDocument();
    });
  });

  describe('Visual structure', () => {
    it('renders title before the list', () => {
      const { container } = render(<PasswordRequirements />);
      
      const title = screen.getByText('Password must contain:');
      const list = container.querySelector('ul');
      
      expect(title.compareDocumentPosition(list!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });

    it('renders all requirements as separate list items', () => {
      const { container } = render(<PasswordRequirements />);
      
      const listItems = container.querySelectorAll('li');
      const requirements = [
        'At least 8 characters',
        'One uppercase letter',
        'One lowercase letter',
        'One number',
        'One special character'
      ];
      
      expect(listItems).toHaveLength(requirements.length);
      
      requirements.forEach((requirement, index) => {
        expect(listItems[index]).toHaveTextContent(requirement);
      });
    });
  });
});
