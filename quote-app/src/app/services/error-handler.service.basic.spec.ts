/**
 * T038: Basic ErrorHandler Service Test
 */

import { ErrorHandler } from './error-handler.service';

describe('ErrorHandler Service - Basic', () => {
  let service: ErrorHandler;

  beforeEach(() => {
    service = new ErrorHandler();
  });

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

  it('should classify network errors correctly', () => {
    const networkError = new Error('Network request failed');
    networkError.name = 'NetworkError';

    const classification = service.classifyError(networkError);
    expect(classification.type).toBe('NETWORK_ERROR');
    expect(classification.severity).toBe('medium');
    expect(classification.userMessage).toContain('Network');
  });

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

  it('should handle retry operations', async () => {
    let attemptCount = 0;
    const operation = jest.fn().mockImplementation(() => {
      attemptCount++;
      if (attemptCount < 3) {
        const error = new Error('Network request failed');
        error.name = 'NetworkError';
        throw error;
      }
      return 'success';
    });

    const result = await service.withRetry(operation, { maxAttempts: 3 });
    
    expect(result).toBe('success');
    expect(attemptCount).toBe(3);
  });
});
