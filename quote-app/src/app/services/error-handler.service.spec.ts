/**
 * T016: ErrorHandler Service Contract Tests
 * 
 * IMPORTANT: This test MUST fail initially as the ErrorHandler service doesn't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Tests the ErrorHandler service which provides centralized error handling,
 * logging, and user-friendly error messages.
 */

import { TestBed } from '@angular/core/testing';
import { ErrorHandler } from '../services/error-handler.service';

describe('ErrorHandler Service', () => {
  let service: ErrorHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorHandler]
    });
    service = TestBed.inject(ErrorHandler);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty error log', () => {
      const errorLog = service.getErrorLog();
      expect(errorLog).toHaveLength(0);
    });

    it('should provide default error messages', () => {
      const networkError = service.getErrorMessage('NETWORK_ERROR');
      const apiError = service.getErrorMessage('API_ERROR');
      const unknownError = service.getErrorMessage('UNKNOWN_ERROR');

      expect(networkError).toBeDefined();
      expect(apiError).toBeDefined();
      expect(unknownError).toBeDefined();
      expect(typeof networkError).toBe('string');
      expect(typeof apiError).toBe('string');
      expect(typeof unknownError).toBe('string');
    });
  });

  describe('Error Classification', () => {
    it('should classify network errors correctly', () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'NetworkError';

      const classification = service.classifyError(networkError);
      expect(classification.type).toBe('NETWORK_ERROR');
      expect(classification.severity).toBe('medium');
      expect(classification.userMessage).toContain('network');
    });

    it('should classify API errors correctly', () => {
      const apiError = new Error('API returned 500');
      const classification = service.classifyError(apiError, 500);
      
      expect(classification.type).toBe('API_ERROR');
      expect(classification.severity).toBe('high');
      expect(classification.statusCode).toBe(500);
    });

    it('should classify client errors (4xx) correctly', () => {
      const clientError = new Error('Not found');
      const classification = service.classifyError(clientError, 404);
      
      expect(classification.type).toBe('CLIENT_ERROR');
      expect(classification.severity).toBe('low');
      expect(classification.statusCode).toBe(404);
    });

    it('should classify validation errors correctly', () => {
      const validationError = new Error('Invalid quote format');
      const classification = service.classifyError(validationError, null, { isValidation: true });
      
      expect(classification.type).toBe('VALIDATION_ERROR');
      expect(classification.severity).toBe('low');
    });

    it('should classify cache errors correctly', () => {
      const cacheError = new Error('LocalStorage quota exceeded');
      const classification = service.classifyError(cacheError, null, { isCache: true });
      
      expect(classification.type).toBe('CACHE_ERROR');
      expect(classification.severity).toBe('medium');
    });

    it('should classify unknown errors as fallback', () => {
      const unknownError = new Error('Something went wrong');
      const classification = service.classifyError(unknownError);
      
      expect(classification.type).toBe('UNKNOWN_ERROR');
      expect(classification.severity).toBe('medium');
    });
  });

  describe('Error Logging', () => {
    it('should log errors with timestamp', () => {
      const error = new Error('Test error');
      const beforeLog = new Date();
      
      service.logError(error);
      
      const afterLog = new Date();
      const errorLog = service.getErrorLog();
      
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].error).toBe(error);
      expect(errorLog[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime());
      expect(errorLog[0].timestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime());
    });

    it('should include context in error logs', () => {
      const error = new Error('Test error');
      const context = {
        component: 'QuoteComponent',
        action: 'fetchQuote',
        userId: 'user123'
      };
      
      service.logError(error, context);
      const errorLog = service.getErrorLog();
      
      expect(errorLog[0].context).toEqual(context);
    });

    it('should include error classification in logs', () => {
      const networkError = new Error('Network failed');
      service.logError(networkError);
      
      const errorLog = service.getErrorLog();
      expect(errorLog[0].classification).toBeDefined();
      expect(errorLog[0].classification.type).toBe('NETWORK_ERROR');
    });

    it('should limit log size to prevent memory issues', () => {
      const maxLogSize = 100; // Assuming this is the limit
      
      // Log more errors than the limit
      for (let i = 0; i < maxLogSize + 10; i++) {
        service.logError(new Error(`Error ${i}`));
      }
      
      const errorLog = service.getErrorLog();
      expect(errorLog.length).toBeLessThanOrEqual(maxLogSize);
    });

    it('should maintain most recent errors when log is full', () => {
      const maxLogSize = 100;
      
      // Fill the log
      for (let i = 0; i < maxLogSize + 5; i++) {
        service.logError(new Error(`Error ${i}`));
      }
      
      const errorLog = service.getErrorLog();
      const lastError = errorLog[0]; // Most recent should be first
      
      expect(lastError.error.message).toContain('Error 99'); // Latest error
    });
  });

  describe('Error Recovery', () => {
    it('should provide recovery suggestions for network errors', () => {
      const networkError = new Error('Network timeout');
      const suggestions = service.getRecoverySuggestions(networkError);
      
      expect(suggestions).toContain('retry');
      expect(suggestions).toContain('connection');
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should provide recovery suggestions for API errors', () => {
      const apiError = new Error('API error');
      const suggestions = service.getRecoverySuggestions(apiError, 429); // Rate limit
      
      expect(suggestions).toContain('wait');
      expect(suggestions).toContain('try again');
    });

    it('should provide recovery suggestions for cache errors', () => {
      const cacheError = new Error('Storage full');
      const suggestions = service.getRecoverySuggestions(cacheError, null, { isCache: true });
      
      expect(suggestions).toContain('clear');
      expect(suggestions).toContain('storage');
    });

    it('should auto-retry recoverable errors', async () => {
      let attemptCount = 0;
      const failingOperation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await service.withRetry(failingOperation, { maxAttempts: 3 });
      
      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should respect max retry attempts', async () => {
      const alwaysFailingOperation = jest.fn().mockImplementation(() => {
        throw new Error('Always fails');
      });

      await expect(service.withRetry(alwaysFailingOperation, { maxAttempts: 2 }))
        .rejects.toThrow('Always fails');
      
      expect(alwaysFailingOperation).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff for retries', async () => {
      const timestamps: number[] = [];
      const failingOperation = jest.fn().mockImplementation(() => {
        timestamps.push(Date.now());
        throw new Error('Retry test');
      });

      try {
        await service.withRetry(failingOperation, { 
          maxAttempts: 3, 
          backoffMs: 100 
        });
      } catch (e) {
        // Expected to fail
      }

      expect(timestamps.length).toBe(3);
      
      // Check that delays increase exponentially
      const delay1 = timestamps[1] - timestamps[0];
      const delay2 = timestamps[2] - timestamps[1];
      
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay1).toBeGreaterThanOrEqual(100);
    });
  });

  describe('User-Friendly Messages', () => {
    it('should provide user-friendly messages for technical errors', () => {
      const technicalError = new Error('XMLHttpRequest failed with status 500');
      const userMessage = service.getUserFriendlyMessage(technicalError, 500);
      
      expect(userMessage).not.toContain('XMLHttpRequest');
      expect(userMessage).not.toContain('500');
      expect(userMessage.length).toBeGreaterThan(10); // Should be descriptive
    });

    it('should customize messages based on context', () => {
      const error = new Error('Network error');
      const quoteFetchContext = { action: 'fetchQuote' };
      const cacheClearContext = { action: 'clearCache' };
      
      const quoteMessage = service.getUserFriendlyMessage(error, null, quoteFetchContext);
      const cacheMessage = service.getUserFriendlyMessage(error, null, cacheClearContext);
      
      expect(quoteMessage).toContain('quote');
      expect(cacheMessage).toContain('cache');
    });

    it('should include helpful actions in messages', () => {
      const error = new Error('Rate limit exceeded');
      const message = service.getUserFriendlyMessage(error, 429);
      
      expect(message).toContain('try again');
      expect(message).toContain('later');
    });

    it('should support multiple languages for messages', () => {
      const error = new Error('Network error');
      
      const englishMessage = service.getUserFriendlyMessage(error, null, { language: 'en' });
      const spanishMessage = service.getUserFriendlyMessage(error, null, { language: 'es' });
      
      expect(englishMessage).toBeDefined();
      expect(spanishMessage).toBeDefined();
      expect(englishMessage).not.toBe(spanishMessage);
    });
  });

  describe('Error Reporting', () => {
    it('should report critical errors to external service', () => {
      const criticalError = new Error('Critical system failure');
      const reportSpy = jest.spyOn(service, 'reportToExternalService');
      
      service.handleCriticalError(criticalError);
      
      expect(reportSpy).toHaveBeenCalledWith(criticalError, expect.any(Object));
    });

    it('should not report minor errors to external service', () => {
      const minorError = new Error('Minor validation error');
      const reportSpy = jest.spyOn(service, 'reportToExternalService');
      
      service.logError(minorError, { severity: 'low' });
      
      expect(reportSpy).not.toHaveBeenCalled();
    });

    it('should include device/browser info in error reports', () => {
      const error = new Error('Test error');
      const reportData = service.prepareErrorReport(error);
      
      expect(reportData.userAgent).toBeDefined();
      expect(reportData.timestamp).toBeInstanceOf(Date);
      expect(reportData.url).toBeDefined();
      expect(reportData.error).toBe(error);
    });

    it('should sanitize sensitive data from error reports', () => {
      const errorWithSensitiveData = new Error('User token: abc123secret');
      const reportData = service.prepareErrorReport(errorWithSensitiveData);
      
      expect(reportData.error.message).not.toContain('abc123secret');
      expect(reportData.error.message).toContain('[REDACTED]');
    });
  });

  describe('Error Analytics', () => {
    it('should track error frequency by type', () => {
      service.logError(new Error('Network error 1'));
      service.logError(new Error('Network error 2'));
      service.logError(new Error('API error'));
      
      const analytics = service.getErrorAnalytics();
      
      expect(analytics.byType.NETWORK_ERROR).toBe(2);
      expect(analytics.byType.API_ERROR).toBe(1);
    });

    it('should track error trends over time', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Mock some historical errors
      service.logError(new Error('Old error'), { timestamp: oneHourAgo });
      service.logError(new Error('Recent error'));
      
      const analytics = service.getErrorAnalytics();
      
      expect(analytics.trends.lastHour).toBe(1);
      expect(analytics.trends.total).toBe(2);
    });

    it('should identify error patterns', () => {
      // Log similar errors that might indicate a pattern
      for (let i = 0; i < 5; i++) {
        service.logError(new Error('Quote fetch failed'), { 
          component: 'QuoteComponent',
          action: 'fetchQuote'
        });
      }
      
      const patterns = service.identifyErrorPatterns();
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].pattern).toContain('Quote fetch failed');
      expect(patterns[0].frequency).toBe(5);
    });

    it('should calculate error rates', () => {
      // Log some successful operations
      service.logSuccess('Quote fetch successful');
      service.logSuccess('Quote fetch successful');
      
      // Log some errors
      service.logError(new Error('Quote fetch failed'));
      
      const analytics = service.getErrorAnalytics();
      
      expect(analytics.errorRate).toBeCloseTo(0.33, 2); // 1 error out of 3 operations
    });
  });

  describe('Configuration', () => {
    it('should allow configuration of log level', () => {
      service.setLogLevel('ERROR');
      
      service.logWarning('This is a warning');
      service.logError(new Error('This is an error'));
      
      const errorLog = service.getErrorLog();
      
      // Should only contain error, not warning
      expect(errorLog.length).toBe(1);
      expect(errorLog[0].level).toBe('ERROR');
    });

    it('should allow configuration of retry settings', () => {
      service.configure({
        maxRetryAttempts: 5,
        backoffMultiplier: 1.5,
        enableReporting: false
      });
      
      const config = service.getConfiguration();
      
      expect(config.maxRetryAttempts).toBe(5);
      expect(config.backoffMultiplier).toBe(1.5);
      expect(config.enableReporting).toBe(false);
    });

    it('should allow custom error message templates', () => {
      service.setMessageTemplate('NETWORK_ERROR', 'Custom network error: {{details}}');
      
      const message = service.getErrorMessage('NETWORK_ERROR', { details: 'timeout' });
      
      expect(message).toBe('Custom network error: timeout');
    });
  });
});
