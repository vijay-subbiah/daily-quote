/**
 * T014: QuoteService Contract Tests
 * 
 * IMPORTANT: This test MUST fail initially as the QuoteService doesn't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Tests the QuoteService which handles quote fetching from multiple APIs,
 * caching, and state management using Angular signals.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';

import { QuoteService } from '../services/quote.service';
import { Quote } from '../models/quote.interface';
import { ApiResponse } from '../models/api-response.interface';
import { AppState } from '../models/app-state.interface';

describe('QuoteService', () => {
  let service: QuoteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QuoteService]
    });
    service = TestBed.inject(QuoteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty state', () => {
      const initialState = service.getState();
      expect(initialState.currentQuote).toBeNull();
      expect(initialState.loading).toBe(false);
      expect(initialState.error).toBeNull();
      expect(initialState.cache).toHaveLength(0);
      expect(initialState.lastFetch).toBeNull();
      expect(initialState.apiCallCount).toBe(0);
    });

    it('should expose state as readonly signal', () => {
      const stateSignal = service.state;
      expect(stateSignal).toBeDefined();
      expect(typeof stateSignal).toBe('function'); // Signals are functions
    });

    it('should expose current quote as computed signal', () => {
      const currentQuote = service.currentQuote;
      expect(currentQuote).toBeDefined();
      expect(typeof currentQuote).toBe('function'); // Computed signals are functions
    });

    it('should expose loading state as computed signal', () => {
      const loading = service.loading;
      expect(loading).toBeDefined();
      expect(typeof loading).toBe('function');
    });

    it('should expose error state as computed signal', () => {
      const error = service.error;
      expect(error).toBeDefined();
      expect(typeof error).toBe('function');
    });
  });

  describe('Quote Fetching', () => {
    it('should fetch quote from primary API (QuoteGarden)', async () => {
      const mockQuote: Quote = {
        id: 'q1',
        text: 'Life is what happens to you while you are busy making other plans.',
        author: 'John Lennon',
        source: 'quotegarden',
        category: 'life',
        tags: ['life', 'planning'],
        length: 65,
        dateAdded: new Date(),
        popularity: 85,
        verified: true
      };

      const mockResponse: ApiResponse<Quote> = {
        success: true,
        data: mockQuote,
        source: 'quotegarden',
        timestamp: new Date()
      };

      const fetchPromise = service.fetchRandomQuote();

      // Check that loading state is true
      expect(service.loading()).toBe(true);

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com/api/v3/quotes/random')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const result = await fetchPromise;
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQuote);
      expect(service.loading()).toBe(false);
      expect(service.currentQuote()).toEqual(mockQuote);
    });

    it('should fallback to secondary API (Quotable) on primary failure', async () => {
      const mockQuote: Quote = {
        id: 'q2',
        text: 'The only way to do great work is to love what you do.',
        author: 'Steve Jobs',
        source: 'quotable',
        category: 'work',
        tags: ['work', 'passion'],
        length: 49,
        dateAdded: new Date(),
        popularity: 90,
        verified: true
      };

      const mockResponse: ApiResponse<Quote> = {
        success: true,
        data: mockQuote,
        source: 'quotable',
        timestamp: new Date()
      };

      const fetchPromise = service.fetchRandomQuote();

      // Primary API fails
      const primaryReq = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      primaryReq.flush(null, { status: 500, statusText: 'Server Error' });

      // Secondary API succeeds
      const secondaryReq = httpMock.expectOne(request => 
        request.url.includes('quotable.io/random')
      );
      secondaryReq.flush(mockResponse);

      const result = await fetchPromise;
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockQuote);
      expect(service.currentQuote()).toEqual(mockQuote);
    });

    it('should fallback to local quotes when all APIs fail', async () => {
      const fetchPromise = service.fetchRandomQuote();

      // Primary API fails
      const primaryReq = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      primaryReq.flush(null, { status: 500, statusText: 'Server Error' });

      // Secondary API fails
      const secondaryReq = httpMock.expectOne(request => 
        request.url.includes('quotable.io')
      );
      secondaryReq.flush(null, { status: 500, statusText: 'Server Error' });

      const result = await fetchPromise;
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.source).toBe('local');
      expect(service.currentQuote()).toBeDefined();
      expect(service.error()).toBeNull();
    });

    it('should handle complete failure gracefully', async () => {
      // Mock the local fallback to also fail
      jest.spyOn(service, 'getLocalFallbackQuote').mockReturnValue(null);

      const fetchPromise = service.fetchRandomQuote();

      // Primary API fails
      const primaryReq = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      primaryReq.flush(null, { status: 500, statusText: 'Server Error' });

      // Secondary API fails
      const secondaryReq = httpMock.expectOne(request => 
        request.url.includes('quotable.io')
      );
      secondaryReq.flush(null, { status: 500, statusText: 'Server Error' });

      const result = await fetchPromise;
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(service.error()).toBeDefined();
      expect(service.loading()).toBe(false);
    });

    it('should increment API call count on each request', async () => {
      const initialCount = service.getState().apiCallCount;

      const mockResponse: ApiResponse<Quote> = {
        success: true,
        data: {
          id: 'q1',
          text: 'Test quote',
          author: 'Test Author',
          source: 'quotegarden',
          category: 'test',
          tags: [],
          length: 10,
          dateAdded: new Date(),
          popularity: 0,
          verified: false
        },
        source: 'quotegarden',
        timestamp: new Date()
      };

      service.fetchRandomQuote();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req.flush(mockResponse);

      expect(service.getState().apiCallCount).toBe(initialCount + 1);
    });
  });

  describe('Quote Caching', () => {
    it('should cache fetched quotes', async () => {
      const mockQuote: Quote = {
        id: 'q1',
        text: 'Cached quote',
        author: 'Cache Author',
        source: 'quotegarden',
        category: 'test',
        tags: [],
        length: 12,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      const mockResponse: ApiResponse<Quote> = {
        success: true,
        data: mockQuote,
        source: 'quotegarden',
        timestamp: new Date()
      };

      const initialCacheSize = service.getState().cache.length;

      service.fetchRandomQuote();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req.flush(mockResponse);

      expect(service.getState().cache.length).toBe(initialCacheSize + 1);
      expect(service.getState().cache[0].quote).toEqual(mockQuote);
    });

    it('should not cache duplicate quotes', async () => {
      const mockQuote: Quote = {
        id: 'duplicate-q',
        text: 'Duplicate quote',
        author: 'Duplicate Author',
        source: 'quotegarden',
        category: 'test',
        tags: [],
        length: 15,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      const mockResponse: ApiResponse<Quote> = {
        success: true,
        data: mockQuote,
        source: 'quotegarden',
        timestamp: new Date()
      };

      // First fetch
      service.fetchRandomQuote();
      const req1 = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req1.flush(mockResponse);

      const cacheAfterFirst = service.getState().cache.length;

      // Second fetch with same quote
      service.fetchRandomQuote();
      const req2 = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req2.flush(mockResponse);

      expect(service.getState().cache.length).toBe(cacheAfterFirst);
    });

    it('should limit cache size to maximum allowed entries', async () => {
      const maxCacheSize = 50; // Assuming this is the limit
      
      // Fill cache beyond limit
      for (let i = 0; i < maxCacheSize + 5; i++) {
        const mockQuote: Quote = {
          id: `cache-q-${i}`,
          text: `Cache quote ${i}`,
          author: `Author ${i}`,
          source: 'quotegarden',
          category: 'test',
          tags: [],
          length: 10,
          dateAdded: new Date(),
          popularity: 0,
          verified: false
        };

        const mockResponse: ApiResponse<Quote> = {
          success: true,
          data: mockQuote,
          source: 'quotegarden',
          timestamp: new Date()
        };

        service.fetchRandomQuote();
        const req = httpMock.expectOne(request => 
          request.url.includes('quotegarden.herokuapp.com')
        );
        req.flush(mockResponse);
      }

      expect(service.getState().cache.length).toBeLessThanOrEqual(maxCacheSize);
    });

    it('should provide method to get cached quotes', () => {
      const cachedQuotes = service.getCachedQuotes();
      expect(Array.isArray(cachedQuotes)).toBe(true);
    });

    it('should provide method to clear cache', () => {
      service.clearCache();
      expect(service.getState().cache).toHaveLength(0);
    });
  });

  describe('Quote Categories', () => {
    it('should fetch quote by category', async () => {
      const category = 'motivational';
      const mockQuote: Quote = {
        id: 'cat-q1',
        text: 'Motivational quote',
        author: 'Motivator',
        source: 'quotegarden',
        category: 'motivational',
        tags: ['motivation'],
        length: 18,
        dateAdded: new Date(),
        popularity: 80,
        verified: true
      };

      const mockResponse: ApiResponse<Quote> = {
        success: true,
        data: mockQuote,
        source: 'quotegarden',
        timestamp: new Date()
      };

      service.fetchQuoteByCategory(category);

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com') && 
        request.url.includes(`category=${category}`)
      );
      req.flush(mockResponse);

      expect(service.currentQuote()).toEqual(mockQuote);
    });

    it('should provide list of available categories', () => {
      const categories = service.getAvailableCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('motivational');
      expect(categories).toContain('life');
      expect(categories).toContain('success');
    });
  });

  describe('Favorite Quotes', () => {
    it('should add quote to favorites', () => {
      const quote: Quote = {
        id: 'fav-q1',
        text: 'Favorite quote',
        author: 'Favorite Author',
        source: 'quotegarden',
        category: 'test',
        tags: [],
        length: 14,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      service.addToFavorites(quote);
      const favorites = service.getFavorites();
      expect(favorites).toContain(quote);
    });

    it('should remove quote from favorites', () => {
      const quote: Quote = {
        id: 'fav-q2',
        text: 'Another favorite',
        author: 'Another Author',
        source: 'quotegarden',
        category: 'test',
        tags: [],
        length: 16,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      service.addToFavorites(quote);
      expect(service.getFavorites()).toContain(quote);

      service.removeFromFavorites(quote.id);
      expect(service.getFavorites()).not.toContain(quote);
    });

    it('should check if quote is favorited', () => {
      const quote: Quote = {
        id: 'fav-q3',
        text: 'Check favorite',
        author: 'Check Author',
        source: 'quotegarden',
        category: 'test',
        tags: [],
        length: 14,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      expect(service.isFavorite(quote.id)).toBe(false);
      
      service.addToFavorites(quote);
      expect(service.isFavorite(quote.id)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should clear error state when new quote is fetched successfully', async () => {
      // First, cause an error
      service.fetchRandomQuote();
      const failedReq = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      failedReq.flush(null, { status: 500, statusText: 'Server Error' });

      const secondaryReq = httpMock.expectOne(request => 
        request.url.includes('quotable.io')
      );
      secondaryReq.flush(null, { status: 500, statusText: 'Server Error' });

      // Now fetch successfully
      const mockResponse: ApiResponse<Quote> = {
        success: true,
        data: {
          id: 'success-q',
          text: 'Success quote',
          author: 'Success Author',
          source: 'quotegarden',
          category: 'test',
          tags: [],
          length: 13,
          dateAdded: new Date(),
          popularity: 0,
          verified: false
        },
        source: 'quotegarden',
        timestamp: new Date()
      };

      service.fetchRandomQuote();
      const successReq = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      successReq.flush(mockResponse);

      expect(service.error()).toBeNull();
    });

    it('should provide method to manually clear error', () => {
      service.clearError();
      expect(service.error()).toBeNull();
    });
  });

  describe('State Management', () => {
    it('should update lastFetch timestamp on successful quote fetch', async () => {
      const beforeFetch = new Date();

      const mockResponse: ApiResponse<Quote> = {
        success: true,
        data: {
          id: 'time-q',
          text: 'Time quote',
          author: 'Time Author',
          source: 'quotegarden',
          category: 'test',
          tags: [],
          length: 10,
          dateAdded: new Date(),
          popularity: 0,
          verified: false
        },
        source: 'quotegarden',
        timestamp: new Date()
      };

      service.fetchRandomQuote();
      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req.flush(mockResponse);

      const afterFetch = new Date();
      const lastFetch = service.getState().lastFetch;

      expect(lastFetch).toBeDefined();
      expect(lastFetch!.getTime()).toBeGreaterThanOrEqual(beforeFetch.getTime());
      expect(lastFetch!.getTime()).toBeLessThanOrEqual(afterFetch.getTime());
    });

    it('should provide method to reset state', () => {
      service.resetState();
      const state = service.getState();
      
      expect(state.currentQuote).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.cache).toHaveLength(0);
      expect(state.lastFetch).toBeNull();
      expect(state.apiCallCount).toBe(0);
    });
  });
});
