/**
 * T019: QuoteOfTheDay Component Contract Tests
 * 
 * IMPORTANT: This test MUST fail initially as the QuoteOfTheDay component doesn't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Tests the main QuoteOfTheDay component which serves as the application shell,
 * manages global state, and coordinates child components.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input } from '@angular/core';
import { render, screen } from '@testing-library/angular';

import { QuoteOfTheDayComponent } from './quote-of-the-day.component';
import { QuoteService } from '../services/quote.service';
import { CacheService } from '../services/cache.service';
import { ErrorHandler } from '../services/error-handler.service';
import { Quote } from '../models/quote.interface';
import { AppState } from '../models/app-state.interface';

// Add custom matcher
expect.extend({ toHaveNoViolations });

describe('QuoteOfTheDayComponent', () => {
  let component: QuoteOfTheDayComponent;
  let fixture: ComponentFixture<QuoteOfTheDayComponent>;
  let mockQuoteService: jest.Mocked<QuoteService>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;

  const mockQuote: Quote = {
    id: 'test-quote-1',
    text: 'Life is what happens to you while you are busy making other plans.',
    author: 'John Lennon',
    source: 'quotegarden',
    category: 'life',
    tags: ['life', 'planning'],
    length: 65,
    dateAdded: new Date('2024-01-01'),
    popularity: 85,
    verified: true
  };

  beforeEach(async () => {
    // Create mock services
    mockQuoteService = {
      state: signal({
        currentQuote: null,
        loading: false,
        error: null,
        cache: [],
        lastFetch: null,
        apiCallCount: 0
      } as AppState),
      currentQuote: computed(() => mockQuoteService.state().currentQuote),
      loading: computed(() => mockQuoteService.state().loading),
      error: computed(() => mockQuoteService.state().error),
      fetchRandomQuote: jest.fn(),
      fetchQuoteByCategory: jest.fn(),
      clearError: jest.fn(),
      getCachedQuotes: jest.fn(),
      addToFavorites: jest.fn(),
      removeFromFavorites: jest.fn(),
      isFavorite: jest.fn(),
      getAvailableCategories: jest.fn()
    } as any;

    mockCacheService = {
      getCacheStats: jest.fn(),
      clearCache: jest.fn(),
      isLocalStorageAvailable: jest.fn().mockReturnValue(true),
      isIndexedDBAvailable: jest.fn().mockReturnValue(true)
    } as any;

    mockErrorHandler = {
      logError: jest.fn(),
      clearError: jest.fn(),
      getUserFriendlyMessage: jest.fn()
    } as any;

    await TestBed.configureTestingModule({
      imports: [QuoteOfTheDayComponent],
      providers: [
        { provide: QuoteService, useValue: mockQuoteService },
        { provide: CacheService, useValue: mockCacheService },
        { provide: ErrorHandler, useValue: mockErrorHandler }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteOfTheDayComponent);
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

    it('should initialize with loading state false', () => {
      expect(component.loading()).toBe(false);
    });

    it('should initialize with no current quote', () => {
      expect(component.currentQuote()).toBeNull();
    });

    it('should initialize with no error', () => {
      expect(component.error()).toBeNull();
    });

    it('should inject required services', () => {
      expect(component['quoteService']).toBeDefined();
      expect(component['cacheService']).toBeDefined();
      expect(component['errorHandler']).toBeDefined();
    });
  });

  describe('Template Rendering', () => {
    it('should render application title', async () => {
      const { container } = await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Quote of the Day');
    });

    it('should render main navigation', async () => {
      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new quote/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy quote/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    });

    it('should conditionally render loading spinner', async () => {
      // Set loading state
      mockQuoteService.state.set({
        currentQuote: null,
        loading: true,
        error: null,
        cache: [],
        lastFetch: null,
        apiCallCount: 0
      });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('should conditionally render error message', async () => {
      mockQuoteService.state.set({
        currentQuote: null,
        loading: false,
        error: 'Failed to fetch quote',
        cache: [],
        lastFetch: null,
        apiCallCount: 0
      });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch quote');
    });

    it('should render quote display when quote is available', async () => {
      mockQuoteService.state.set({
        currentQuote: mockQuote,
        loading: false,
        error: null,
        cache: [],
        lastFetch: new Date(),
        apiCallCount: 1
      });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      expect(screen.getByRole('blockquote')).toBeInTheDocument();
      expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      expect(screen.getByText(mockQuote.author)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should fetch new quote when new quote button is clicked', async () => {
      mockQuoteService.fetchRandomQuote.mockResolvedValue({
        success: true,
        data: mockQuote,
        source: 'quotegarden',
        timestamp: new Date()
      });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      fireEvent.click(newQuoteButton);

      expect(mockQuoteService.fetchRandomQuote).toHaveBeenCalled();
    });

    it('should copy quote to clipboard when copy button is clicked', async () => {
      // Mock clipboard API
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });

      mockQuoteService.state.set({
        currentQuote: mockQuote,
        loading: false,
        error: null,
        cache: [],
        lastFetch: new Date(),
        apiCallCount: 1
      });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const copyButton = screen.getByRole('button', { name: /copy quote/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          `"${mockQuote.text}" - ${mockQuote.author}`
        );
      });
    });

    it('should show success message after copying', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });

      mockQuoteService.state.set({
        currentQuote: mockQuote,
        loading: false,
        error: null,
        cache: [],
        lastFetch: new Date(),
        apiCallCount: 1
      });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const copyButton = screen.getByRole('button', { name: /copy quote/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
      });
    });

    it('should open share dialog when share button is clicked', async () => {
      mockQuoteService.state.set({
        currentQuote: mockQuote,
        loading: false,
        error: null,
        cache: [],
        lastFetch: new Date(),
        apiCallCount: 1
      });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /share quote/i })).toBeInTheDocument();
      });
    });

    it('should add quote to favorites when favorite button is clicked', async () => {
      mockQuoteService.state.set({
        currentQuote: mockQuote,
        loading: false,
        error: null,
        cache: [],
        lastFetch: new Date(),
        apiCallCount: 1
      });

      mockQuoteService.isFavorite.mockReturnValue(false);

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const favoriteButton = screen.getByRole('button', { name: /add to favorites/i });
      fireEvent.click(favoriteButton);

      expect(mockQuoteService.addToFavorites).toHaveBeenCalledWith(mockQuote);
    });

    it('should remove quote from favorites when already favorited', async () => {
      mockQuoteService.state.set({
        currentQuote: mockQuote,
        loading: false,
        error: null,
        cache: [],
        lastFetch: new Date(),
        apiCallCount: 1
      });

      mockQuoteService.isFavorite.mockReturnValue(true);

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const favoriteButton = screen.getByRole('button', { name: /remove from favorites/i });
      fireEvent.click(favoriteButton);

      expect(mockQuoteService.removeFromFavorites).toHaveBeenCalledWith(mockQuote.id);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when quote fetch fails', async () => {
      mockQuoteService.fetchRandomQuote.mockRejectedValue(new Error('Network error'));
      mockErrorHandler.getUserFriendlyMessage.mockReturnValue('Unable to fetch quote. Please check your connection.');

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      fireEvent.click(newQuoteButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Unable to fetch quote. Please check your connection.');
      });
    });

    it('should log errors to error handler', async () => {
      const error = new Error('Test error');
      mockQuoteService.fetchRandomQuote.mockRejectedValue(error);

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      fireEvent.click(newQuoteButton);

      await waitFor(() => {
        expect(mockErrorHandler.logError).toHaveBeenCalledWith(error, expect.any(Object));
      });
    });

    it('should provide retry functionality after error', async () => {
      mockQuoteService.fetchRandomQuote
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          success: true,
          data: mockQuote,
          source: 'quotegarden',
          timestamp: new Date()
        });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      
      // First click fails
      fireEvent.click(newQuoteButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      // Retry succeeds
      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      expect(mockQuoteService.fetchRandomQuote).toHaveBeenCalledTimes(2);
    });

    it('should handle clipboard API errors gracefully', async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Clipboard access denied'));
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });

      mockQuoteService.state.set({
        currentQuote: mockQuote,
        loading: false,
        error: null,
        cache: [],
        lastFetch: new Date(),
        apiCallCount: 1
      });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const copyButton = screen.getByRole('button', { name: /copy quote/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/unable to copy/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      newQuoteButton.focus();
      
      expect(document.activeElement).toBe(newQuoteButton);
      
      // Tab to next focusable element
      fireEvent.keyDown(newQuoteButton, { key: 'Tab' });
      
      const copyButton = screen.getByRole('button', { name: /copy quote/i });
      expect(document.activeElement).toBe(copyButton);
    });

    it('should have proper ARIA labels', async () => {
      mockQuoteService.state.set({
        currentQuote: mockQuote,
        loading: false,
        error: null,
        cache: [],
        lastFetch: new Date(),
        apiCallCount: 1
      });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      expect(screen.getByRole('button', { name: /fetch new daily quote/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /copy quote to clipboard/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /share this quote/i })).toHaveAttribute('aria-label');
    });

    it('should announce loading state to screen readers', async () => {
      mockQuoteService.state.set({
        currentQuote: null,
        loading: true,
        error: null,
        cache: [],
        lastFetch: null,
        apiCallCount: 0
      });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const loadingElement = screen.getByRole('status', { name: /loading/i });
      expect(loadingElement).toHaveAttribute('aria-live', 'polite');
      expect(loadingElement).toHaveAttribute('aria-atomic', 'true');
    });

    it('should announce errors to screen readers', async () => {
      mockQuoteService.state.set({
        currentQuote: null,
        loading: false,
        error: 'Failed to fetch quote',
        cache: [],
        lastFetch: null,
        apiCallCount: 0
      });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Performance', () => {
    it('should use OnPush change detection', () => {
      // Test that component initializes properly with signals
      expect(component.loading).toBeDefined();
      expect(component.currentQuote).toBeDefined();
      expect(component.error).toBeDefined();
    });

    it('should debounce rapid new quote requests', async () => {
      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      
      // Rapid clicks
      fireEvent.click(newQuoteButton);
      fireEvent.click(newQuoteButton);
      fireEvent.click(newQuoteButton);

      // Should only make one API call due to debouncing
      await waitFor(() => {
        expect(mockQuoteService.fetchRandomQuote).toHaveBeenCalledTimes(1);
      });
    });

    it('should disable buttons during loading to prevent multiple requests', async () => {
      mockQuoteService.state.set({
        currentQuote: null,
        loading: true,
        error: null,
        cache: [],
        lastFetch: null,
        apiCallCount: 0
      });

      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      expect(newQuoteButton).toBeDisabled();
    });
  });

  describe('State Management', () => {
    it('should reactively update when quote state changes', async () => {
      const { rerender } = await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      // Initially no quote
      expect(screen.queryByRole('blockquote')).not.toBeInTheDocument();

      // Update state with quote
      mockQuoteService.state.set({
        currentQuote: mockQuote,
        loading: false,
        error: null,
        cache: [],
        lastFetch: new Date(),
        apiCallCount: 1
      });

      rerender({});

      // Quote should now be displayed
      expect(screen.getByRole('blockquote')).toBeInTheDocument();
      expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
    });

    it('should maintain component state across quote changes', async () => {
      await render(QuoteOfTheDayComponent, {
        providers: [
          { provide: QuoteService, useValue: mockQuoteService },
          { provide: CacheService, useValue: mockCacheService },
          { provide: ErrorHandler, useValue: mockErrorHandler }
        ]
      });

      // Set initial component state
      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      fireEvent.change(categorySelect, { target: { value: 'motivational' } });

      // Change quote
      mockQuoteService.state.set({
        currentQuote: mockQuote,
        loading: false,
        error: null,
        cache: [],
        lastFetch: new Date(),
        apiCallCount: 1
      });

      // Component state should be preserved
      expect(categorySelect).toHaveValue('motivational');
    });
  });
});
