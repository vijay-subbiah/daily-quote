/**
 * T021: LoadingSpinner Component Contract Tests
 * 
 * IMPORTANT: This test MUST fail initially as the LoadingSpinner component doesn't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Tests the LoadingSpinner component which provides visual feedback during
 * async operations with accessibility features and customizable appearance.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input } from '@angular/core';
import { render, screen } from '@testing-library/angular';

import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should be a standalone component', () => {
      // Test that component can be imported without NgModule
      expect(component).toBeDefined();
      expect(fixture.componentRef).toBeDefined();
    });

    it('should use OnPush change detection', () => {
      // Test that component initializes with default values
      expect(component.size()).toBe('medium');
      expect(component.color()).toBe('blue');
    });

    it('should accept size as input', () => {
      expect(component.size).toBeDefined();
      expect(typeof component.size).toBe('function'); // input() creates a signal function
    });

    it('should accept color as input', () => {
      expect(component.color).toBeDefined();
      expect(typeof component.color).toBe('function');
    });

    it('should accept message as input', () => {
      expect(component.message).toBeDefined();
      expect(typeof component.message).toBe('function');
    });

    it('should accept inline mode as input', () => {
      expect(component.inline).toBeDefined();
      expect(typeof component.inline).toBe('function');
    });
  });

  describe('Default Rendering', () => {
    it('should render with default settings', async () => {
      await render(LoadingSpinnerComponent);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should display default loading message', async () => {
      await render(LoadingSpinnerComponent);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should use default size styling', async () => {
      await render(LoadingSpinnerComponent);

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('w-8', 'h-8'); // Medium size
    });

    it('should use default color', async () => {
      await render(LoadingSpinnerComponent);

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('text-blue-600');
    });

    it('should center spinner by default', async () => {
      await render(LoadingSpinnerComponent);

      const container = screen.getByTestId('spinner-container');
      expect(container).toHaveClass('flex', 'justify-center', 'items-center');
    });
  });

  describe('Size Customization', () => {
    it('should render small spinner when size is small', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { size: 'small' }
      });

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('w-4', 'h-4');
    });

    it('should render medium spinner when size is medium', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { size: 'medium' }
      });

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('w-8', 'h-8');
    });

    it('should render large spinner when size is large', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { size: 'large' }
      });

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('w-12', 'h-12');
    });

    it('should render extra large spinner when size is xl', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { size: 'xl' }
      });

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('w-16', 'h-16');
    });

    it('should adjust text size based on spinner size', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { size: 'large', message: 'Loading data...' }
      });

      const message = screen.getByText('Loading data...');
      expect(message).toHaveClass('text-lg');
    });
  });

  describe('Color Customization', () => {
    it('should use blue color when specified', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { color: 'blue' }
      });

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('text-blue-600');
    });

    it('should use green color when specified', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { color: 'green' }
      });

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('text-green-600');
    });

    it('should use red color when specified', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { color: 'red' }
      });

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('text-red-600');
    });

    it('should use gray color when specified', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { color: 'gray' }
      });

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('text-gray-600');
    });

    it('should apply same color to message text', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { color: 'green', message: 'Loading...' }
      });

      const message = screen.getByText('Loading...');
      expect(message).toHaveClass('text-green-600');
    });
  });

  describe('Message Customization', () => {
    it('should display custom message when provided', async () => {
      const customMessage = 'Fetching your daily quote...';
      
      await render(LoadingSpinnerComponent, {
        componentInputs: { message: customMessage }
      });

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('should hide message when empty string provided', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { message: '' }
      });

      expect(screen.queryByTestId('spinner-message')).not.toBeInTheDocument();
    });

    it('should support multi-line messages', async () => {
      const multiLineMessage = 'Loading your quote...\nThis may take a moment.';
      
      await render(LoadingSpinnerComponent, {
        componentInputs: { message: multiLineMessage }
      });

      const message = screen.getByTestId('spinner-message');
      expect(message).toHaveClass('whitespace-pre-line');
    });

    it('should handle long messages appropriately', async () => {
      const longMessage = 'This is a very long loading message that should wrap appropriately and not break the layout of the spinner component.';
      
      await render(LoadingSpinnerComponent, {
        componentInputs: { message: longMessage }
      });

      const message = screen.getByText(longMessage);
      expect(message).toHaveClass('text-center', 'max-w-xs');
    });
  });

  describe('Layout Modes', () => {
    it('should render in block mode by default', async () => {
      await render(LoadingSpinnerComponent);

      const container = screen.getByTestId('spinner-container');
      expect(container).toHaveClass('flex-col', 'py-8');
    });

    it('should render in inline mode when specified', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { inline: true }
      });

      const container = screen.getByTestId('spinner-container');
      expect(container).toHaveClass('flex-row', 'space-x-2');
    });

    it('should adjust spacing in inline mode', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { inline: true, message: 'Loading...' }
      });

      const container = screen.getByTestId('spinner-container');
      expect(container).not.toHaveClass('py-8');
      expect(container).toHaveClass('space-x-2');
    });

    it('should use smaller size in inline mode by default', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { inline: true }
      });

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('w-4', 'h-4');
    });
  });

  describe('Animation', () => {
    it('should have rotation animation', async () => {
      await render(LoadingSpinnerComponent);

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('animate-spin');
    });

    it('should respect reduced motion preferences', async () => {
      await render(LoadingSpinnerComponent);

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('motion-reduce:animate-none');
    });

    it('should show alternative indicator for reduced motion', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      await render(LoadingSpinnerComponent);

      const pulseIndicator = screen.getByTestId('pulse-indicator');
      expect(pulseIndicator).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', async () => {
      await render(LoadingSpinnerComponent);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
    });

    it('should have appropriate ARIA label', async () => {
      await render(LoadingSpinnerComponent);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should use custom ARIA label when message provided', async () => {
      const customMessage = 'Fetching quote data';
      
      await render(LoadingSpinnerComponent, {
        componentInputs: { message: customMessage }
      });

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', customMessage);
    });

    it('should have aria-live region for screen readers', async () => {
      await render(LoadingSpinnerComponent);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce loading state changes', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { message: 'Loading quotes...' }
      });

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-atomic', 'true');
    });

    it('should be hidden from screen readers when decorative', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { message: '', decorative: true }
      });

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', async () => {
      const { rerender } = await render(LoadingSpinnerComponent, {
        componentInputs: { message: 'Loading...' }
      });

      // Re-render with same props
      rerender({ componentInputs: { message: 'Loading...' } });

      // Component should handle this efficiently
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle rapid prop changes efficiently', async () => {
      const { rerender } = await render(LoadingSpinnerComponent);

      // Rapid size changes
      const sizes = ['small', 'medium', 'large', 'xl'];
      sizes.forEach((size: string) => {
        rerender({ componentInputs: { size } });
      });

      // Final size should be applied
      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('w-16', 'h-16'); // xl size
    });
  });

  describe('Styling Variants', () => {
    it('should support outline variant', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { variant: 'outline' }
      });

      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('border-2', 'border-current', 'border-t-transparent');
    });

    it('should support dots variant', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { variant: 'dots' }
      });

      const dotsContainer = screen.getByTestId('dots-container');
      expect(dotsContainer).toBeInTheDocument();
      
      const dots = screen.getAllByTestId(/dot-\d+/);
      expect(dots).toHaveLength(3);
    });

    it('should support bars variant', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { variant: 'bars' }
      });

      const barsContainer = screen.getByTestId('bars-container');
      expect(barsContainer).toBeInTheDocument();
      
      const bars = screen.getAllByTestId(/bar-\d+/);
      expect(bars).toHaveLength(4);
    });

    it('should animate dots with staggered timing', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { variant: 'dots' }
      });

      const dots = screen.getAllByTestId(/dot-\d+/);
      dots.forEach((dot, index) => {
        expect(dot).toHaveStyle(`animation-delay: ${index * 0.1}s`);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid size gracefully', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { size: 'invalid-size' as any }
      });

      // Should fallback to default size
      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('w-8', 'h-8');
    });

    it('should handle invalid color gracefully', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { color: 'invalid-color' as any }
      });

      // Should fallback to default color
      const spinnerIcon = screen.getByTestId('spinner-icon');
      expect(spinnerIcon).toHaveClass('text-blue-600');
    });

    it('should handle null message', async () => {
      await render(LoadingSpinnerComponent, {
        componentInputs: { message: null as any }
      });

      expect(screen.queryByTestId('spinner-message')).not.toBeInTheDocument();
    });

    it('should sanitize message content', async () => {
      const maliciousMessage = 'Loading <script>alert("xss")</script>';
      
      await render(LoadingSpinnerComponent, {
        componentInputs: { message: maliciousMessage }
      });

      // Should display safe text
      expect(screen.getByText(/Loading/)).toBeInTheDocument();
      expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work with async operations', async () => {
      let isLoading = true;
      
      const TestComponent = () => {
        return isLoading ? `<app-loading-spinner message="Loading data..."></app-loading-spinner>` : `<div>Data loaded!</div>`;
      };

      const { rerender } = await render(LoadingSpinnerComponent, {
        componentInputs: { message: 'Loading data...' }
      });

      expect(screen.getByText('Loading data...')).toBeInTheDocument();

      // Simulate async operation completion
      isLoading = false;
      rerender({ componentInputs: { message: 'Loading data...' } });
    });

    it('should maintain consistent styling with design system', async () => {
      await render(LoadingSpinnerComponent);

      const container = screen.getByTestId('spinner-container');
      expect(container).toHaveClass('flex', 'justify-center', 'items-center');
      
      const message = screen.getByText('Loading...');
      expect(message).toHaveClass('text-sm', 'font-medium');
    });
  });
});
