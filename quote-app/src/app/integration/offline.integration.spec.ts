/**
 * T025: Offline Functionality Integration Tests
 * 
 * IMPORTANT: This test MUST fail initially as components don't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Tests offline functionality, service worker integration, and graceful
 * degradation when network connectivity is unavailable.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { render, screen, fireEvent, waitFor } from '@testing-library/angular';

import { QuoteOfTheDayComponent } from '../components/quote-of-the-day.component';
import { QuoteService } from '../services/quote.service';
import { Quote } from '../models/quote.interface';

describe('Offline Functionality Integration Tests', () => {
  let httpTestingController: HttpTestingController;
  let quoteService: QuoteService;

  const mockQuote: Quote = {
    id: 'offline-test-1',
    text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    author: 'Chinese Proverb',
    source: 'local',
    category: 'wisdom',
    tags: ['wisdom', 'time', 'action'],
    length: 71,
    dateAdded: new Date('2024-01-01'),
    popularity: 92,
    verified: true
  };

  const fallbackQuotes: Quote[] = [
    {
      id: 'fallback-1',
      text: 'The only way to do great work is to love what you do.',
      author: 'Steve Jobs',
      source: 'local',
      category: 'work',
      tags: ['work', 'passion'],
      length: 49,
      dateAdded: new Date('2024-01-01'),
      popularity: 90,
      verified: true
    },
    {
      id: 'fallback-2',
      text: 'Innovation distinguishes between a leader and a follower.',
      author: 'Steve Jobs',
      source: 'local',
      category: 'innovation',
      tags: ['innovation', 'leadership'],
      length: 55,
      dateAdded: new Date('2024-01-01'),
      popularity: 88,
      verified: true
    }
  ];

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
    quoteService = TestBed.inject(QuoteService);

    // Mock localStorage for offline storage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    httpTestingController.verify();
    jest.clearAllMocks();
  });

  describe('Network Detection', () => {
    it('should detect when user goes offline', async () => {
      await render(QuoteOfTheDayComponent);

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      fireEvent(window, new Event('offline'));

      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
        expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
      });
    });

    it('should detect when user comes back online', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      await render(QuoteOfTheDayComponent);

      // Should show offline state initially
      expect(screen.getByText(/you are offline/i)).toBeInTheDocument();

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      fireEvent(window, new Event('online'));

      // Should attempt to fetch new quote
      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
        expect(screen.queryByText(/you are offline/i)).not.toBeInTheDocument();
      });
    });

    it('should show appropriate offline messaging', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      await render(QuoteOfTheDayComponent);

      // Should show informative offline message
      expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
      expect(screen.getByText(/showing saved quotes/i)).toBeInTheDocument();
      
      // Should have offline icon
      expect(screen.getByTestId('offline-icon')).toBeInTheDocument();
    });
  });

  describe('Cached Quote Management', () => {
    it('should save quotes to localStorage when online', async () => {
      const mockSetItem = jest.fn();
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, setItem: mockSetItem },
        writable: true,
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

      // Should save quote to localStorage
      expect(mockSetItem).toHaveBeenCalledWith(
        'cached-quotes',
        expect.stringContaining(mockQuote.id)
      );
    });

    it('should retrieve quotes from localStorage when offline', async () => {
      const mockGetItem = jest.fn().mockReturnValue(JSON.stringify(fallbackQuotes));
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem },
        writable: true,
      });

      Object.defineProperty(navigator, 'onLine', { value: false });

      await render(QuoteOfTheDayComponent);

      // Should retrieve from localStorage
      expect(mockGetItem).toHaveBeenCalledWith('cached-quotes');

      // Should display cached quote
      await waitFor(() => {
        expect(screen.getByText(fallbackQuotes[0].text)).toBeInTheDocument();
        expect(screen.getByText(fallbackQuotes[0].author)).toBeInTheDocument();
      });
    });

    it('should cycle through cached quotes when offline', async () => {
      const mockGetItem = jest.fn().mockReturnValue(JSON.stringify(fallbackQuotes));
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem },
        writable: true,
      });

      Object.defineProperty(navigator, 'onLine', { value: false });

      await render(QuoteOfTheDayComponent);

      // Should show first cached quote
      await waitFor(() => {
        expect(screen.getByText(fallbackQuotes[0].text)).toBeInTheDocument();
      });

      // Click new quote button
      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      fireEvent.click(newQuoteButton);

      // Should show next cached quote
      await waitFor(() => {
        expect(screen.getByText(fallbackQuotes[1].text)).toBeInTheDocument();
        expect(screen.queryByText(fallbackQuotes[0].text)).not.toBeInTheDocument();
      });
    });

    it('should handle empty cache gracefully', async () => {
      const mockGetItem = jest.fn().mockReturnValue(null);
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem },
        writable: true,
      });

      Object.defineProperty(navigator, 'onLine', { value: false });

      await render(QuoteOfTheDayComponent);

      // Should show hardcoded fallback quote
      await waitFor(() => {
        expect(screen.getByText(/the only way to do great work/i)).toBeInTheDocument();
        expect(screen.getByText(/steve jobs/i)).toBeInTheDocument();
      });

      // Should indicate limited functionality
      expect(screen.getByText(/limited quotes available offline/i)).toBeInTheDocument();
    });

    it('should maintain cache size limits', async () => {
      const largeCacheArray = Array.from({ length: 100 }, (_, i) => ({
        ...mockQuote,
        id: `cached-quote-${i}`,
        text: `Cached quote number ${i + 1}`,
      }));

      const mockGetItem = jest.fn().mockReturnValue(JSON.stringify(largeCacheArray));
      const mockSetItem = jest.fn();
      Object.defineProperty(window, 'localStorage', {
        value: { 
          ...window.localStorage, 
          getItem: mockGetItem,
          setItem: mockSetItem 
        },
        writable: true,
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

      // Should limit cache size (e.g., to 50 quotes)
      expect(mockSetItem).toHaveBeenCalledWith(
        'cached-quotes',
        expect.stringMatching(/"id":"cached-quote-(4[0-9]|[5-9][0-9]|cached-quote-\d+)"/g)
      );
    });
  });

  describe('Offline User Experience', () => {
    it('should disable network-dependent features when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      await render(QuoteOfTheDayComponent);

      await waitFor(() => {
        expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
      });

      // New quote button should indicate offline behavior
      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      expect(newQuoteButton).toHaveAttribute('title', 
        expect.stringMatching(/offline|cached/i)
      );

      // Share functionality should be limited
      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveTextContent(/sharing limited while offline/i);
    });

    it('should show offline-appropriate error messages', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      const mockGetItem = jest.fn().mockReturnValue(null);
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem },
        writable: true,
      });

      await render(QuoteOfTheDayComponent);

      // Should show offline-specific messaging
      expect(screen.getByText(/you are offline/i)).toBeInTheDocument();
      expect(screen.getByText(/no cached quotes available/i)).toBeInTheDocument();
      expect(screen.getByText(/connect to internet for more quotes/i)).toBeInTheDocument();
    });

    it('should provide offline copy functionality', async () => {
      const mockGetItem = jest.fn().mockReturnValue(JSON.stringify(fallbackQuotes));
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem },
        writable: true,
      });

      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText },
        onLine: false
      });

      await render(QuoteOfTheDayComponent);

      await waitFor(() => {
        expect(screen.getByText(fallbackQuotes[0].text)).toBeInTheDocument();
      });

      // Copy should still work offline
      const copyButton = screen.getByRole('button', { name: /copy quote/i });
      fireEvent.click(copyButton);

      expect(mockWriteText).toHaveBeenCalledWith(
        `"${fallbackQuotes[0].text}" - ${fallbackQuotes[0].author}`
      );

      await waitFor(() => {
        expect(screen.getByText(/copied to clipboard/i)).toBeInTheDocument();
      });
    });

    it('should queue actions for when online', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });

      await render(QuoteOfTheDayComponent);

      // Mock analytics tracking
      const mockTrack = jest.fn();
      (window as any).gtag = mockTrack;

      // Perform actions while offline
      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      fireEvent.click(newQuoteButton);

      // Should queue analytics events
      expect(mockTrack).toHaveBeenCalledWith('event', 'quote_request_offline', {
        timestamp: expect.any(Number)
      });

      // When coming back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      fireEvent(window, new Event('online'));

      // Should flush queued events
      expect(mockTrack).toHaveBeenCalledWith('event', 'queue_flush', {
        queued_events: expect.any(Number)
      });
    });
  });

  describe('Service Worker Integration', () => {
    it('should register service worker when available', async () => {
      const mockRegister = jest.fn().mockResolvedValue({
        scope: '/',
        active: { state: 'activated' }
      });

      Object.defineProperty(navigator, 'serviceWorker', {
        value: { register: mockRegister },
        writable: true,
      });

      await render(QuoteOfTheDayComponent);

      // Should attempt to register service worker
      expect(mockRegister).toHaveBeenCalledWith('/sw.js');
    });

    it('should handle service worker registration failure', async () => {
      const mockRegister = jest.fn().mockRejectedValue(new Error('SW registration failed'));

      Object.defineProperty(navigator, 'serviceWorker', {
        value: { register: mockRegister },
        writable: true,
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await render(QuoteOfTheDayComponent);

      // Should handle failure gracefully
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Service worker registration failed:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle service worker updates', async () => {
      const mockRegistration = {
        scope: '/',
        active: { state: 'activated' },
        waiting: { state: 'installed' },
        addEventListener: jest.fn(),
        update: jest.fn()
      };

      const mockRegister = jest.fn().mockResolvedValue(mockRegistration);

      Object.defineProperty(navigator, 'serviceWorker', {
        value: { register: mockRegister },
        writable: true,
      });

      await render(QuoteOfTheDayComponent);

      // Should listen for updates
      expect(mockRegistration.addEventListener).toHaveBeenCalledWith(
        'updatefound',
        expect.any(Function)
      );
    });
  });

  describe('Data Synchronization', () => {
    it('should sync cached data when coming back online', async () => {
      const mockGetItem = jest.fn().mockReturnValue(JSON.stringify(fallbackQuotes));
      const mockSetItem = jest.fn();
      Object.defineProperty(window, 'localStorage', {
        value: { 
          ...window.localStorage, 
          getItem: mockGetItem,
          setItem: mockSetItem 
        },
        writable: true,
      });

      // Start offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      await render(QuoteOfTheDayComponent);

      // Come back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      fireEvent(window, new Event('online'));

      // Should fetch fresh data
      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Should update cache with fresh data
      expect(mockSetItem).toHaveBeenCalledWith(
        'cached-quotes',
        expect.stringContaining(mockQuote.id)
      );
    });

    it('should handle sync conflicts gracefully', async () => {
      const oldQuote = { ...mockQuote, id: 'old-quote', text: 'Old cached quote' };
      const mockGetItem = jest.fn().mockReturnValue(JSON.stringify([oldQuote]));
      const mockSetItem = jest.fn();
      
      Object.defineProperty(window, 'localStorage', {
        value: { 
          ...window.localStorage, 
          getItem: mockGetItem,
          setItem: mockSetItem 
        },
        writable: true,
      });

      // Start offline
      Object.defineProperty(navigator, 'onLine', { value: false });

      await render(QuoteOfTheDayComponent);

      await waitFor(() => {
        expect(screen.getByText(oldQuote.text)).toBeInTheDocument();
      });

      // Come back online with newer data
      Object.defineProperty(navigator, 'onLine', { value: true });
      fireEvent(window, new Event('online'));

      const req = httpTestingController.expectOne(req => 
        req.url.includes('quotegarden.io') || 
        req.url.includes('quotable.io')
      );
      req.flush({ quote: mockQuote });

      await waitFor(() => {
        expect(screen.getByText(mockQuote.text)).toBeInTheDocument();
      });

      // Should merge cache appropriately
      expect(mockSetItem).toHaveBeenCalledWith(
        'cached-quotes',
        expect.stringContaining(mockQuote.id)
      );
    });

    it('should track offline usage for analytics', async () => {
      const mockTrack = jest.fn();
      (window as any).gtag = mockTrack;

      Object.defineProperty(navigator, 'onLine', { value: false });

      const mockGetItem = jest.fn().mockReturnValue(JSON.stringify(fallbackQuotes));
      Object.defineProperty(window, 'localStorage', {
        value: { ...window.localStorage, getItem: mockGetItem },
        writable: true,
      });

      await render(QuoteOfTheDayComponent);

      // Should track offline session
      expect(mockTrack).toHaveBeenCalledWith('event', 'offline_session_start', {
        cached_quotes_available: fallbackQuotes.length
      });

      // Use cached quote
      const newQuoteButton = screen.getByRole('button', { name: /new quote/i });
      fireEvent.click(newQuoteButton);

      expect(mockTrack).toHaveBeenCalledWith('event', 'offline_quote_view', {
        quote_source: 'cache',
        quote_id: expect.any(String)
      });
    });
  });

  describe('Progressive Web App Features', () => {
    it('should be installable as PWA', async () => {
      const mockPrompt = jest.fn();
      const beforeInstallPromptEvent = {
        preventDefault: jest.fn(),
        prompt: mockPrompt,
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      await render(QuoteOfTheDayComponent);

      // Simulate beforeinstallprompt event
      fireEvent(window, new CustomEvent('beforeinstallprompt', {
        detail: beforeInstallPromptEvent
      }));

      // Should show install prompt
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /install app/i })).toBeInTheDocument();
      });

      const installButton = screen.getByRole('button', { name: /install app/i });
      fireEvent.click(installButton);

      expect(mockPrompt).toHaveBeenCalled();
    });

    it('should handle app installation completion', async () => {
      const mockTrack = jest.fn();
      (window as any).gtag = mockTrack;

      await render(QuoteOfTheDayComponent);

      // Simulate app installation
      fireEvent(window, new Event('appinstalled'));

      expect(mockTrack).toHaveBeenCalledWith('event', 'pwa_installed', {
        installation_source: 'browser'
      });

      // Install button should be hidden
      expect(screen.queryByRole('button', { name: /install app/i })).not.toBeInTheDocument();
    });

    it('should work when launched as standalone PWA', async () => {
      // Mock standalone display mode
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockReturnValue({
          matches: true,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        })
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

      // Should show PWA-specific UI
      expect(screen.getByTestId('pwa-header')).toBeInTheDocument();
      expect(screen.queryByTestId('browser-header')).not.toBeInTheDocument();
    });
  });
});
