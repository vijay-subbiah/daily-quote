/**
 * RetryInterceptor Implementation - T040
 * 
 * Provides HTTP request retry functionality with exponential backoff
 * for failed requests due to network issues or temporary server errors.
 * 
 * Features:
 * - Exponential backoff with configurable base delay
 * - Maximum retry attempts (default: 3)
 * - Retry only for specific error types (500, 502, 503, 504, network errors)
 * - Skip retry for certain operations (POST, PUT, DELETE by default)
 * - Jitter to prevent thundering herd problem
 */

import { Injectable, Inject, Optional, InjectionToken } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, of } from 'rxjs';
import { mergeMap, retry, catchError } from 'rxjs/operators';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableErrors: number[];
  skipMethods: string[];
  enableJitter: boolean;
}

export const RETRY_CONFIG = new InjectionToken<RetryConfig>('retry.config');

@Injectable()
export class RetryInterceptor implements HttpInterceptor {
  
  private readonly defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    retryableErrors: [500, 502, 503, 504, 0], // 0 for network errors
    skipMethods: ['POST', 'PUT', 'DELETE'], // Don't retry state-changing operations
    enableJitter: true
  };

  private readonly config: RetryConfig;

  constructor(@Optional() @Inject(RETRY_CONFIG) config: Partial<RetryConfig> | null) {
    this.config = { ...this.defaultConfig, ...config };
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip retry for certain HTTP methods
    if (this.config.skipMethods.includes(request.method.toUpperCase())) {
      return next.handle(request);
    }

    // Skip retry if request has a specific header to disable retry
    if (request.headers.get('X-No-Retry') === 'true') {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      retry({
        count: this.config.maxRetries,
        delay: (error: HttpErrorResponse, retryCount: number) => {
          // Only retry for specific error types
          if (!this.shouldRetry(error, this.config)) {
            return throwError(() => error);
          }

          const delay = this.calculateDelay(retryCount, this.config);
          console.log(`Retrying request (attempt ${retryCount + 1}/${this.config.maxRetries + 1}) after ${delay}ms: ${request.method} ${request.url}`);
          
          return timer(delay);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // Log final failure after all retries exhausted
        if (this.shouldRetry(error, this.config)) {
          console.error(`Request failed after ${this.config.maxRetries} retries: ${request.method} ${request.url}`, error);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Determine if the error should be retried
   */
  private shouldRetry(error: HttpErrorResponse, config: RetryConfig): boolean {
    // Network errors (status 0) should be retried
    if (error.status === 0) {
      return true;
    }

    // Check if error status is in the retryable list
    return config.retryableErrors.includes(error.status);
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(retryCount: number, config: RetryConfig): number {
    // Exponential backoff: baseDelay * 2^retryCount
    let delay = config.baseDelay * Math.pow(2, retryCount);

    // Cap at maximum delay
    delay = Math.min(delay, config.maxDelay);

    // Add jitter to prevent thundering herd
    if (config.enableJitter) {
      const jitter = Math.random() * 0.3; // Up to 30% jitter
      delay = delay * (1 + jitter);
    }

    return Math.round(delay);
  }

  /**
   * Factory function to create interceptor with custom config
   */
  static withConfig(config: Partial<RetryConfig>) {
    return [
      { provide: RETRY_CONFIG, useValue: config },
      { provide: RetryInterceptor, useClass: RetryInterceptor }
    ];
  }
}
