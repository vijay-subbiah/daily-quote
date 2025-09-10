import { AppState } from './app-state.interface';
import { Quote } from './quote.interface';
import { CacheEntry } from './cache-entry.interface';

describe('AppState Interface Contract', () => {
  const mockQuote: Quote = {
    id: 'state-test',
    text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
    author: 'Chinese Proverb',
    source: 'local',
    length: 77
  };

  const mockCacheEntry: CacheEntry = {
    quote: mockQuote,
    timestamp: Date.now(),
    accessCount: 1,
    lastAccessed: Date.now(),
    expiresAt: Date.now() + 86400000
  };

  describe('AppState structure validation', () => {
    it('should have all required properties with correct types', () => {
      // This test MUST FAIL initially as AppState interface doesn't exist yet
      const initialState: AppState = {
        currentQuote: null,
        isLoading: false,
        error: null,
        cache: [],
        apiCallCount: 0,
        lastApiCall: 0
      };

      expect(initialState.currentQuote).toBeNull();
      expect(typeof initialState.isLoading).toBe('boolean');
      expect(initialState.error).toBeNull();
      expect(Array.isArray(initialState.cache)).toBe(true);
      expect(typeof initialState.apiCallCount).toBe('number');
      expect(typeof initialState.lastApiCall).toBe('number');
    });

    it('should support currentQuote being a Quote object', () => {
      const stateWithQuote: AppState = {
        currentQuote: mockQuote,
        isLoading: false,
        error: null,
        cache: [mockCacheEntry],
        apiCallCount: 1,
        lastApiCall: Date.now()
      };

      expect(stateWithQuote.currentQuote).toEqual(mockQuote);
      expect(stateWithQuote.cache).toContain(mockCacheEntry);
    });

    it('should support error being a string message', () => {
      const errorState: AppState = {
        currentQuote: null,
        isLoading: false,
        error: 'Failed to fetch quote from API',
        cache: [],
        apiCallCount: 2,
        lastApiCall: Date.now() - 5000
      };

      expect(errorState.error).toBe('Failed to fetch quote from API');
      expect(typeof errorState.error).toBe('string');
    });
  });

  describe('AppState loading states', () => {
    it('should represent loading state correctly', () => {
      const loadingState: AppState = {
        currentQuote: null,
        isLoading: true,
        error: null,
        cache: [],
        apiCallCount: 1,
        lastApiCall: Date.now()
      };

      expect(loadingState.isLoading).toBe(true);
      expect(loadingState.currentQuote).toBeNull();
      expect(loadingState.error).toBeNull();
    });

    it('should represent success state correctly', () => {
      const successState: AppState = {
        currentQuote: mockQuote,
        isLoading: false,
        error: null,
        cache: [mockCacheEntry],
        apiCallCount: 1,
        lastApiCall: Date.now() - 1000
      };

      expect(successState.isLoading).toBe(false);
      expect(successState.currentQuote).not.toBeNull();
      expect(successState.error).toBeNull();
    });

    it('should represent error state correctly', () => {
      const errorState: AppState = {
        currentQuote: null,
        isLoading: false,
        error: 'Network connection failed',
        cache: [],
        apiCallCount: 3,
        lastApiCall: Date.now() - 2000
      };

      expect(errorState.isLoading).toBe(false);
      expect(errorState.currentQuote).toBeNull();
      expect(errorState.error).toBeTruthy();
    });
  });

  describe('AppState cache management', () => {
    it('should support multiple cache entries', () => {
      const multipleQuotes: Quote[] = [
        mockQuote,
        {
          id: 'quote-2',
          text: 'Be the change you wish to see in the world.',
          author: 'Mahatma Gandhi',
          source: 'quotable',
          length: 43
        }
      ];

      const cacheEntries: CacheEntry[] = multipleQuotes.map(quote => ({
        quote,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
        expiresAt: Date.now() + 86400000
      }));

      const stateWithCache: AppState = {
        currentQuote: multipleQuotes[0],
        isLoading: false,
        error: null,
        cache: cacheEntries,
        apiCallCount: 2,
        lastApiCall: Date.now()
      };

      expect(stateWithCache.cache.length).toBe(2);
      expect(stateWithCache.cache[0].quote).toEqual(multipleQuotes[0]);
      expect(stateWithCache.cache[1].quote).toEqual(multipleQuotes[1]);
    });

    it('should track API call count correctly', () => {
      const state: AppState = {
        currentQuote: mockQuote,
        isLoading: false,
        error: null,
        cache: [mockCacheEntry],
        apiCallCount: 5,
        lastApiCall: Date.now() - 300000 // 5 minutes ago
      };

      expect(state.apiCallCount).toBeGreaterThanOrEqual(0);
      expect(state.apiCallCount).toBeLessThanOrEqual(100); // Rate limit
      expect(state.lastApiCall).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('AppState transitions', () => {
    it('should support transitioning from idle to loading', () => {
      const idleState: AppState = {
        currentQuote: null,
        isLoading: false,
        error: null,
        cache: [],
        apiCallCount: 0,
        lastApiCall: 0
      };

      const loadingState: AppState = {
        ...idleState,
        isLoading: true,
        apiCallCount: 1,
        lastApiCall: Date.now()
      };

      expect(idleState.isLoading).toBe(false);
      expect(loadingState.isLoading).toBe(true);
      expect(loadingState.apiCallCount).toBeGreaterThan(idleState.apiCallCount);
    });

    it('should support transitioning from loading to success', () => {
      const loadingState: AppState = {
        currentQuote: null,
        isLoading: true,
        error: null,
        cache: [],
        apiCallCount: 1,
        lastApiCall: Date.now()
      };

      const successState: AppState = {
        ...loadingState,
        currentQuote: mockQuote,
        isLoading: false,
        cache: [mockCacheEntry]
      };

      expect(loadingState.currentQuote).toBeNull();
      expect(successState.currentQuote).toEqual(mockQuote);
      expect(successState.isLoading).toBe(false);
    });
  });
});
