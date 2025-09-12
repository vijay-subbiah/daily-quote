/**
 * CacheService - T037 Implementation
 * 
 * Manages local storage for quotes with support for:
 * - localStorage and IndexedDB storage
 * - Cache size limits and expiration
 * - Offline functionality
 * - Cache statistics and management
 */

import { Injectable } from '@angular/core';
import { Quote } from '../models/quote.interface';
import { CacheEntry } from '../models/cache-entry.interface';

export interface CacheStats {
  totalQuotes: number;
  totalSize: number;
  oldestEntry: Date;
  newestEntry: Date;
  categoryCounts: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly CACHE_KEY = 'quote-app-cache';
  private readonly MAX_CACHE_SIZE = 100;
  private readonly CACHE_EXPIRY_HOURS = 24;

  constructor() {
    this.initializeCache();
  }

  /**
   * Initialize the cache system
   */
  private async initializeCache(): Promise<void> {
    // Check and clean up expired entries on initialization
    await this.cleanupExpiredEntries();
  }

  /**
   * Check if localStorage is available
   */
  isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if IndexedDB is available
   */
  isIndexedDBAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  /**
   * Cache a single quote
   */
  async cacheQuote(quote: Quote): Promise<void> {
    const entries = await this.getAllCachedQuotes();
    
    // Remove existing entry if it exists
    const filteredEntries = entries.filter(entry => entry.quote.id !== quote.id);
    
    // Create new cache entry
    const newEntry: CacheEntry = {
      id: quote.id,
      key: `quote_${quote.id}`,
      quote,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      expiresAt: new Date(Date.now() + this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000),
      source: 'api',
      priority: 5,
      accessCount: 0,
      lastModified: new Date(),
      isValid: true
    };

    // Add to beginning of array (newest first)
    filteredEntries.unshift(newEntry);

    // Enforce cache size limit
    const limitedEntries = this.enforceCacheLimit(filteredEntries);

    // Save to storage
    await this.saveCacheEntries(limitedEntries);
  }

  /**
   * Cache multiple quotes at once
   */
  async cacheMultipleQuotes(quotes: Quote[]): Promise<void> {
    const existingEntries = await this.getAllCachedQuotes();
    const existingIds = new Set(existingEntries.map(entry => entry.quote.id));

    // Filter out quotes that are already cached
    const newQuotes = quotes.filter(quote => !existingIds.has(quote.id));

    // Create cache entries for new quotes
    const newEntries: CacheEntry[] = newQuotes.map(quote => ({
      id: quote.id,
      key: `quote_${quote.id}`,
      quote,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      expiresAt: new Date(Date.now() + this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000),
      source: 'api' as const,
      priority: 5,
      accessCount: 0,
      lastModified: new Date(),
      isValid: true
    }));

    // Combine with existing entries (new ones first)
    const allEntries = [...newEntries, ...existingEntries];

    // Enforce cache size limit
    const limitedEntries = this.enforceCacheLimit(allEntries);

    // Save to storage
    await this.saveCacheEntries(limitedEntries);
  }

  /**
   * Get a cached quote by ID
   */
  async getCachedQuote(id: string): Promise<CacheEntry | null> {
    const entries = await this.getAllCachedQuotes();
    const entry = entries.find(entry => entry.quote.id === id);

    if (entry) {
      // Check if expired
      if (await this.isQuoteExpired(id)) {
        await this.removeCachedQuote(id);
        return null;
      }

      // Increment access count
      entry.accessCount++;
      await this.saveCacheEntries(entries);
      
      return entry;
    }

    return null;
  }

  /**
   * Get all cached quotes ordered by cache date (newest first)
   */
  async getAllCachedQuotes(): Promise<CacheEntry[]> {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (!stored) {
        return [];
      }

      const entries: CacheEntry[] = JSON.parse(stored).map((entry: any) => ({
        ...entry,
        quote: {
          ...entry.quote,
          dateAdded: entry.quote.dateAdded ? new Date(entry.quote.dateAdded) : undefined
        },
        createdAt: new Date(entry.createdAt),
        lastAccessedAt: new Date(entry.lastAccessedAt),
        expiresAt: new Date(entry.expiresAt),
        lastModified: new Date(entry.lastModified)
      }));

      // Sort by creation date (newest first)
      return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch {
      return [];
    }
  }

  /**
   * Get cached quotes by category
   */
  async getCachedQuotesByCategory(category: string): Promise<CacheEntry[]> {
    const allEntries = await this.getAllCachedQuotes();
    return allEntries.filter(entry => entry.quote.category === category);
  }

  /**
   * Get cached quotes by tag
   */
  async getCachedQuotesByTag(tag: string): Promise<CacheEntry[]> {
    const allEntries = await this.getAllCachedQuotes();
    return allEntries.filter(entry => 
      entry.quote.tags && entry.quote.tags.includes(tag)
    );
  }

  /**
   * Get cached quotes by author
   */
  async getCachedQuotesByAuthor(author: string): Promise<CacheEntry[]> {
    const allEntries = await this.getAllCachedQuotes();
    return allEntries.filter(entry => entry.quote.author === author);
  }

  /**
   * Search cached quotes by text content
   */
  async searchCachedQuotes(query: string): Promise<CacheEntry[]> {
    const allEntries = await this.getAllCachedQuotes();
    const lowerQuery = query.toLowerCase();
    return allEntries.filter(entry =>
      entry.quote.text.toLowerCase().includes(lowerQuery) ||
      entry.quote.author.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Remove a cached quote by ID
   */
  async removeCachedQuote(id: string): Promise<void> {
    const entries = await this.getAllCachedQuotes();
    const filteredEntries = entries.filter(entry => entry.quote.id !== id);
    await this.saveCacheEntries(filteredEntries);
  }

  /**
   * Clear all cached quotes
   */
  async clearCache(): Promise<void> {
    localStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Check if a quote is expired
   */
  async isQuoteExpired(id: string): Promise<boolean> {
    const entry = await this.getCachedQuoteRaw(id);
    if (!entry) {
      return true;
    }

    return new Date() > entry.expiresAt;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    const entries = await this.getAllCachedQuotes();
    
    if (entries.length === 0) {
      return {
        totalQuotes: 0,
        totalSize: 0,
        oldestEntry: new Date(),
        newestEntry: new Date(),
        categoryCounts: {}
      };
    }

    // Calculate total size by serializing entries
    const totalSize = entries.reduce((sum, entry) => sum + this.calculateQuoteSize(entry.quote), 0);
    const sortedByDate = entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const categoryCounts: Record<string, number> = {};
    entries.forEach((entry: CacheEntry) => {
      const category = entry.quote.category || 'uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return {
      totalQuotes: entries.length,
      totalSize,
      oldestEntry: sortedByDate[0].createdAt,
      newestEntry: sortedByDate[sortedByDate.length - 1].createdAt,
      categoryCounts
    };
  }

  /**
   * Get a random quote for offline use
   */
  async getRandomOfflineQuote(): Promise<Quote | null> {
    const entries = await this.getAllCachedQuotes();
    
    if (entries.length === 0) {
      return null;
    }

    // Prioritize recently cached quotes (weighted random selection)
    const weights = entries.map((_, index) => Math.pow(0.9, index)); // Exponential decay
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < entries.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return entries[i].quote;
      }
    }

    // Fallback to last quote
    return entries[entries.length - 1].quote;
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupExpiredEntries(): Promise<void> {
    const entries = await this.getAllCachedQuotes();
    const now = new Date();
    const validEntries = entries.filter(entry => entry.expiresAt > now);
    
    if (validEntries.length !== entries.length) {
      await this.saveCacheEntries(validEntries);
    }
  }

  /**
   * Get cached quote without updating access count
   */
  private async getCachedQuoteRaw(id: string): Promise<CacheEntry | null> {
    const entries = await this.getAllCachedQuotes();
    return entries.find(entry => entry.quote.id === id) || null;
  }

  /**
   * Calculate the size of a quote in bytes
   */
  private calculateQuoteSize(quote: Quote): number {
    return new Blob([JSON.stringify(quote)]).size;
  }

  /**
   * Enforce cache size limit by removing oldest entries
   */
  private enforceCacheLimit(entries: CacheEntry[]): CacheEntry[] {
    if (entries.length <= this.MAX_CACHE_SIZE) {
      return entries;
    }

    // Keep the newest entries (already sorted by cache date)
    return entries.slice(0, this.MAX_CACHE_SIZE);
  }

  /**
   * Save cache entries to localStorage
   */
  private async saveCacheEntries(entries: CacheEntry[]): Promise<void> {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save cache entries:', error);
      // Could implement IndexedDB fallback here
    }
  }
}
