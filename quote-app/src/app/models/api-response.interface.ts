/**
 * API Response Interface Implementation
 * T028: Interface for external quote API responses
 */

import { Quote } from './quote.interface';

export interface ApiResponse<T = Quote> {
  // Response metadata
  success: boolean;
  status: number;
  message?: string;
  
  // Response timing
  timestamp: Date;
  requestId?: string;
  
  // Data payload
  data?: T;
  quote?: Quote; // For QuoteGarden/Quotable compatibility
  
  // Pagination (for future multi-quote APIs)
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
  
  // Error details
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  // Rate limiting info
  rateLimit?: {
    remaining: number;
    reset: Date;
    total: number;
  };
}

/**
 * QuoteGarden API specific response format
 */
export interface QuoteGardenResponse {
  statusCode: number;
  message: string;
  pagination: {
    currentPage: number;
    nextPage: number | null;
    totalPages: number;
  };
  totalQuotes: number;
  data: {
    _id: string;
    quoteText: string;
    quoteAuthor: string;
    quoteGenre: string;
    __v: number;
  }[];
}

/**
 * Quotable API specific response format
 */
export interface QuotableResponse {
  _id: string;
  content: string;
  author: string;
  tags: string[];
  authorSlug: string;
  length: number;
  dateAdded: string;
  dateModified: string;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  success: false;
  status: number;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

/**
 * Type guards for API responses
 */
export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return (
    obj &&
    typeof obj.success === 'boolean' &&
    typeof obj.status === 'number' &&
    obj.timestamp instanceof Date
  );
}

export function isQuoteGardenResponse(obj: any): obj is QuoteGardenResponse {
  return (
    obj &&
    typeof obj.statusCode === 'number' &&
    Array.isArray(obj.data) &&
    obj.data.every((item: any) => 
      item._id && item.quoteText && item.quoteAuthor
    )
  );
}

export function isQuotableResponse(obj: any): obj is QuotableResponse {
  return (
    obj &&
    typeof obj._id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.author === 'string' &&
    Array.isArray(obj.tags)
  );
}
