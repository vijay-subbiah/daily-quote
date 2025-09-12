/**
 * T017: HTTP Interceptor Contract Tests
 * 
 * IMPORTANT: This test MUST fail initially as the HTTP interceptors don't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Tests the HTTP interceptors for error handling, caching, retry logic,
 * and request/response transformation.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';

import { ErrorInterceptor } from '../interceptors/error.interceptor';
import { CacheInterceptor } from '../interceptors/cache.interceptor';
import { RetryInterceptor } from '../interceptors/retry.interceptor';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

describe('HTTP Interceptors', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  describe('ErrorInterceptor', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorInterceptor,
            multi: true
          }
        ]
      });

      httpClient = TestBed.inject(HttpClient);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should be created', () => {
      expect(ErrorInterceptor).toBeDefined();
    });

    it('should pass through successful requests unchanged', () => {
      const testData = { message: 'success' };

      httpClient.get('/api/test').subscribe(response => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne('/api/test');
      expect(req.request.method).toBe('GET');
      req.flush(testData);
    });

    it('should transform HTTP error responses to application errors', () => {
      let capturedError: any;

      httpClient.get('/api/error').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          capturedError = error;
        }
      });

      const req = httpMock.expectOne('/api/error');
      req.flush(
        { message: 'Server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );

      expect(capturedError).toBeDefined();
      expect(capturedError.type).toBe('API_ERROR');
      expect(capturedError.statusCode).toBe(500);
      expect(capturedError.userMessage).toBeDefined();
    });

    it('should handle network errors appropriately', () => {
      let capturedError: any;

      httpClient.get('/api/network-error').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          capturedError = error;
        }
      });

      const req = httpMock.expectOne('/api/network-error');
      req.error(new ProgressEvent('Network error'));

      expect(capturedError).toBeDefined();
      expect(capturedError.type).toBe('NETWORK_ERROR');
    });

    it('should preserve original error information', () => {
      let capturedError: any;

      httpClient.get('/api/error').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          capturedError = error;
        }
      });

      const req = httpMock.expectOne('/api/error');
      const errorResponse = { error: 'Validation failed', details: ['Field required'] };
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });

      expect(capturedError.originalError).toBeInstanceOf(HttpErrorResponse);
      expect(capturedError.details).toEqual(errorResponse);
    });

    it('should add request context to errors', () => {
      let capturedError: any;

      httpClient.get('/api/quotes/123').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          capturedError = error;
        }
      });

      const req = httpMock.expectOne('/api/quotes/123');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      expect(capturedError.context).toBeDefined();
      expect(capturedError.context.url).toBe('/api/quotes/123');
      expect(capturedError.context.method).toBe('GET');
    });
  });

  describe('CacheInterceptor', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          {
            provide: HTTP_INTERCEPTORS,
            useClass: CacheInterceptor,
            multi: true
          }
        ]
      });

      httpClient = TestBed.inject(HttpClient);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should be created', () => {
      expect(CacheInterceptor).toBeDefined();
    });

    it('should cache GET requests marked as cacheable', () => {
      const testData = { quote: 'Test quote' };

      // First request
      httpClient.get('/api/quotes/random', {
        headers: { 'X-Cache': 'true' }
      }).subscribe(response => {
        expect(response).toEqual(testData);
      });

      const firstReq = httpMock.expectOne('/api/quotes/random');
      firstReq.flush(testData);

      // Second request should use cache
      httpClient.get('/api/quotes/random', {
        headers: { 'X-Cache': 'true' }
      }).subscribe(response => {
        expect(response).toEqual(testData);
      });

      // No second HTTP request should be made
      httpMock.expectNone('/api/quotes/random');
    });

    it('should not cache requests without cache header', () => {
      const testData = { quote: 'Test quote' };

      // First request
      httpClient.get('/api/quotes/random').subscribe();
      const firstReq = httpMock.expectOne('/api/quotes/random');
      firstReq.flush(testData);

      // Second request should NOT use cache
      httpClient.get('/api/quotes/random').subscribe();
      const secondReq = httpMock.expectOne('/api/quotes/random');
      secondReq.flush(testData);
    });

    it('should not cache POST/PUT/DELETE requests', () => {
      const testData = { success: true };

      httpClient.post('/api/quotes', { quote: 'New quote' }, {
        headers: { 'X-Cache': 'true' }
      }).subscribe();

      const req = httpMock.expectOne('/api/quotes');
      req.flush(testData);

      // Second POST should not use cache
      httpClient.post('/api/quotes', { quote: 'Another quote' }, {
        headers: { 'X-Cache': 'true' }
      }).subscribe();

      const secondReq = httpMock.expectOne('/api/quotes');
      secondReq.flush(testData);
    });

    it('should respect cache expiration time', (done) => {
      const testData = { quote: 'Cached quote' };
      const cacheTimeout = 100; // 100ms

      // First request
      httpClient.get('/api/quotes/random', {
        headers: { 
          'X-Cache': 'true',
          'X-Cache-TTL': cacheTimeout.toString()
        }
      }).subscribe();

      const firstReq = httpMock.expectOne('/api/quotes/random');
      firstReq.flush(testData);

      // Wait for cache to expire
      setTimeout(() => {
        httpClient.get('/api/quotes/random', {
          headers: { 'X-Cache': 'true' }
        }).subscribe();

        // Should make new request after expiration
        const expiredReq = httpMock.expectOne('/api/quotes/random');
        expiredReq.flush(testData);
        done();
      }, cacheTimeout + 50);
    });

    it('should invalidate cache on related mutations', () => {
      const testData = { quote: 'Cached quote' };

      // Cache a GET request
      httpClient.get('/api/quotes/123', {
        headers: { 'X-Cache': 'true' }
      }).subscribe();

      const getReq = httpMock.expectOne('/api/quotes/123');
      getReq.flush(testData);

      // Make a PUT request that should invalidate cache
      httpClient.put('/api/quotes/123', { updated: true }).subscribe();
      const putReq = httpMock.expectOne('/api/quotes/123');
      putReq.flush({ success: true });

      // Next GET should not use cache
      httpClient.get('/api/quotes/123', {
        headers: { 'X-Cache': 'true' }
      }).subscribe();

      const newGetReq = httpMock.expectOne('/api/quotes/123');
      newGetReq.flush(testData);
    });
  });

  describe('RetryInterceptor', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          {
            provide: HTTP_INTERCEPTORS,
            useClass: RetryInterceptor,
            multi: true
          }
        ]
      });

      httpClient = TestBed.inject(HttpClient);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should be created', () => {
      expect(RetryInterceptor).toBeDefined();
    });

    it('should not retry successful requests', () => {
      const testData = { success: true };

      httpClient.get('/api/quotes').subscribe(response => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne('/api/quotes');
      req.flush(testData);

      // Should not make additional requests
      httpMock.expectNone('/api/quotes');
    });

    it('should retry failed requests with retryable errors', (done) => {
      let responseCount = 0;
      const testData = { quote: 'Success after retry' };

      httpClient.get('/api/quotes', {
        headers: { 'X-Retry': 'true', 'X-Retry-Count': '2' }
      }).subscribe({
        next: (response) => {
          expect(response).toEqual(testData);
          done();
        },
        error: () => fail('Should have succeeded after retry')
      });

      // First request fails
      const firstReq = httpMock.expectOne('/api/quotes');
      firstReq.flush(null, { status: 502, statusText: 'Bad Gateway' });

      // Second request (retry) succeeds
      setTimeout(() => {
        const retryReq = httpMock.expectOne('/api/quotes');
        retryReq.flush(testData);
      }, 100);
    });

    it('should not retry non-retryable errors', () => {
      httpClient.get('/api/quotes', {
        headers: { 'X-Retry': 'true' }
      }).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne('/api/quotes');
      req.flush(null, { status: 404, statusText: 'Not Found' });

      // Should not retry 404 errors
      httpMock.expectNone('/api/quotes');
    });

    it('should respect maximum retry attempts', (done) => {
      let requestCount = 0;

      httpClient.get('/api/quotes', {
        headers: { 'X-Retry': 'true', 'X-Retry-Count': '2' }
      }).subscribe({
        next: () => fail('Should have failed after max retries'),
        error: (error) => {
          expect(requestCount).toBe(3); // Initial + 2 retries
          done();
        }
      });

      // Handle initial request and retries
      const handleRequest = () => {
        const req = httpMock.expectOne('/api/quotes');
        requestCount++;
        req.flush(null, { status: 502, statusText: 'Bad Gateway' });

        if (requestCount < 3) {
          setTimeout(handleRequest, 100);
        }
      };

      handleRequest();
    });

    it('should use exponential backoff for retries', (done) => {
      const timestamps: number[] = [];
      let requestCount = 0;

      httpClient.get('/api/quotes', {
        headers: { 'X-Retry': 'true', 'X-Retry-Count': '2' }
      }).subscribe({
        error: () => {
          // Check that delays increased
          if (timestamps.length === 3) {
            const delay1 = timestamps[1] - timestamps[0];
            const delay2 = timestamps[2] - timestamps[1];
            expect(delay2).toBeGreaterThan(delay1);
            done();
          }
        }
      });

      const handleRequest = () => {
        timestamps.push(Date.now());
        const req = httpMock.expectOne('/api/quotes');
        requestCount++;
        req.flush(null, { status: 502, statusText: 'Bad Gateway' });

        if (requestCount < 3) {
          setTimeout(handleRequest, requestCount * 100); // Exponential backoff
        }
      };

      handleRequest();
    });

    it('should only retry GET and HEAD requests by default', () => {
      // POST should not retry
      httpClient.post('/api/quotes', { quote: 'test' }, {
        headers: { 'X-Retry': 'true' }
      }).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(502);
        }
      });

      const postReq = httpMock.expectOne('/api/quotes');
      postReq.flush(null, { status: 502, statusText: 'Bad Gateway' });

      // Should not retry POST
      httpMock.expectNone('/api/quotes');
    });
  });

  describe('LoggingInterceptor', () => {
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          {
            provide: HTTP_INTERCEPTORS,
            useClass: LoggingInterceptor,
            multi: true
          }
        ]
      });

      httpClient = TestBed.inject(HttpClient);
      httpMock = TestBed.inject(HttpTestingController);
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      httpMock.verify();
      consoleLogSpy.mockRestore();
    });

    it('should be created', () => {
      expect(LoggingInterceptor).toBeDefined();
    });

    it('should log successful requests', () => {
      const testData = { success: true };

      httpClient.get('/api/quotes').subscribe();

      const req = httpMock.expectOne('/api/quotes');
      req.flush(testData);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP Request'),
        expect.objectContaining({
          method: 'GET',
          url: '/api/quotes'
        })
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP Response'),
        expect.objectContaining({
          status: 200,
          url: '/api/quotes'
        })
      );
    });

    it('should log failed requests with error details', () => {
      httpClient.get('/api/quotes').subscribe({
        next: () => fail('Should have failed'),
        error: () => {
          // Expected to fail
        }
      });

      const req = httpMock.expectOne('/api/quotes');
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP Error'),
        expect.objectContaining({
          status: 500,
          url: '/api/quotes'
        })
      );
    });

    it('should include request duration in logs', () => {
      const testData = { success: true };

      httpClient.get('/api/quotes').subscribe();

      const req = httpMock.expectOne('/api/quotes');
      
      // Add a small delay before responding
      setTimeout(() => {
        req.flush(testData);
        
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('HTTP Response'),
          expect.objectContaining({
            duration: expect.any(Number)
          })
        );
      }, 10);
    });

    it('should sanitize sensitive data from logs', () => {
      const requestData = {
        username: 'user123',
        password: 'secret123',
        token: 'abc123token'
      };

      httpClient.post('/api/auth', requestData).subscribe();

      const req = httpMock.expectOne('/api/auth');
      req.flush({ success: true });

      // Check that sensitive fields are redacted
      const logCall = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('HTTP Request')
      );
      
      expect(logCall[1].body).not.toContain('secret123');
      expect(logCall[1].body).not.toContain('abc123token');
      expect(logCall[1].body).toContain('[REDACTED]');
    });

    it('should respect log level configuration', () => {
      // Configure to only log errors
      const config = { logLevel: 'ERROR' };
      
      httpClient.get('/api/quotes', {
        headers: { 'X-Log-Config': JSON.stringify(config) }
      }).subscribe();

      const req = httpMock.expectOne('/api/quotes');
      req.flush({ success: true });

      // Should not log successful requests when level is ERROR
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('HTTP Request'),
        expect.any(Object)
      );
    });

    it('should include correlation ID for request tracking', () => {
      httpClient.get('/api/quotes').subscribe();

      const req = httpMock.expectOne('/api/quotes');
      req.flush({ success: true });

      const requestLog = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('HTTP Request')
      );
      const responseLog = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('HTTP Response')
      );

      expect(requestLog[1].correlationId).toBeDefined();
      expect(responseLog[1].correlationId).toBeDefined();
      expect(requestLog[1].correlationId).toBe(responseLog[1].correlationId);
    });
  });

  describe('Interceptor Chain Integration', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          {
            provide: HTTP_INTERCEPTORS,
            useClass: LoggingInterceptor,
            multi: true
          },
          {
            provide: HTTP_INTERCEPTORS,
            useClass: RetryInterceptor,
            multi: true
          },
          {
            provide: HTTP_INTERCEPTORS,
            useClass: CacheInterceptor,
            multi: true
          },
          {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorInterceptor,
            multi: true
          }
        ]
      });

      httpClient = TestBed.inject(HttpClient);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should work together in the correct order', () => {
      const testData = { quote: 'Integration test' };

      httpClient.get('/api/quotes', {
        headers: { 
          'X-Cache': 'true',
          'X-Retry': 'true'
        }
      }).subscribe(response => {
        expect(response).toEqual(testData);
      });

      const req = httpMock.expectOne('/api/quotes');
      req.flush(testData);

      // Second request should use cache (no HTTP call)
      httpClient.get('/api/quotes', {
        headers: { 'X-Cache': 'true' }
      }).subscribe(response => {
        expect(response).toEqual(testData);
      });

      httpMock.expectNone('/api/quotes');
    });

    it('should handle complex error scenarios with retries and caching', (done) => {
      let requestCount = 0;
      const finalData = { quote: 'Success after retry' };

      httpClient.get('/api/quotes', {
        headers: { 
          'X-Cache': 'true',
          'X-Retry': 'true',
          'X-Retry-Count': '2'
        }
      }).subscribe({
        next: (response) => {
          expect(response).toEqual(finalData);
          done();
        },
        error: () => fail('Should have succeeded after retry')
      });

      const handleRequest = () => {
        const req = httpMock.expectOne('/api/quotes');
        requestCount++;
        
        if (requestCount < 2) {
          req.flush(null, { status: 502, statusText: 'Bad Gateway' });
          setTimeout(handleRequest, 100);
        } else {
          req.flush(finalData);
        }
      };

      handleRequest();
    });
  });
});
