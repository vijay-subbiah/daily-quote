import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, EMPTY } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { Quote, createQuote } from '../models/quote.interface';
import { ApiResponse } from '../models/api-response.interface';
import { CacheService } from './cache.service';
import { ErrorHandler } from './error-handler.service';

interface QuoteServiceState {
  currentQuote: Quote | null;
  loading: boolean;
  error: string | null;
  cache: any[];
  apiCallCount: number;
  lastFetch: Date | null;
}

interface QuoteGardenResponse {
  statusCode: number;
  message: string;
  pagination: {
    currentPage: number;
    nextPage: number | null;
    totalPages: number;
  };
  data: {
    _id: string;
    quoteText: string;
    quoteAuthor: string;
    quoteGenre: string;
    __v: number;
  }[];
}

interface QuotableResponse {
  _id: string;
  content: string;
  author: string;
  tags: string[];
  length: number;
}

interface ZenQuotesResponse {
  q: string;
  a: string;
  h: string;
}

interface DummyJSONResponse {
  id: number;
  quote: string;
  author: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private http = inject(HttpClient);
  private cacheService = inject(CacheService);
  private errorHandler = inject(ErrorHandler);

  // Signal-based state management
  private _state = signal<QuoteServiceState>({
    currentQuote: null,
    loading: false,
    error: null,
    cache: [],
    apiCallCount: 0,
    lastFetch: null
  });

  // Computed signals for reactive state access
  readonly state = computed(() => this._state());
  readonly currentQuote = computed(() => this._state().currentQuote);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);

  // API endpoints
  private readonly quoteGardenUrl = 'https://api.quotable.io/random'; // Updated to use reliable API
  private readonly quotableUrl = 'https://api.quotable.io/random?maxLength=150';
  private readonly zenQuotesUrl = 'https://zenquotes.io/api/random';

  // Local fallback quotes
  private readonly localQuotes: Quote[] = [
    createQuote({
      id: 'local-1',
      text: 'The only way to do great work is to love what you do.',
      author: 'Steve Jobs',
      source: 'local'
    }),
    createQuote({
      id: 'local-2',
      text: 'Innovation distinguishes between a leader and a follower.',
      author: 'Steve Jobs',
      source: 'local'
    }),
    createQuote({
      id: 'local-3',
      text: 'Life is what happens to you while you\'re busy making other plans.',
      author: 'John Lennon',
      source: 'local'
    }),
    createQuote({
      id: 'local-4',
      text: 'The future belongs to those who believe in the beauty of their dreams.',
      author: 'Eleanor Roosevelt',
      source: 'local'
    }),
    createQuote({
      id: 'local-5',
      text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
      author: 'Winston Churchill',
      source: 'local'
    })
  ];

  constructor() {
    // Initialize cache from storage
    this.loadCacheFromStorage().catch(error => {
      console.warn('Failed to load cache from storage:', error);
    });
  }

  /**
   * Get current state snapshot
   */
  getState(): QuoteServiceState {
    return this._state();
  }

  /**
   * Fetch a random quote with fallback strategy
   * Primary: DummyJSON API -> Secondary: ZenQuotes API -> Fallback: Local
   */
  async fetchRandomQuote(): Promise<ApiResponse<Quote>> {
    this.updateState({ loading: true, error: null });
    this.incrementApiCallCount();

    try {
      // Try primary API (DummyJSON)
      const dummyJSONResult = await this.fetchFromDummyJSON();
      if (dummyJSONResult.success && dummyJSONResult.data) {
        return await this.handleSuccessfulFetch(dummyJSONResult.data);
      }

      // Try secondary API (ZenQuotes)
      const zenQuotesResult = await this.fetchFromZenQuotes();
      if (zenQuotesResult.success && zenQuotesResult.data) {
        return await this.handleSuccessfulFetch(zenQuotesResult.data);
      }

      // Fallback to local quotes
      const localQuote = this.getLocalFallbackQuote();
      if (localQuote) {
        return await this.handleSuccessfulFetch(localQuote);
      }

      // All sources failed
      const error = 'All quote sources unavailable. Please try again later.';
      this.updateState({ 
        loading: false, 
        error 
      });
      
      return {
        success: false,
        status: 500,
        timestamp: new Date(),
        error: {
          code: 'ALL_SOURCES_FAILED',
          message: error
        }
      };

    } catch (error) {
      const errorClassification = this.errorHandler.handleError(error as Error);
      this.updateState({ 
        loading: false, 
        error: errorClassification.userMessage 
      });
      
      return {
        success: false,
        status: 500,
        timestamp: new Date(),
        error: {
          code: errorClassification.type,
          message: errorClassification.userMessage
        }
      };
    }
  }

  /**
   * Get a random local fallback quote
   */
  getLocalFallbackQuote(): Quote | null {
    if (this.localQuotes.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * this.localQuotes.length);
    return this.localQuotes[randomIndex];
  }

  /**
   * Fetch quote from QuoteGarden API
   */
  private fetchFromQuoteGarden(): Promise<ApiResponse<Quote>> {
    return new Promise((resolve) => {
      this.http.get<QuoteGardenResponse>(this.quoteGardenUrl)
        .pipe(
          map(response => this.transformQuoteGardenResponse(response)),
          catchError(error => {
            this.errorHandler.logError(error as Error, { source: 'QuoteGarden' });
            return of({
              success: false,
              status: 500,
              timestamp: new Date(),
              error: {
                code: 'API_ERROR',
                message: 'QuoteGarden API unavailable'
              }
            });
          })
        )
        .subscribe(result => resolve(result));
    });
  }

  /**
   * Fetch quote from Quotable API
   */
  private fetchFromQuotable(): Promise<ApiResponse<Quote>> {
    return new Promise((resolve) => {
      this.http.get<QuotableResponse>(this.quotableUrl)
        .pipe(
          map(response => this.transformQuotableResponse(response)),
          catchError(error => {
            this.errorHandler.logError(error as Error, { source: 'Quotable' });
            return of({
              success: false,
              status: 500,
              timestamp: new Date(),
              error: {
                code: 'API_ERROR',
                message: 'Quotable API unavailable'
              }
            });
          })
        )
        .subscribe(result => resolve(result));
    });
  }

  /**
   * Fetch quote from DummyJSON API
   */
  private fetchFromDummyJSON(): Promise<ApiResponse<Quote>> {
    return new Promise((resolve) => {
      this.http.get<DummyJSONResponse>('https://dummyjson.com/quotes/random')
        .pipe(
          map(response => this.transformDummyJSONResponse(response)),
          catchError(error => {
            this.errorHandler.logError(error as Error, { source: 'DummyJSON' });
            return of({
              success: false,
              status: 500,
              timestamp: new Date(),
              error: {
                code: 'API_ERROR',
                message: 'DummyJSON API unavailable'
              }
            });
          })
        )
        .subscribe(result => resolve(result));
    });
  }

  /**
   * Fetch quote from ZenQuotes API
   */
  private fetchFromZenQuotes(): Promise<ApiResponse<Quote>> {
    return new Promise((resolve) => {
      this.http.get<ZenQuotesResponse[]>(this.zenQuotesUrl)
        .pipe(
          map(response => this.transformZenQuotesResponse(response)),
          catchError(error => {
            this.errorHandler.logError(error as Error, { source: 'ZenQuotes' });
            return of({
              success: false,
              status: 500,
              timestamp: new Date(),
              error: {
                code: 'API_ERROR',
                message: 'ZenQuotes API unavailable'
              }
            });
          })
        )
        .subscribe(result => resolve(result));
    });
  }

  /**
   * Transform DummyJSON API response to our Quote format
   */
  private transformDummyJSONResponse(response: DummyJSONResponse): ApiResponse<Quote> {
    try {
      const quote = createQuote({
        id: response.id.toString(),
        text: response.quote,
        author: response.author,
        source: 'dummyjson'
      });

      return {
        success: true,
        status: 200,
        timestamp: new Date(),
        data: quote
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        timestamp: new Date(),
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse DummyJSON response'
        }
      };
    }
  }

  /**
   * Transform QuoteGarden API response to our Quote format
   */
  private transformQuoteGardenResponse(response: QuoteGardenResponse): ApiResponse<Quote> {
    try {
      if (!response.data || response.data.length === 0) {
        return {
          success: false,
          status: 204,
          timestamp: new Date(),
          error: {
            code: 'NO_DATA',
            message: 'No quote data received'
          }
        };
      }

      const quoteData = response.data[0];
      const quote = createQuote({
        id: quoteData._id,
        text: quoteData.quoteText.replace(/^"|"$/g, ''), // Remove surrounding quotes
        author: quoteData.quoteAuthor,
        source: 'quotegarden',
        category: quoteData.quoteGenre
      });

      return {
        success: true,
        status: 200,
        timestamp: new Date(),
        data: quote
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        timestamp: new Date(),
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse QuoteGarden response'
        }
      };
    }
  }

  /**
   * Transform Quotable API response to our Quote format
   */
  private transformQuotableResponse(response: QuotableResponse): ApiResponse<Quote> {
    try {
      const quote = createQuote({
        id: response._id,
        text: response.content,
        author: response.author,
        source: 'quotable',
        category: response.tags.join(', ')
      });

      return {
        success: true,
        status: 200,
        timestamp: new Date(),
        data: quote
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        timestamp: new Date(),
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse Quotable response'
        }
      };
    }
  }

  /**
   * Transform ZenQuotes API response to our Quote format
   */
  private transformZenQuotesResponse(response: ZenQuotesResponse[]): ApiResponse<Quote> {
    try {
      if (!response || response.length === 0) {
        return {
          success: false,
          status: 204,
          timestamp: new Date(),
          error: {
            code: 'NO_DATA',
            message: 'No quote data received from ZenQuotes'
          }
        };
      }

      const quoteData = response[0];
      const quote = createQuote({
        id: `zen-${Date.now()}`, // Generate ID since ZenQuotes doesn't provide one
        text: quoteData.q,
        author: quoteData.a,
        source: 'zenquotes'
      });

      return {
        success: true,
        status: 200,
        timestamp: new Date(),
        data: quote
      };
    } catch (error) {
      return {
        success: false,
        status: 500,
        timestamp: new Date(),
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse ZenQuotes response'
        }
      };
    }
  }

  /**
   * Handle successful quote fetch
   */
  private async handleSuccessfulFetch(quote: Quote): Promise<ApiResponse<Quote>> {
    // Add to cache
    await this.cacheService.cacheQuote(quote);
    
    // Update state
    this.updateState({
      currentQuote: quote,
      loading: false,
      error: null,
      lastFetch: new Date()
    });

    return {
      success: true,
      status: 200,
      timestamp: new Date(),
      data: quote
    };
  }

  /**
   * Update state with partial updates
   */
  private updateState(updates: Partial<QuoteServiceState>): void {
    const currentState = this._state();
    this._state.set({
      ...currentState,
      ...updates
    });
  }

  /**
   * Increment API call counter
   */
  private incrementApiCallCount(): void {
    const currentState = this._state();
    this.updateState({
      apiCallCount: currentState.apiCallCount + 1
    });
  }

  /**
   * Load cache from storage
   */
  private async loadCacheFromStorage(): Promise<void> {
    const cacheData = await this.cacheService.getAllCachedQuotes();
    this.updateState({
      cache: cacheData
    });
  }
}
