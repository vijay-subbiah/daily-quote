import { ApiResponse } from './api-response.interface';
import { Quote } from './quote.interface';

describe('ApiResponse Interface Contract', () => {
  const mockQuote: Quote = {
    id: 'api-test',
    text: 'Success is not final, failure is not fatal.',
    author: 'Winston Churchill',
    source: 'quotegarden',
    length: 42
  };

  describe('ApiResponse structure validation', () => {
    it('should have all required properties for successful response', () => {
      // This test MUST FAIL initially as ApiResponse interface doesn't exist yet
      const successResponse: ApiResponse = {
        success: true,
        data: mockQuote,
        error: null,
        source: 'quotegarden',
        rateLimit: {
          remaining: 99,
          resetTime: Date.now() + 3600000
        }
      };

      expect(successResponse.success).toBe(true);
      expect(typeof successResponse.success).toBe('boolean');
      expect(successResponse.data).toEqual(mockQuote);
      expect(successResponse.error).toBeNull();
      expect(successResponse.source).toBe('quotegarden');
      expect(typeof successResponse.source).toBe('string');
      expect(successResponse.rateLimit).toBeDefined();
      expect(typeof successResponse.rateLimit.remaining).toBe('number');
      expect(typeof successResponse.rateLimit.resetTime).toBe('number');
    });

    it('should have all required properties for error response', () => {
      const errorResponse: ApiResponse = {
        success: false,
        data: null,
        error: 'API rate limit exceeded',
        source: 'quotegarden',
        rateLimit: {
          remaining: 0,
          resetTime: Date.now() + 3600000
        }
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.data).toBeNull();
      expect(errorResponse.error).toBe('API rate limit exceeded');
      expect(typeof errorResponse.error).toBe('string');
      expect(errorResponse.source).toBe('quotegarden');
    });
  });

  describe('ApiResponse validation rules', () => {
    it('should have data when success is true', () => {
      const validSuccessResponse: ApiResponse = {
        success: true,
        data: mockQuote,
        error: null,
        source: 'quotable',
        rateLimit: {
          remaining: 50,
          resetTime: Date.now() + 1800000
        }
      };

      if (validSuccessResponse.success) {
        expect(validSuccessResponse.data).not.toBeNull();
        expect(validSuccessResponse.error).toBeNull();
      }
    });

    it('should have error message when success is false', () => {
      const validErrorResponse: ApiResponse = {
        success: false,
        data: null,
        error: 'Network timeout occurred',
        source: 'quotable',
        rateLimit: {
          remaining: 25,
          resetTime: Date.now() + 2700000
        }
      };

      if (!validErrorResponse.success) {
        expect(validErrorResponse.data).toBeNull();
        expect(validErrorResponse.error).not.toBeNull();
        expect(validErrorResponse.error).toBeTruthy();
      }
    });

    it('should have valid source identifier', () => {
      const validSources = ['quotegarden', 'quotable', 'local'];
      
      validSources.forEach((source: string) => {
        const response: ApiResponse = {
          success: true,
          data: mockQuote,
          error: null,
          source: source,
          rateLimit: {
            remaining: 75,
            resetTime: Date.now() + 3600000
          }
        };

        expect(validSources).toContain(response.source);
      });
    });
  });

  describe('RateLimit information validation', () => {
    it('should have valid rate limit information', () => {
      const response: ApiResponse = {
        success: true,
        data: mockQuote,
        error: null,
        source: 'quotegarden',
        rateLimit: {
          remaining: 85,
          resetTime: Date.now() + 3600000
        }
      };

      expect(response.rateLimit.remaining).toBeGreaterThanOrEqual(0);
      expect(response.rateLimit.remaining).toBeLessThanOrEqual(100);
      expect(response.rateLimit.resetTime).toBeGreaterThan(Date.now());
    });

    it('should handle zero remaining requests', () => {
      const rateLimitedResponse: ApiResponse = {
        success: false,
        data: null,
        error: 'Rate limit exceeded',
        source: 'quotegarden',
        rateLimit: {
          remaining: 0,
          resetTime: Date.now() + 3600000
        }
      };

      expect(rateLimitedResponse.rateLimit.remaining).toBe(0);
      expect(rateLimitedResponse.success).toBe(false);
      expect(rateLimitedResponse.error).toContain('Rate limit');
    });
  });

  describe('ApiResponse serialization', () => {
    it('should support JSON serialization', () => {
      const response: ApiResponse = {
        success: true,
        data: mockQuote,
        error: null,
        source: 'quotable',
        rateLimit: {
          remaining: 40,
          resetTime: Date.now() + 1800000
        }
      };

      const jsonString = JSON.stringify(response);
      const parsedResponse = JSON.parse(jsonString);

      expect(parsedResponse.success).toBe(response.success);
      expect(parsedResponse.data).toEqual(response.data);
      expect(parsedResponse.source).toBe(response.source);
    });
  });
});
