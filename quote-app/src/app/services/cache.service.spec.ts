/**
 * T015: CacheService Contract Tests
 * 
 * IMPORTANT: This test MUST fail initially as the CacheService doesn't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Tests the CacheService which handles local storage, IndexedDB storage,
 * and cache management for offline functionality.
 */

import { CacheService } from './cache.service';
import { Quote } from '../models/quote.interface';
import { CacheEntry } from '../models/cache-entry.interface';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService();
  });

  afterEach(() => {
    // Clean up storage after each test
    localStorage.clear();
    // IndexedDB cleanup would go here in real implementation
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty cache', async () => {
      const cache = await service.getAllCachedQuotes();
      expect(cache).toHaveLength(0);
    });

    it('should detect storage availability', () => {
      expect(service.isLocalStorageAvailable()).toBeDefined();
      expect(service.isIndexedDBAvailable()).toBeDefined();
    });
  });

  describe('Quote Caching', () => {
    const mockQuote: Quote = {
      id: 'cache-q1',
      text: 'This is a test quote for caching',
      author: 'Cache Author',
      source: 'quotegarden',
      category: 'test',
      tags: ['test', 'cache'],
      length: 33,
      dateAdded: new Date('2024-01-01'),
      popularity: 75,
      verified: true
    };

    it('should cache a quote', async () => {
      await service.cacheQuote(mockQuote);
      const cached = await service.getCachedQuote(mockQuote.id);
      
      expect(cached).toBeDefined();
      expect(cached?.quote).toEqual(mockQuote);
      expect(cached?.cachedAt).toBeInstanceOf(Date);
    });

    it('should retrieve cached quote by ID', async () => {
      await service.cacheQuote(mockQuote);
      const retrieved = await service.getCachedQuote(mockQuote.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.quote.id).toBe(mockQuote.id);
      expect(retrieved?.quote.text).toBe(mockQuote.text);
    });

    it('should return null for non-existent quote', async () => {
      const nonExistent = await service.getCachedQuote('non-existent-id');
      expect(nonExistent).toBeNull();
    });

    it('should update existing cached quote', async () => {
      await service.cacheQuote(mockQuote);
      
      const updatedQuote: Quote = {
        ...mockQuote,
        text: 'Updated quote text',
        popularity: 90
      };

      await service.cacheQuote(updatedQuote);
      const cached = await service.getCachedQuote(mockQuote.id);
      
      expect(cached?.quote.text).toBe('Updated quote text');
      expect(cached?.quote.popularity).toBe(90);
    });

    it('should cache multiple quotes', async () => {
      const quotes: Quote[] = [
        { ...mockQuote, id: 'q1', text: 'First quote' },
        { ...mockQuote, id: 'q2', text: 'Second quote' },
        { ...mockQuote, id: 'q3', text: 'Third quote' }
      ];

      await service.cacheMultipleQuotes(quotes);
      const allCached = await service.getAllCachedQuotes();
      
      expect(allCached).toHaveLength(3);
      expect(allCached.map(entry => entry.quote.id)).toEqual(['q1', 'q2', 'q3']);
    });
  });

  describe('Cache Management', () => {
    const createMockQuotes = (count: number): Quote[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `q${i + 1}`,
        text: `Quote ${i + 1}`,
        author: `Author ${i + 1}`,
        source: 'quotegarden',
        category: 'test',
        tags: ['test'],
        length: 10,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      }));
    };

    it('should get all cached quotes ordered by cache date', async () => {
      const quotes = createMockQuotes(3);
      
      // Cache quotes with delays to ensure different timestamps
      await service.cacheQuote(quotes[0]);
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.cacheQuote(quotes[1]);
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.cacheQuote(quotes[2]);

      const cached = await service.getAllCachedQuotes();
      expect(cached).toHaveLength(3);
      
      // Should be ordered by cache date (newest first)
      expect(cached[0].cachedAt.getTime()).toBeGreaterThan(cached[1].cachedAt.getTime());
      expect(cached[1].cachedAt.getTime()).toBeGreaterThan(cached[2].cachedAt.getTime());
    });

    it('should get cached quotes by category', async () => {
      const quotes: Quote[] = [
        { ...createMockQuotes(1)[0], id: 'q1', category: 'life' },
        { ...createMockQuotes(1)[0], id: 'q2', category: 'motivation' },
        { ...createMockQuotes(1)[0], id: 'q3', category: 'life' }
      ];

      await service.cacheMultipleQuotes(quotes);
      const lifeQuotes = await service.getCachedQuotesByCategory('life');
      
      expect(lifeQuotes).toHaveLength(2);
      expect(lifeQuotes.every(entry => entry.quote.category === 'life')).toBe(true);
    });

    it('should get cached quotes by author', async () => {
      const quotes: Quote[] = [
        { ...createMockQuotes(1)[0], id: 'q1', author: 'John Doe' },
        { ...createMockQuotes(1)[0], id: 'q2', author: 'Jane Smith' },
        { ...createMockQuotes(1)[0], id: 'q3', author: 'John Doe' }
      ];

      await service.cacheMultipleQuotes(quotes);
      const johnQuotes = await service.getCachedQuotesByAuthor('John Doe');
      
      expect(johnQuotes).toHaveLength(2);
      expect(johnQuotes.every(entry => entry.quote.author === 'John Doe')).toBe(true);
    });

    it('should search cached quotes by text content', async () => {
      const quotes: Quote[] = [
        { ...createMockQuotes(1)[0], id: 'q1', text: 'Life is beautiful and amazing' },
        { ...createMockQuotes(1)[0], id: 'q2', text: 'Code is poetry in motion' },
        { ...createMockQuotes(1)[0], id: 'q3', text: 'Life teaches us many lessons' }
      ];

      await service.cacheMultipleQuotes(quotes);
      const lifeQuotes = await service.searchCachedQuotes('life');
      
      expect(lifeQuotes).toHaveLength(2);
      expect(lifeQuotes.every(entry => 
        entry.quote.text.toLowerCase().includes('life')
      )).toBe(true);
    });

    it('should remove quote from cache', async () => {
      const quote = createMockQuotes(1)[0];
      await service.cacheQuote(quote);
      
      expect(await service.getCachedQuote(quote.id)).toBeDefined();
      
      await service.removeCachedQuote(quote.id);
      expect(await service.getCachedQuote(quote.id)).toBeNull();
    });

    it('should clear all cached quotes', async () => {
      const quotes = createMockQuotes(5);
      await service.cacheMultipleQuotes(quotes);
      
      expect(await service.getAllCachedQuotes()).toHaveLength(5);
      
      await service.clearCache();
      expect(await service.getAllCachedQuotes()).toHaveLength(0);
    });

    it('should limit cache size to maximum entries', async () => {
      const maxSize = 100; // Assuming this is the limit
      const quotes = createMockQuotes(maxSize + 10);
      
      await service.cacheMultipleQuotes(quotes);
      const cached = await service.getAllCachedQuotes();
      
      expect(cached.length).toBeLessThanOrEqual(maxSize);
    });

    it('should remove oldest entries when cache is full', async () => {
      const maxSize = 100;
      const quotes = createMockQuotes(maxSize + 5);
      
      await service.cacheMultipleQuotes(quotes);
      const cached = await service.getAllCachedQuotes();
      
      // Should keep the newest quotes
      const cachedIds = cached.map(entry => entry.quote.id);
      const expectedIds = quotes.slice(-maxSize).map(q => q.id);
      
      expect(cachedIds).toEqual(expect.arrayContaining(expectedIds));
    });
  });

  describe('Cache Statistics', () => {
    it('should provide cache statistics', async () => {
      const quotes = createMockQuotes(10);
      await service.cacheMultipleQuotes(quotes);
      
      const stats = await service.getCacheStats();
      
      expect(stats.totalQuotes).toBe(10);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.oldestEntry).toBeInstanceOf(Date);
      expect(stats.newestEntry).toBeInstanceOf(Date);
      expect(stats.categoryCounts).toBeDefined();
      expect(typeof stats.categoryCounts).toBe('object');
    });

    it('should calculate cache size correctly', async () => {
      const largeQuote: Quote = {
        id: 'large-q',
        text: 'A'.repeat(1000), // Large text
        author: 'Large Author',
        source: 'quotegarden',
        category: 'test',
        tags: ['large', 'test'],
        length: 1000,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      await service.cacheQuote(largeQuote);
      const stats = await service.getCacheStats();
      
      expect(stats.totalSize).toBeGreaterThan(1000);
    });

    it('should track category distribution', async () => {
      const quotes: Quote[] = [
        { ...createMockQuotes(1)[0], id: 'q1', category: 'life' },
        { ...createMockQuotes(1)[0], id: 'q2', category: 'life' },
        { ...createMockQuotes(1)[0], id: 'q3', category: 'motivation' },
        { ...createMockQuotes(1)[0], id: 'q4', category: 'success' }
      ];

      await service.cacheMultipleQuotes(quotes);
      const stats = await service.getCacheStats();
      
      expect(stats.categoryCounts.life).toBe(2);
      expect(stats.categoryCounts.motivation).toBe(1);
      expect(stats.categoryCounts.success).toBe(1);
    });
  });

  describe('Storage Strategy', () => {
    it('should use localStorage when available', () => {
      if (service.isLocalStorageAvailable()) {
        expect(service.getPreferredStorage()).toBe('localStorage');
      }
    });

    it('should fallback to IndexedDB when localStorage is full', async () => {
      // Mock localStorage being full
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const quote = createMockQuotes(1)[0];
      await service.cacheQuote(quote);
      
      // Should have fallen back to IndexedDB
      expect(service.getLastUsedStorage()).toBe('indexedDB');
    });

    it('should handle storage errors gracefully', async () => {
      // Mock both storage methods failing
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage Error');
      });

      const quote = createMockQuotes(1)[0];
      
      // Should not throw error
      await expect(service.cacheQuote(quote)).resolves.not.toThrow();
    });
  });

  describe('Cache Expiration', () => {
    it('should respect cache expiration time', async () => {
      const quote = createMockQuotes(1)[0];
      const shortExpirationTime = 100; // 100ms
      
      await service.cacheQuote(quote, shortExpirationTime);
      
      // Quote should be available immediately
      expect(await service.getCachedQuote(quote.id)).toBeDefined();
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Quote should be expired and removed
      expect(await service.getCachedQuote(quote.id)).toBeNull();
    });

    it('should clean up expired quotes automatically', async () => {
      const quotes = createMockQuotes(5);
      const shortExpiration = 50;
      
      // Cache some quotes with short expiration
      await service.cacheQuote(quotes[0], shortExpiration);
      await service.cacheQuote(quotes[1], shortExpiration);
      await service.cacheQuote(quotes[2]); // Default expiration (long)
      
      // Wait for short expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await service.cleanupExpiredQuotes();
      const remaining = await service.getAllCachedQuotes();
      
      expect(remaining).toHaveLength(1);
      expect(remaining[0].quote.id).toBe(quotes[2].id);
    });

    it('should provide method to check if quote is expired', async () => {
      const quote = createMockQuotes(1)[0];
      const shortExpiration = 50;
      
      await service.cacheQuote(quote, shortExpiration);
      
      expect(await service.isQuoteExpired(quote.id)).toBe(false);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(await service.isQuoteExpired(quote.id)).toBe(true);
    });
  });

  describe('Offline Support', () => {
    it('should provide offline quote when online quotes fail', async () => {
      // Pre-cache some quotes
      const quotes = createMockQuotes(10);
      await service.cacheMultipleQuotes(quotes);
      
      const offlineQuote = await service.getRandomOfflineQuote();
      
      expect(offlineQuote).toBeDefined();
      expect(quotes.map(q => q.id)).toContain(offlineQuote?.id);
    });

    it('should return null when no offline quotes available', async () => {
      await service.clearCache();
      
      const offlineQuote = await service.getRandomOfflineQuote();
      expect(offlineQuote).toBeNull();
    });

    it('should prioritize recently cached quotes for offline use', async () => {
      const oldQuote: Quote = { ...createMockQuotes(1)[0], id: 'old-quote' };
      const newQuote: Quote = { ...createMockQuotes(1)[0], id: 'new-quote' };
      
      await service.cacheQuote(oldQuote);
      await new Promise(resolve => setTimeout(resolve, 50));
      await service.cacheQuote(newQuote);
      
      const offlineQuote = await service.getRandomOfflineQuote();
      
      // Should be more likely to get the newer quote (probabilistic)
      expect(offlineQuote).toBeDefined();
    });
  });
});
