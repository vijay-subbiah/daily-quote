/**
 * RateLimitInterceptor Implementation - T041
 * 
 * Provides HTTP request rate limiting functionality to prevent
 * overwhelming external APIs with too many requests.
 * 
 * Features:
 * - Token bucket algorithm for rate limiting
 * - Configurable requests per time window
 * - Per-endpoint rate limiting
 * - Queue requests when rate limit exceeded
 * - Graceful degradation with timeout
 */

import { Injectable, Inject, Optional, InjectionToken } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, EMPTY, defer } from 'rxjs';
import { mergeMap, catchError, timeout } from 'rxjs/operators';

export interface RateLimitConfig {
  requestsPerWindow: number;
  windowSizeMs: number;
  maxQueueSize: number;
  queueTimeoutMs: number;
  enablePerEndpoint: boolean;
}

export const RATE_LIMIT_CONFIG = new InjectionToken<RateLimitConfig>('rate-limit.config');

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  queue: {
    resolve: (value: boolean) => void;
    reject: (reason: any) => void;
    timestamp: number;
  }[];
}

@Injectable()
export class RateLimitInterceptor implements HttpInterceptor {
  
  private readonly defaultConfig: RateLimitConfig = {
    requestsPerWindow: 60, // 60 requests
    windowSizeMs: 60000,   // per minute
    maxQueueSize: 20,      // max 20 queued requests
    queueTimeoutMs: 5000,  // 5 second timeout for queued requests
    enablePerEndpoint: true // separate limits per API endpoint
  };

  private readonly config: RateLimitConfig;
  private readonly buckets = new Map<string, TokenBucket>();

  constructor(@Optional() @Inject(RATE_LIMIT_CONFIG) config: Partial<RateLimitConfig> | null) {
    this.config = { ...this.defaultConfig, ...config };
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip rate limiting if request has a specific header
    if (request.headers.get('X-No-Rate-Limit') === 'true') {
      return next.handle(request);
    }

    const bucketKey = this.getBucketKey(request);
    
    return defer(() => this.acquireToken(bucketKey)).pipe(
      mergeMap((allowed: boolean) => {
        if (!allowed) {
          return throwError(() => new HttpErrorResponse({
            status: 429,
            statusText: 'Too Many Requests',
            error: 'Rate limit exceeded. Please try again later.',
            url: request.url
          }));
        }
        return next.handle(request);
      }),
      timeout(this.config.queueTimeoutMs),
      catchError((error) => {
        if (error.name === 'TimeoutError') {
          return throwError(() => new HttpErrorResponse({
            status: 408,
            statusText: 'Request Timeout',
            error: 'Request queued too long due to rate limiting.',
            url: request.url
          }));
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Get bucket key for rate limiting
   */
  private getBucketKey(request: HttpRequest<any>): string {
    if (this.config.enablePerEndpoint) {
      // Create bucket per host+path combination
      const url = new URL(request.url, window.location.origin);
      return `${url.host}${url.pathname}`;
    }
    return 'global';
  }

  /**
   * Acquire a token using token bucket algorithm
   */
  private acquireToken(bucketKey: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const bucket = this.getOrCreateBucket(bucketKey);
      const now = Date.now();

      // Refill tokens based on time elapsed
      this.refillBucket(bucket, now);

      // If tokens available, consume one immediately
      if (bucket.tokens > 0) {
        bucket.tokens--;
        resolve(true);
        return;
      }

      // No tokens available - check queue capacity
      if (bucket.queue.length >= this.config.maxQueueSize) {
        resolve(false); // Reject immediately if queue is full
        return;
      }

      // Add to queue
      bucket.queue.push({
        resolve,
        reject,
        timestamp: now
      });

      // Process queue after a delay
      this.scheduleQueueProcessing(bucketKey);
    });
  }

  /**
   * Get or create token bucket for the given key
   */
  private getOrCreateBucket(key: string): TokenBucket {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.config.requestsPerWindow,
        lastRefill: Date.now(),
        queue: []
      });
    }
    return this.buckets.get(key)!;
  }

  /**
   * Refill tokens in the bucket based on elapsed time
   */
  private refillBucket(bucket: TokenBucket, now: number): void {
    const timeSinceLastRefill = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(
      (timeSinceLastRefill / this.config.windowSizeMs) * this.config.requestsPerWindow
    );

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.tokens + tokensToAdd, this.config.requestsPerWindow);
      bucket.lastRefill = now;
    }
  }

  /**
   * Schedule processing of queued requests
   */
  private scheduleQueueProcessing(bucketKey: string): void {
    setTimeout(() => {
      this.processQueue(bucketKey);
    }, Math.ceil(this.config.windowSizeMs / this.config.requestsPerWindow));
  }

  /**
   * Process queued requests
   */
  private processQueue(bucketKey: string): void {
    const bucket = this.buckets.get(bucketKey);
    if (!bucket || bucket.queue.length === 0) {
      return;
    }

    const now = Date.now();
    this.refillBucket(bucket, now);

    // Process as many queued requests as we have tokens
    while (bucket.tokens > 0 && bucket.queue.length > 0) {
      const request = bucket.queue.shift()!;
      
      // Check if request has timed out
      if (now - request.timestamp > this.config.queueTimeoutMs) {
        request.reject(new Error('Rate limit queue timeout'));
        continue;
      }

      bucket.tokens--;
      request.resolve(true);
    }

    // Reject remaining requests that have timed out
    bucket.queue = bucket.queue.filter(request => {
      if (now - request.timestamp > this.config.queueTimeoutMs) {
        request.reject(new Error('Rate limit queue timeout'));
        return false;
      }
      return true;
    });

    // Schedule next processing if queue is not empty
    if (bucket.queue.length > 0) {
      this.scheduleQueueProcessing(bucketKey);
    }
  }

  /**
   * Get current rate limit status for debugging
   */
  getRateLimitStatus(bucketKey?: string): any {
    if (bucketKey) {
      const bucket = this.buckets.get(bucketKey);
      if (bucket) {
        this.refillBucket(bucket, Date.now());
        return {
          tokensAvailable: bucket.tokens,
          queueLength: bucket.queue.length,
          lastRefill: bucket.lastRefill
        };
      }
      return null;
    }

    // Return status for all buckets
    const status: any = {};
    for (const [key, bucket] of this.buckets.entries()) {
      this.refillBucket(bucket, Date.now());
      status[key] = {
        tokensAvailable: bucket.tokens,
        queueLength: bucket.queue.length,
        lastRefill: bucket.lastRefill
      };
    }
    return status;
  }

  /**
   * Factory function to create interceptor with custom config
   */
  static withConfig(config: Partial<RateLimitConfig>) {
    return [
      { provide: RATE_LIMIT_CONFIG, useValue: config },
      { provide: RateLimitInterceptor, useClass: RateLimitInterceptor }
    ];
  }
}
