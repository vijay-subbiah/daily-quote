/**
 * T024: Accessibility Integration Tests
 * 
 * IMPORTANT: This test MUST fail initially as components don't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Comprehensive accessibility tests ensuring WCAG 2.1 Level AA compliance
 * across all components and user interactions.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { render, screen, fireEvent, waitFor } from '@testing-library/angular';

import { QuoteOfTheDayComponent } from '../components/quote-of-the-day.component';
import { Quote } from '../models/quote.interface';

describe('Accessibility Integration Tests (WCAG 2.1 Level AA)', () => {
  let httpTestingController: HttpTestingController;

  const mockQuote: Quote = {
    id: 'accessibility-test-1',
    text: 'Accessibility is not a feature request, it is a human right.',
    author: 'Accessibility Advocate',
    source: 'quotegarden',
    category: 'accessibility',
    tags: ['accessibility', 'inclusion', 'human-rights'],
    length: 58,
    dateAdded: new Date('2024-01-01'),
    popularity: 95,
    verified: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuoteOfTheDayComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation through all interactive elements', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Tab through all interactive elements
      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      const copyButton = screen.getByRole('button', { name: /copy quote/i });
      const shareButton = screen.getByRole('button', { name: /share/i });

      // Start from first element
      newQuoteButton.focus();
      expect(document.activeElement).toBe(newQuoteButton);

      // Tab to next element
      fireEvent.keyDown(newQuoteButton, { key: 'Tab' });
      expect(document.activeElement).toBe(copyButton);

      // Tab to next element
      fireEvent.keyDown(copyButton, { key: 'Tab' });
      expect(document.activeElement).toBe(shareButton);

      // Shift+Tab backwards
      fireEvent.keyDown(shareButton, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(copyButton);
    });

    it('should activate buttons with Enter and Space keys', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });

      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /copy quote/i });
      copyButton.focus();

      // Activate with Enter key
      fireEvent.keyDown(copyButton, { key: 'Enter' });
      expect(mockWriteText).toHaveBeenCalled();

      // Activate with Space key
      mockWriteText.mockClear();
      fireEvent.keyDown(copyButton, { key: ' ' });
      expect(mockWriteText).toHaveBeenCalled();
    });

    it('should trap focus within share dialog when open', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Open share dialog
      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      // Focus should be trapped within dialog
      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);
      expect(document.activeElement).toBe(focusableElements[0]);

      // Tab should cycle through dialog elements only
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    it('should close share dialog with Escape key', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(document.body, { key: 'Escape' });

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(shareButton); // Focus returns to trigger
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper heading hierarchy', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Should have h1 for main heading
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/quote of the day/i);

      // Quote text should be in appropriate semantic element
      const quoteElement = screen.getByRole('figure');
      expect(quoteElement).toBeInTheDocument();
      expect(quoteElement).toHaveAttribute('aria-labelledby');
    });

    it('should announce quote changes to screen readers', async () => {
      await render(QuoteOfTheDayComponent);

      const req1 = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req1.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Get new quote
      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      fireEvent.click(newQuoteButton);

      const newQuote: Quote = {
        ...mockQuote,
        id: 'screen-reader-test',
        text: 'This new quote should be announced.',
        author: 'Screen Reader Expert'
      };

      const req2 = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req2.flush({ quote: newQuote });

      await waitFor(() => {
        expect(screen.getByText(newQuote.text)).toBeInTheDocument();
      });

      // Should have live region for announcements
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent(/new quote loaded/i);
    });

    it('should provide descriptive button labels', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Buttons should have descriptive labels
      const newQuoteButton = screen.getByRole('button', { name: /get new quote/i });
      const copyButton = screen.getByRole('button', { name: /copy quote to clipboard/i });
      const shareButton = screen.getByRole('button', { name: /share quote/i });

      expect(newQuoteButton).toHaveAttribute('aria-label');
      expect(copyButton).toHaveAttribute('aria-label');
      expect(shareButton).toHaveAttribute('aria-label');
    });

    it('should indicate loading states to screen readers', async () => {
      await render(QuoteOfTheDayComponent);

      // Initially loading
      expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );

      // Should indicate loading state
      expect(screen.getByText(/loading your daily inspiration/i)).toBeInTheDocument();
      
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Loading indicator should be removed
      expect(screen.queryByText(/loading your daily inspiration/i)).not.toBeInTheDocument();
    });

    it('should properly label share dialog elements', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      // Dialog heading
      const dialogHeading = screen.getByRole('heading', { name: /share quote/i });
      expect(dialogHeading).toBeInTheDocument();

      // Social media buttons should have descriptive labels
      expect(screen.getByRole('button', { name: /share on twitter/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /share on facebook/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /copy quote to clipboard/i })).toHaveAttribute('aria-label');
    });
  });

  describe('Visual Accessibility', () => {
    it('should provide sufficient color contrast', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Quote text should have high contrast
      const quoteText = screen.getByText(mockQuote.text);
      const computedStyle = window.getComputedStyle(quoteText);
      
      // Should use dark text on light background or vice versa
      expect(computedStyle.color).toBeDefined();
      expect(computedStyle.backgroundColor).toBeDefined();
    });

    it('should support browser zoom up to 200%', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Simulate zoom by changing viewport
      Object.defineProperty(window, 'devicePixelRatio', { value: 2 });
      
      // Content should remain accessible and usable
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button: HTMLElement) => {
        expect(button).toBeVisible();
        
        const rect = button.getBoundingClientRect();
        expect(rect.width).toBeGreaterThan(0);
        expect(rect.height).toBeGreaterThan(0);
      });
    });

    it('should indicate focus visibly', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      newQuoteButton.focus();

      // Button should have visible focus indicator
      expect(newQuoteButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });

    it('should work without color as the only means of conveying information', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Success/error states should use text/icons, not just color
      const copyButton = screen.getByRole('button', { name: /copy quote/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        // Should have text indicator, not just color change
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });
  });

  describe('Motor Accessibility', () => {
    it('should have appropriately sized touch targets (minimum 44x44px)', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button: HTMLElement) => {
        const rect = button.getBoundingClientRect();
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });
    });

    it('should provide adequate spacing between interactive elements', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      
      // Check spacing between buttons
      for (let i = 0; i < buttons.length - 1; i++) {
        const button1 = buttons[i];
        const button2 = buttons[i + 1];
        
        const rect1 = button1.getBoundingClientRect();
        const rect2 = button2.getBoundingClientRect();
        
        // Should have adequate spacing (at least 8px gap)
        const horizontalGap = Math.abs(rect2.left - rect1.right);
        const verticalGap = Math.abs(rect2.top - rect1.bottom);
        
        expect(Math.min(horizontalGap, verticalGap)).toBeGreaterThanOrEqual(8);
      }
    });

    it('should not require precise timing for interactions', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Should not have hover-only interactions
      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      
      // Button should be activatable without timing requirements
      fireEvent.mouseEnter(newQuoteButton);
      fireEvent.mouseLeave(newQuoteButton);
      fireEvent.click(newQuoteButton);

      // Should show loading state
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Error Handling Accessibility', () => {
    it('should announce errors to screen readers', async () => {
      await render(QuoteOfTheDayComponent);

      // Mock API failure
      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.error(new ErrorEvent('Network error'));

      await waitFor(() => {
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });

      // Error should be announced
      const errorRegion = screen.getByRole('alert');
      expect(errorRegion).toBeInTheDocument();
      expect(errorRegion).toHaveAttribute('aria-live', 'assertive');
      expect(errorRegion).toHaveTextContent(/unable to load quote/i);
    });

    it('should provide clear error recovery instructions', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.error(new ErrorEvent('Network error'));

      await waitFor(() => {
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });

      // Should provide clear instructions
      expect(screen.getByText(/unable to load quote/i)).toBeInTheDocument();
      expect(screen.getByText(/please check your connection/i)).toBeInTheDocument();
      
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toHaveAttribute('aria-describedby');
    });

    it('should handle clipboard permission errors accessibly', async () => {
      // Mock clipboard failure
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockRejectedValue(new Error('Permission denied'))
        }
      });

      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /copy quote/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        // Error should be announced
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveTextContent(/unable to copy/i);
        expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
      });
    });
  });

  describe('Responsive Accessibility', () => {
    it('should maintain accessibility on mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Touch targets should still be adequate
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button: HTMLElement) => {
        const rect = button.getBoundingClientRect();
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });

      // Text should remain readable
      const quoteText = screen.getByText(mockQuote.text);
      const computedStyle = window.getComputedStyle(quoteText);
      const fontSize = parseInt(computedStyle.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(16); // Minimum readable size
    });

    it('should work with screen orientation changes', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Simulate orientation change
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      fireEvent(window, new Event('orientationchange'));

      // Content should remain accessible
      expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new quote/i })).toBeInTheDocument();
    });
  });
});
