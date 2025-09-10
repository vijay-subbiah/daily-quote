/**
 * T037: Minimal CacheService Test - Basic functionality
 */

import { CacheService } from './cache.service';
import { Quote } from '../models/quote.interface';

describe('CacheService - Basic', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should detect storage availability', () => {
    expect(service.isLocalStorageAvailable()).toBeDefined();
    expect(service.isIndexedDBAvailable()).toBeDefined();
  });

  it('should initialize with empty cache', async () => {
    const cache = await service.getAllCachedQuotes();
    expect(cache).toHaveLength(0);
  });

  it('should cache and retrieve a quote', async () => {
    const mockQuote: Quote = {
      id: 'test-q1',
      text: 'This is a test quote',
      author: 'Test Author',
      source: 'quotegarden',
      category: 'test',
      tags: ['test'],
      length: 20,
      dateAdded: new Date('2024-01-01'),
      popularity: 75,
      verified: true
    };

    await service.cacheQuote(mockQuote);
    const cached = await service.getCachedQuote(mockQuote.id);
    
    expect(cached).toBeDefined();
    expect(cached?.quote).toEqual(mockQuote);
    expect(cached?.createdAt).toBeInstanceOf(Date);
  });
});
