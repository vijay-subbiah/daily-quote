/**
 * T023: User Stories Integration Tests
 * 
 * IMPORTANT: This test MUST fail initially as components don't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Integration tests that verify complete user stories and workflows
 * across multiple components working together.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/angular';
import { axe, toHaveNoViolations } from 'jest-axe';

import { QuoteOfTheDayComponent } from '../components/quote-of-the-day.component';
import { QuoteService } from '../services/quote.service';
import { Quote } from '../models/quote.interface';

expect.extend(toHaveNoViolations);

describe('User Stories Integration Tests', () => {
  let httpTestingController: HttpTestingController;

  const mockQuote: Quote = {
    id: 'integration-test-1',
    text: 'Integration testing is the key to confident deployment.',
    author: 'Test Guru',
    source: 'quotegarden',
    category: 'testing',
    tags: ['testing', 'integration', 'quality'],
    length: 52,
    dateAdded: new Date('2024-01-01'),
    popularity: 85,
    verified: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuoteOfTheDayComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        QuoteService
      ]
    });

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('US001: Display Quote of the Day', () => {
    it('should load and display a quote when user visits the application', async () => {
      await render(QuoteOfTheDayComponent);

      // Should show loading state initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/loading your daily inspiration/i)).toBeInTheDocument();

      // Mock API response
      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      // Should display the quote after loading
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
        expect(screen.getByText(mockQuote.author)).toBeInTheDocument();
      });

      // Should show action buttons
      expect(screen.getByRole('button', { name: /new quote/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy quote/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });

    it('should handle API failure gracefully and show fallback quote', async () => {
      await render(QuoteOfTheDayComponent);

      // Mock API failure
      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.error(new ErrorEvent('Network error'));

      // Should display fallback quote
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        expect(screen.getByText(/the only way to do great work/i)).toBeInTheDocument();
        expect(screen.getByText(/steve jobs/i)).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should retry API call when retry button is clicked', async () => {
      await render(QuoteOfTheDayComponent);

      // Mock initial API failure
      const req1 = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req1.error(new ErrorEvent('Network error'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      // Should make new API call
      const req2 = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req2.flush({ quote: mockQuote });

      // Should display the new quote
      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('US002: Get New Quote', () => {
    it('should fetch and display new quote when "New Quote" button is clicked', async () => {
      await render(QuoteOfTheDayComponent);

      // Initial quote load
      const req1 = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req1.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Click new quote button
      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      fireEvent.click(newQuoteButton);

      // Should show loading state
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Mock new quote response
      const newQuote: Quote = {
        ...mockQuote,
        id: 'new-quote-2',
        text: 'A new quote for testing purposes.',
        author: 'New Author'
      };

      const req2 = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req2.flush({ quote: newQuote });

      // Should display new quote
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        expect(screen.getByText(newQuote.text)).toBeInTheDocument();
        expect(screen.getByText(newQuote.author)).toBeInTheDocument();
        expect(screen.queryByText(mockQuote.text)).not.toBeInTheDocument();
      });
    });

    it('should disable new quote button while loading', async () => {
      await render(QuoteOfTheDayComponent);

      // Initial quote load
      const req1 = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req1.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      fireEvent.click(newQuoteButton);

      // Button should be disabled while loading
      expect(newQuoteButton).toBeDisabled();
      expect(newQuoteButton).toHaveAttribute('aria-disabled', 'true');

      // Complete the request
      const req2 = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req2.flush({ quote: mockQuote });

      // Button should be enabled again
      await waitFor(() => {
        expect(newQuoteButton).not.toBeDisabled();
        expect(newQuoteButton).not.toHaveAttribute('aria-disabled');
      });
    });
  });

  describe('US003: Copy Quote', () => {
    beforeEach(() => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined)
        }
      });
    });

    it('should copy formatted quote to clipboard when copy button is clicked', async () => {
      await render(QuoteOfTheDayComponent);

      // Load initial quote
      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Click copy button
      const copyButton = screen.getByRole('button', { name: /copy quote/i });
      fireEvent.click(copyButton);

      // Should copy formatted text
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `"${mockQuote.text}" - ${mockQuote.author}`
      );

      // Should show success feedback
      await waitFor(() => {
        expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
      });
    });

    it('should show temporary success message that disappears', async () => {
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

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
      });

      // Message should disappear after timeout
      await waitFor(() => {
        expect(screen.queryByText(/copied to clipboard/i)).not.toBeInTheDocument();
      }, { timeout: 3500 });
    });

    it('should handle clipboard API errors gracefully', async () => {
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

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/unable to copy/i)).toBeInTheDocument();
      });
    });
  });

  describe('US004: Share Quote', () => {
    it('should open share dialog when share button is clicked', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Click share button
      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      // Should open share dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /share quote/i })).toBeInTheDocument();

      // Should show social media options
      expect(screen.getByRole('button', { name: /share on twitter/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on facebook/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on linkedin/i })).toBeInTheDocument();
    });

    it('should close share dialog when close button is clicked', async () => {
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

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close dialog
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should open social media sharing in new window', async () => {
      const mockOpen = jest.fn();
      window.open = mockOpen;

      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Open share dialog and click Twitter
      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      const twitterButton = screen.getByRole('button', { name: /share on twitter/i });
      fireEvent.click(twitterButton);

      // Should open Twitter in new window
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        expect.stringContaining('width=600,height=400')
      );
    });
  });

  describe('Cross-Component Integration', () => {
    it('should maintain quote state across component interactions', async () => {
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

      // Quote should be displayed in dialog
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(mockQuote.text)).toBeInTheDocument();
      expect(within(dialog).getByText(mockQuote.author)).toBeInTheDocument();

      // Close dialog
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      // Original quote should still be displayed
      expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      expect(screen.getByText(mockQuote.author)).toBeInTheDocument();
    });

    it('should handle rapid user interactions gracefully', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Rapid button clicks
      const copyButton = screen.getByRole('button', { name: /copy quote/i });
      const shareButton = screen.getByRole('button', { name: /share/i });

      // Multiple rapid clicks
      fireEvent.click(copyButton);
      fireEvent.click(shareButton);
      fireEvent.click(copyButton);

      // Should handle gracefully without errors
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should preserve user preferences across quote changes', async () => {
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
        id: 'new-quote-3',
        text: 'Another inspirational quote.',
        author: 'Another Author'
      };

      const req2 = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req2.flush({ quote: newQuote });

      await waitFor(() => {
        expect(screen.getByText(newQuote.text)).toBeInTheDocument();
      });

      // UI preferences and state should be preserved
      expect(screen.getByRole('button', { name: /copy quote/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new quote/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility standards across all interactions', async () => {
      const { container } = await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Check accessibility in default state
      const results = await axe(container);
      expect(results).toHaveNoViolations();

      // Open share dialog and check accessibility
      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      const dialogResults = await axe(container);
      expect(dialogResults).toHaveNoViolations();

      // Verify focus management
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /close/i }));
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
        id: 'announced-quote',
        text: 'This quote change should be announced.',
        author: 'Accessibility Expert'
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
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Performance Integration', () => {
    it('should handle multiple rapid API calls efficiently', async () => {
      await render(QuoteOfTheDayComponent);

      // Initial load
      const req1 = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req1.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Rapid new quote requests
      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      
      // Click multiple times rapidly
      fireEvent.click(newQuoteButton);
      fireEvent.click(newQuoteButton);
      fireEvent.click(newQuoteButton);

      // Should only make one additional request (debounced)
      const req2 = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req2.flush({ quote: mockQuote });

      // No additional requests should be pending
      httpTestingController.verify();
    });
  });
});
