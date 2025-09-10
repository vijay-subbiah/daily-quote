/**
 * Cache Entry Interface Implementation
 * T028: Interface for cached quote entries
 */

import { Quote } from './quote.interface';

export interface CacheEntry {
  // Cache metadata
  id: string;
  key: string;
  
  // Cached data
  quote: Quote;
  
  // Cache timing
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
  
  // Cache strategy
  source: 'api' | 'fallback' | 'user';
  priority: number; // 1-10, higher = more important
  
  // Usage statistics
  accessCount: number;
  lastModified: Date;
  
  // Validation
  isValid: boolean;
  checksum?: string;
}

export interface CacheMetadata {
  totalEntries: number;
  totalSize: number; // bytes
  oldestEntry: Date;
  newestEntry: Date;
  hitRate: number; // 0-1
  missRate: number; // 0-1
  averageAccessTime: number; // ms
}

export interface CacheOptions {
  maxSize: number; // Maximum number of entries
  maxAge: number; // Maximum age in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  compressionEnabled: boolean;
  persistToDisk: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  errors: number;
  totalRequests: number;
  averageResponseTime: number;
  memoryUsage: number;
}

/**
 * Cache entry factory
 */
export function createCacheEntry(
  quote: Quote, 
  options: Partial<CacheEntryOptions> = {}
): CacheEntry {
  const now = new Date();
  const defaultOptions: CacheEntryOptions = {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    priority: 5,
    source: 'api'
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  return {
    id: `cache_${quote.id}_${now.getTime()}`,
    key: generateCacheKey(quote),
    quote,
    createdAt: now,
    lastAccessedAt: now,
    expiresAt: new Date(now.getTime() + finalOptions.ttl),
    source: finalOptions.source,
    priority: finalOptions.priority,
    accessCount: 0,
    lastModified: now,
    isValid: true,
    checksum: generateChecksum(quote)
  };
}

export interface CacheEntryOptions {
  ttl: number; // Time to live in milliseconds
  priority: number;
  source: 'api' | 'fallback' | 'user';
}

/**
 * Cache key generation
 */
export function generateCacheKey(quote: Quote): string {
  return `quote_${quote.source}_${quote.id}`;
}

/**
 * Simple checksum generation for cache validation
 */
export function generateChecksum(quote: Quote): string {
  const data = `${quote.id}${quote.text}${quote.author}${quote.source}`;
  let hash = 0;
  
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Cache entry validation
 */
export function isValidCacheEntry(entry: CacheEntry): boolean {
  const now = new Date();
  
  return (
    entry.isValid &&
    entry.expiresAt > now &&
    entry.checksum === generateChecksum(entry.quote)
  );
}

/**
 * Cache entry access tracking
 */
export function accessCacheEntry(entry: CacheEntry): CacheEntry {
  return {
    ...entry,
    lastAccessedAt: new Date(),
    accessCount: entry.accessCount + 1
  };
}

/**
 * Cache entry expiry check
 */
export function isCacheEntryExpired(entry: CacheEntry): boolean {
  return new Date() > entry.expiresAt;
}

/**
 * Cache sorting strategies
 */
export function sortByPriority(a: CacheEntry, b: CacheEntry): number {
  return b.priority - a.priority;
}

export function sortByLastAccessed(a: CacheEntry, b: CacheEntry): number {
  return b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime();
}

export function sortByCreationTime(a: CacheEntry, b: CacheEntry): number {
  return b.createdAt.getTime() - a.createdAt.getTime();
}

export function sortByAccessCount(a: CacheEntry, b: CacheEntry): number {
  return b.accessCount - a.accessCount;
}

/**
 * Type guards
 */
export function isCacheEntry(obj: any): obj is CacheEntry {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.key === 'string' &&
    obj.quote &&
    obj.createdAt instanceof Date &&
    obj.expiresAt instanceof Date &&
    typeof obj.accessCount === 'number'
  );
}
