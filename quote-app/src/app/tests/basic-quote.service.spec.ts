/**
 * Basic QuoteService Tests
 * T039: Basic validation that QuoteService compiles and instantiates correctly
 * 
 * This test validates the basic implementation without external dependencies,
 * following the same pattern as other service basic tests.
 */

import { QuoteService } from '../services/quote.service';
import { CacheService } from '../services/cache.service';
import { ErrorHandler } from '../services/error-handler.service';

// Mock HttpClient
const mockHttpClient = {
  get: jest.fn()
};

// Mock dependencies
const mockCacheService = {
  cacheQuote: jest.fn().mockResolvedValue(undefined),
  getAllCachedQuotes: jest.fn().mockResolvedValue([])
};

const mockErrorHandler = {
  handleError: jest.fn(),
  logError: jest.fn()
};

describe('Basic QuoteService Tests', () => {
  let service: QuoteService;

  beforeEach(() => {
    // Mock the inject function for dependencies
    jest.doMock('@angular/core', () => ({
      Injectable: () => (target: any) => target,
      computed: (fn: Function) => fn,
      signal: (initial: any) => {
        let value = initial;
        const signalFn = () => value;
        signalFn.set = (newValue: any) => { value = newValue; };
        return signalFn;
      },
      inject: jest.fn((token: any) => {
        if (token.toString().includes('HttpClient')) return mockHttpClient;
        if (token === CacheService) return mockCacheService;
        if (token === ErrorHandler) return mockErrorHandler;
        return {};
      })
    }));

    // Create service instance
    service = new QuoteService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create QuoteService instance', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(QuoteService);
  });

  it('should have required public methods', () => {
    expect(typeof service.getState).toBe('function');
    expect(typeof service.fetchRandomQuote).toBe('function');
    expect(typeof service.getLocalFallbackQuote).toBe('function');
  });

  it('should have signal-based properties', () => {
    expect(typeof service.state).toBe('function');
    expect(typeof service.currentQuote).toBe('function');
    expect(typeof service.loading).toBe('function');
    expect(typeof service.error).toBe('function');
  });

  it('should initialize with correct default state', () => {
    const state = service.getState();
    
    expect(state.currentQuote).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.apiCallCount).toBe(0);
    expect(state.lastFetch).toBeNull();
    expect(Array.isArray(state.cache)).toBe(true);
  });

  it('should return local fallback quote', () => {
    const localQuote = service.getLocalFallbackQuote();
    
    expect(localQuote).toBeDefined();
    expect(localQuote).toHaveProperty('id');
    expect(localQuote).toHaveProperty('text');
    expect(localQuote).toHaveProperty('author');
    expect(localQuote?.source).toBe('local');
  });

  it('should have computed signals that work', () => {
    const currentQuote = service.currentQuote();
    const loading = service.loading();
    const error = service.error();
    
    // Initial state checks
    expect(currentQuote).toBeNull();
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });
});
