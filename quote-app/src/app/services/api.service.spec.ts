/**
 * T018: API Service Contract Tests
 * 
 * IMPORTANT: This test MUST fail initially as the API service doesn't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Tests the API service which handles communication with external quote APIs,
 * request formatting, and response parsing.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from '../services/api.service';
import { Quote } from '../models/quote.interface';
import { ApiResponse } from '../models/api-response.interface';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have configured API endpoints', () => {
      const endpoints = service.getEndpoints();
      expect(endpoints.quotegarden).toBeDefined();
      expect(endpoints.quotable).toBeDefined();
      expect(endpoints.quotegarden).toContain('quotegarden.herokuapp.com');
      expect(endpoints.quotable).toContain('quotable.io');
    });

    it('should have default configuration', () => {
      const config = service.getConfiguration();
      expect(config.timeout).toBeDefined();
      expect(config.retryAttempts).toBeDefined();
      expect(config.primaryApi).toBe('quotegarden');
      expect(config.fallbackApis).toContain('quotable');
    });
  });

  describe('QuoteGarden API Integration', () => {
    it('should fetch random quote from QuoteGarden', async () => {
      const mockQuoteGardenResponse = {
        statusCode: 200,
        message: 'Success',
        pagination: { totalPages: 1, currentPage: 1 },
        data: {
          _id: 'qg123',
          quoteText: 'Life is what happens to you while you are busy making other plans.',
          quoteAuthor: 'John Lennon',
          quoteGenre: 'life',
          __v: 0
        }
      };

      const promise = service.fetchRandomQuoteFromQuoteGarden();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com/api/v3/quotes/random')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockQuoteGardenResponse);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('qg123');
      expect(result.data?.text).toBe('Life is what happens to you while you are busy making other plans.');
      expect(result.data?.author).toBe('John Lennon');
      expect(result.data?.category).toBe('life');
      expect(result.data?.source).toBe('quotegarden');
    });

    it('should fetch quotes by category from QuoteGarden', async () => {
      const category = 'motivational';
      const mockResponse = {
        statusCode: 200,
        message: 'Success',
        pagination: { totalPages: 5, currentPage: 1 },
        data: [
          {
            _id: 'qg456',
            quoteText: 'The only way to do great work is to love what you do.',
            quoteAuthor: 'Steve Jobs',
            quoteGenre: 'motivational',
            __v: 0
          }
        ]
      };

      const promise = service.fetchQuotesByCategoryFromQuoteGarden(category);

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com/api/v3/quotes') &&
        request.url.includes(`genre=${category}`)
      );
      req.flush(mockResponse);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].category).toBe('motivational');
    });

    it('should fetch quotes by author from QuoteGarden', async () => {
      const author = 'Albert Einstein';
      const mockResponse = {
        statusCode: 200,
        message: 'Success',
        pagination: { totalPages: 2, currentPage: 1 },
        data: [
          {
            _id: 'qg789',
            quoteText: 'Imagination is more important than knowledge.',
            quoteAuthor: 'Albert Einstein',
            quoteGenre: 'wisdom',
            __v: 0
          }
        ]
      };

      const promise = service.fetchQuotesByAuthorFromQuoteGarden(author);

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com/api/v3/quotes') &&
        request.url.includes(`author=${encodeURIComponent(author)}`)
      );
      req.flush(mockResponse);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.data![0].author).toBe('Albert Einstein');
    });

    it('should handle QuoteGarden API errors gracefully', async () => {
      const promise = service.fetchRandomQuoteFromQuoteGarden();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req.flush(
        { message: 'Internal Server Error' },
        { status: 500, statusText: 'Server Error' }
      );

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('QuoteGarden API error');
    });

    it('should transform QuoteGarden response format to application format', async () => {
      const mockResponse = {
        statusCode: 200,
        data: {
          _id: 'qg999',
          quoteText: 'Test quote with special characters: "Hello" & <world>',
          quoteAuthor: 'Test Author',
          quoteGenre: 'test',
          __v: 0
        }
      };

      const promise = service.fetchRandomQuoteFromQuoteGarden();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req.flush(mockResponse);

      const result = await promise;
      const quote = result.data!;
      
      expect(quote.id).toBe('qg999');
      expect(quote.text).toBe('Test quote with special characters: "Hello" & <world>');
      expect(quote.author).toBe('Test Author');
      expect(quote.category).toBe('test');
      expect(quote.source).toBe('quotegarden');
      expect(quote.length).toBe(quote.text.length);
      expect(quote.dateAdded).toBeInstanceOf(Date);
      expect(quote.verified).toBe(true);
    });
  });

  describe('Quotable API Integration', () => {
    it('should fetch random quote from Quotable', async () => {
      const mockQuotableResponse = {
        _id: 'qt123',
        content: 'The journey of a thousand miles begins with one step.',
        author: 'Lao Tzu',
        tags: ['wisdom', 'journey'],
        authorSlug: 'lao-tzu',
        length: 49,
        dateAdded: '2023-01-01',
        dateModified: '2023-01-01'
      };

      const promise = service.fetchRandomQuoteFromQuotable();

      const req = httpMock.expectOne('https://quotable.io/random');
      expect(req.request.method).toBe('GET');
      req.flush(mockQuotableResponse);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('qt123');
      expect(result.data?.text).toBe('The journey of a thousand miles begins with one step.');
      expect(result.data?.author).toBe('Lao Tzu');
      expect(result.data?.tags).toEqual(['wisdom', 'journey']);
      expect(result.data?.source).toBe('quotable');
    });

    it('should fetch quotes by tags from Quotable', async () => {
      const tags = ['motivational', 'success'];
      const mockResponse = {
        count: 1,
        totalCount: 50,
        page: 1,
        totalPages: 5,
        lastItemIndex: 1,
        results: [
          {
            _id: 'qt456',
            content: 'Success is not final, failure is not fatal.',
            author: 'Winston Churchill',
            tags: ['motivational', 'success'],
            authorSlug: 'winston-churchill',
            length: 42,
            dateAdded: '2023-01-01',
            dateModified: '2023-01-01'
          }
        ]
      };

      const promise = service.fetchQuotesByTagsFromQuotable(tags);

      const req = httpMock.expectOne(request => 
        request.url.includes('quotable.io/quotes') &&
        request.url.includes(`tags=${tags.join('|')}`)
      );
      req.flush(mockResponse);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].tags).toEqual(['motivational', 'success']);
    });

    it('should search quotes by content from Quotable', async () => {
      const searchTerm = 'happiness';
      const mockResponse = {
        count: 1,
        totalCount: 25,
        page: 1,
        totalPages: 3,
        lastItemIndex: 1,
        results: [
          {
            _id: 'qt789',
            content: 'Happiness is not something ready made.',
            author: 'Dalai Lama',
            tags: ['happiness', 'wisdom'],
            authorSlug: 'dalai-lama',
            length: 38,
            dateAdded: '2023-01-01',
            dateModified: '2023-01-01'
          }
        ]
      };

      const promise = service.searchQuotesFromQuotable(searchTerm);

      const req = httpMock.expectOne(request => 
        request.url.includes('quotable.io/search/quotes') &&
        request.url.includes(`query=${searchTerm}`)
      );
      req.flush(mockResponse);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.data![0].text).toContain('Happiness');
    });

    it('should handle Quotable API errors gracefully', async () => {
      const promise = service.fetchRandomQuoteFromQuotable();

      const req = httpMock.expectOne('https://quotable.io/random');
      req.flush(
        { message: 'Too Many Requests' },
        { status: 429, statusText: 'Too Many Requests' }
      );

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Quotable API error');
    });

    it('should transform Quotable response format to application format', async () => {
      const mockResponse = {
        _id: 'qt999',
        content: 'Test content',
        author: 'Test Author',
        tags: ['test', 'content'],
        authorSlug: 'test-author',
        length: 12,
        dateAdded: '2024-01-01T00:00:00.000Z',
        dateModified: '2024-01-01T00:00:00.000Z'
      };

      const promise = service.fetchRandomQuoteFromQuotable();

      const req = httpMock.expectOne('https://quotable.io/random');
      req.flush(mockResponse);

      const result = await promise;
      const quote = result.data!;
      
      expect(quote.id).toBe('qt999');
      expect(quote.text).toBe('Test content');
      expect(quote.author).toBe('Test Author');
      expect(quote.tags).toEqual(['test', 'content']);
      expect(quote.source).toBe('quotable');
      expect(quote.length).toBe(12);
      expect(quote.dateAdded).toBeInstanceOf(Date);
      expect(quote.verified).toBe(true);
      expect(quote.popularity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('API Strategy and Fallback', () => {
    it('should try primary API first', async () => {
      const mockResponse = { statusCode: 200, data: { _id: 'test', quoteText: 'Test', quoteAuthor: 'Author', quoteGenre: 'test' } };

      const promise = service.fetchRandomQuote();

      // Should try QuoteGarden first
      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req.flush(mockResponse);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.source).toBe('quotegarden');
    });

    it('should fallback to secondary API when primary fails', async () => {
      const quotableResponse = {
        _id: 'fallback',
        content: 'Fallback quote',
        author: 'Fallback Author',
        tags: ['fallback'],
        length: 14
      };

      const promise = service.fetchRandomQuote();

      // Primary API (QuoteGarden) fails
      const primaryReq = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      primaryReq.flush(null, { status: 500, statusText: 'Server Error' });

      // Should fallback to Quotable
      const fallbackReq = httpMock.expectOne('https://quotable.io/random');
      fallbackReq.flush(quotableResponse);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.source).toBe('quotable');
      expect(result.data?.text).toBe('Fallback quote');
    });

    it('should try all configured APIs before giving up', async () => {
      const promise = service.fetchRandomQuote();

      // QuoteGarden fails
      const qgReq = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      qgReq.flush(null, { status: 500, statusText: 'Server Error' });

      // Quotable fails
      const qtReq = httpMock.expectOne('https://quotable.io/random');
      qtReq.flush(null, { status: 500, statusText: 'Server Error' });

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toContain('All APIs failed');
    });

    it('should respect API priority order', () => {
      const priority = service.getApiPriority();
      expect(priority[0]).toBe('quotegarden');
      expect(priority[1]).toBe('quotable');
    });

    it('should allow dynamic API priority changes', () => {
      service.setApiPriority(['quotable', 'quotegarden']);
      const newPriority = service.getApiPriority();
      
      expect(newPriority[0]).toBe('quotable');
      expect(newPriority[1]).toBe('quotegarden');
    });
  });

  describe('Request Configuration', () => {
    it('should include proper headers in requests', async () => {
      const promise = service.fetchRandomQuoteFromQuoteGarden();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );

      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('User-Agent')).toContain('QuoteApp');

      req.flush({ statusCode: 200, data: { _id: 'test', quoteText: 'Test', quoteAuthor: 'Author', quoteGenre: 'test' } });
    });

    it('should respect timeout configuration', async () => {
      service.setTimeout(5000);
      
      const promise = service.fetchRandomQuoteFromQuoteGarden();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );

      // Verify request includes timeout context
      expect(req.request.context).toBeDefined();
      
      req.flush({ statusCode: 200, data: { _id: 'test', quoteText: 'Test', quoteAuthor: 'Author', quoteGenre: 'test' } });
    });

    it('should handle rate limiting appropriately', async () => {
      const promise = service.fetchRandomQuoteFromQuotable();

      const req = httpMock.expectOne('https://quotable.io/random');
      req.flush(
        { message: 'Too Many Requests' },
        { status: 429, statusText: 'Too Many Requests' }
      );

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
    });

    it('should add request correlation ID for tracking', async () => {
      const promise = service.fetchRandomQuoteFromQuoteGarden();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );

      expect(req.request.headers.get('X-Correlation-ID')).toBeDefined();
      expect(req.request.headers.get('X-Correlation-ID')).toMatch(/^[a-f0-9-]{36}$/); // UUID format

      req.flush({ statusCode: 200, data: { _id: 'test', quoteText: 'Test', quoteAuthor: 'Author', quoteGenre: 'test' } });
    });
  });

  describe('Response Validation', () => {
    it('should validate API response structure', async () => {
      const invalidResponse = {
        statusCode: 200,
        data: {
          // Missing required fields
          _id: 'test'
          // No quoteText, quoteAuthor
        }
      };

      const promise = service.fetchRandomQuoteFromQuoteGarden();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req.flush(invalidResponse);

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    it('should sanitize response data', async () => {
      const maliciousResponse = {
        statusCode: 200,
        data: {
          _id: 'test',
          quoteText: 'Test quote <script>alert("xss")</script>',
          quoteAuthor: 'Author <img src=x onerror=alert(1)>',
          quoteGenre: 'test'
        }
      };

      const promise = service.fetchRandomQuoteFromQuoteGarden();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req.flush(maliciousResponse);

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.data?.text).not.toContain('<script>');
      expect(result.data?.author).not.toContain('<img');
    });

    it('should handle malformed JSON responses', async () => {
      const promise = service.fetchRandomQuoteFromQuotable();

      const req = httpMock.expectOne('https://quotable.io/random');
      req.flush('invalid json{', { status: 200, statusText: 'OK' });

      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toContain('parsing');
    });

    it('should validate quote length limits', async () => {
      const longQuoteResponse = {
        statusCode: 200,
        data: {
          _id: 'long',
          quoteText: 'A'.repeat(1000), // Very long quote
          quoteAuthor: 'Long Author',
          quoteGenre: 'test'
        }
      };

      const promise = service.fetchRandomQuoteFromQuoteGarden();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req.flush(longQuoteResponse);

      const result = await promise;
      
      if (result.success) {
        expect(result.data?.text.length).toBeLessThanOrEqual(500); // Assume 500 char limit
      } else {
        expect(result.error).toContain('length');
      }
    });
  });

  describe('Caching Integration', () => {
    it('should cache successful API responses', async () => {
      const mockResponse = {
        statusCode: 200,
        data: {
          _id: 'cached',
          quoteText: 'Cached quote',
          quoteAuthor: 'Cache Author',
          quoteGenre: 'test'
        }
      };

      const promise = service.fetchRandomQuoteFromQuoteGarden();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req.flush(mockResponse);

      const result = await promise;
      expect(result.success).toBe(true);

      // Verify quote was cached
      const cachedQuote = await service.getCachedQuote('cached');
      expect(cachedQuote).toBeDefined();
      expect(cachedQuote?.text).toBe('Cached quote');
    });

    it('should not cache failed API responses', async () => {
      const promise = service.fetchRandomQuoteFromQuoteGarden();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req.flush(null, { status: 500, statusText: 'Server Error' });

      const result = await promise;
      expect(result.success).toBe(false);

      // Verify no cache entry was created
      const cacheStats = await service.getCacheStats();
      expect(cacheStats.totalQuotes).toBe(0);
    });

    it('should return cached quotes when API is unavailable', async () => {
      // First, cache a quote
      const cacheQuote: Quote = {
        id: 'offline-1',
        text: 'Offline quote',
        author: 'Offline Author',
        source: 'quotegarden',
        category: 'test',
        tags: [],
        length: 13,
        dateAdded: new Date(),
        popularity: 0,
        verified: true
      };

      await service.cacheQuote(cacheQuote);

      // Now try to fetch when API is down
      const promise = service.fetchRandomQuoteWithFallback();

      const req = httpMock.expectOne(request => 
        request.url.includes('quotegarden.herokuapp.com')
      );
      req.flush(null, { status: 500, statusText: 'Server Error' });

      const quotableReq = httpMock.expectOne('https://quotable.io/random');
      quotableReq.flush(null, { status: 500, statusText: 'Server Error' });

      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.data?.text).toBe('Offline quote');
      expect(result.source).toBe('cache');
    });
  });
});
