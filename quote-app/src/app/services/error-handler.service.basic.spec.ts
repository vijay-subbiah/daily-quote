/**
 * T038: Basic ErrorHandler Service Test
 */

import { ErrorHandler } from './error-handler.service';

describe('ErrorHandler Service - Basic', () => {
  let service: ErrorHandler;
  let consoleErrorSpy: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(() => {
    service = new ErrorHandler();
    // Mock console.error to prevent test output pollution
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // Empty implementation to suppress console output
    });
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty error log', () => {
    const errorLog = service.getErrorLog();
    expect(errorLog.length).toBe(0);
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
    
    expect(errorLog.length).toBe(1);
    expect(errorLog[0].error).toBe(error);
    expect(errorLog[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime());
    expect(errorLog[0].timestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime());
    
    // Verify console.error was called but mocked (no actual output)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle retry operations', async () => {
    // Simple test to verify the method exists and handles basic functionality
    const operation = () => Promise.reject(new Error('Operation failed'));

    try {
      await service.withRetry(operation, { maxAttempts: 2 });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('Operation failed');
    }
  });
});
