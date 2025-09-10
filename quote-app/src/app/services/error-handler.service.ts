/**
 * ErrorHandler Service - T038 Implementation
 * 
 * Provides centralized error handling with:
 * - Error classification and severity assessment
 * - User-friendly error messages
 * - Error logging with context
 * - Retry mechanisms with exponential backoff
 * - Notification integration
 */

import { Injectable } from '@angular/core';

export type ErrorType = 
  | 'NETWORK_ERROR' 
  | 'API_ERROR' 
  | 'CLIENT_ERROR' 
  | 'VALIDATION_ERROR' 
  | 'CACHE_ERROR' 
  | 'UNKNOWN_ERROR';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorClassification {
  type: ErrorType;
  severity: ErrorSeverity;
  userMessage: string;
  statusCode?: number;
  isRetryable?: boolean;
}

export interface ErrorLogEntry {
  error: Error;
  classification: ErrorClassification;
  timestamp: Date;
  context?: any;
  userAgent?: string;
  url?: string;
}

export interface RetryOptions {
  maxAttempts: number;
  backoffMs?: number;
  retryableErrors?: ErrorType[];
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandler {
  private errorLog: ErrorLogEntry[] = [];
  private readonly MAX_LOG_SIZE = 100;
  
  private readonly ERROR_MESSAGES: Record<ErrorType, string> = {
    NETWORK_ERROR: 'Network connection issue. Please check your internet connection and try again.',
    API_ERROR: 'Server error occurred. Please try again in a moment.',
    CLIENT_ERROR: 'Request failed. Please check your input and try again.',
    VALIDATION_ERROR: 'Invalid data provided. Please check your input.',
    CACHE_ERROR: 'Storage issue encountered. Some features may be limited.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
  };

  constructor() {}

  /**
   * Get the current error log
   */
  getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  /**
   * Get user-friendly error message for a given error type
   */
  getErrorMessage(errorType: ErrorType): string {
    return this.ERROR_MESSAGES[errorType];
  }

  /**
   * Classify an error based on its properties and context
   */
  classifyError(
    error: Error, 
    statusCode?: number | null, 
    context?: { isValidation?: boolean; isCache?: boolean }
  ): ErrorClassification {
    
    // Validation errors
    if (context?.isValidation) {
      return {
        type: 'VALIDATION_ERROR',
        severity: 'low',
        userMessage: this.ERROR_MESSAGES.VALIDATION_ERROR,
        isRetryable: false
      };
    }

    // Cache errors
    if (context?.isCache || this.isCacheError(error)) {
      return {
        type: 'CACHE_ERROR',
        severity: 'medium',
        userMessage: this.ERROR_MESSAGES.CACHE_ERROR,
        isRetryable: false
      };
    }

    // Network errors
    if (this.isNetworkError(error)) {
      return {
        type: 'NETWORK_ERROR',
        severity: 'medium',
        userMessage: this.ERROR_MESSAGES.NETWORK_ERROR,
        isRetryable: true
      };
    }

    // HTTP status code based classification
    if (statusCode) {
      if (statusCode >= 400 && statusCode < 500) {
        return {
          type: 'CLIENT_ERROR',
          severity: 'low',
          userMessage: this.ERROR_MESSAGES.CLIENT_ERROR,
          statusCode,
          isRetryable: statusCode === 429 || statusCode === 408 // Rate limit or timeout
        };
      } else if (statusCode >= 500) {
        return {
          type: 'API_ERROR',
          severity: 'high',
          userMessage: this.ERROR_MESSAGES.API_ERROR,
          statusCode,
          isRetryable: true
        };
      }
    }

    // Default to unknown error
    return {
      type: 'UNKNOWN_ERROR',
      severity: 'medium',
      userMessage: this.ERROR_MESSAGES.UNKNOWN_ERROR,
      isRetryable: false
    };
  }

  /**
   * Log an error with context and classification
   */
  logError(error: Error, context?: any): void {
    const classification = this.classifyError(error, null, context);
    
    const logEntry: ErrorLogEntry = {
      error,
      classification,
      timestamp: new Date(),
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };

    this.errorLog.unshift(logEntry); // Add to beginning

    // Limit log size
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog = this.errorLog.slice(0, this.MAX_LOG_SIZE);
    }

    // Log to console for development
    if (typeof console !== 'undefined') {
      console.error('Error logged:', {
        type: classification.type,
        severity: classification.severity,
        message: error.message,
        context
      });
    }
  }

  /**
   * Handle an error with full processing (classify, log, notify)
   */
  handleError(error: Error, context?: any): ErrorClassification {
    const classification = this.classifyError(error, null, context);
    this.logError(error, context);
    
    // For high severity errors, you might want to send to external logging service
    if (classification.severity === 'high' || classification.severity === 'critical') {
      this.reportCriticalError(error, classification, context);
    }

    return classification;
  }

  /**
   * Retry an operation with exponential backoff
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T> {
    const { maxAttempts, backoffMs = 1000, retryableErrors = ['NETWORK_ERROR', 'API_ERROR'] } = options;
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          break;
        }
        
        // Check if error is retryable
        const classification = this.classifyError(lastError);
        if (!retryableErrors.includes(classification.type)) {
          break;
        }
        
        // Exponential backoff delay
        const delay = backoffMs * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Generate user-friendly error message with context
   */
  formatErrorForUser(error: Error, context?: any): string {
    const classification = this.classifyError(error, null, context);
    let message = classification.userMessage;
    
    // Add specific context if available
    if (context?.component) {
      message += ` (${context.component})`;
    }
    
    return message;
  }

  /**
   * Clear the error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: number; // Last hour
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: 0
    };

    // Initialize counters
    Object.values(['NETWORK_ERROR', 'API_ERROR', 'CLIENT_ERROR', 'VALIDATION_ERROR', 'CACHE_ERROR', 'UNKNOWN_ERROR'] as ErrorType[])
      .forEach((type: ErrorType) => stats.byType[type] = 0);
    
    Object.values(['low', 'medium', 'high', 'critical'] as ErrorSeverity[])
      .forEach((severity: ErrorSeverity) => stats.bySeverity[severity] = 0);

    // Count errors
    this.errorLog.forEach((entry: ErrorLogEntry) => {
      stats.byType[entry.classification.type]++;
      stats.bySeverity[entry.classification.severity]++;
      
      if (entry.timestamp > oneHourAgo) {
        stats.recent++;
      }
    });

    return stats;
  }

  /**
   * Private helper methods
   */
  private isNetworkError(error: Error): boolean {
    return error.name === 'NetworkError' ||
           error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('fetch') ||
           error.message.toLowerCase().includes('connection');
  }

  private isCacheError(error: Error): boolean {
    return error.message.toLowerCase().includes('localstorage') ||
           error.message.toLowerCase().includes('quota') ||
           error.message.toLowerCase().includes('storage') ||
           error.message.toLowerCase().includes('indexeddb');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private reportCriticalError(error: Error, classification: ErrorClassification, context?: any): void {
    // In a real app, this would send to external logging service
    console.error('CRITICAL ERROR REPORTED:', {
      error: error.message,
      stack: error.stack,
      classification,
      context,
      timestamp: new Date().toISOString()
    });
  }
}
