/**
 * App State Interface Implementation
 * T028: Global application state management interface
 */

import { Quote } from './quote.interface';

export interface AppState {
  // Quote data
  currentQuote: Quote | null;
  quotesHistory: Quote[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // User preferences
  preferences: UserPreferences;
  
  // Network state
  isOnline: boolean;
  lastSyncTime: Date | null;
  
  // Cache state
  cacheSize: number;
  cacheLastCleared: Date | null;
  
  // Analytics
  sessionId: string;
  quotesViewed: number;
  quotesShared: number;
  quotesCopied: number;
}

export interface UserPreferences {
  // Display preferences
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  animation: boolean;
  
  // Content preferences
  categories: string[];
  excludeCategories: string[];
  minQuoteLength: number;
  maxQuoteLength: number;
  
  // Accessibility
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  
  // Privacy
  analytics: boolean;
  shareUsage: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number; // 0-100
}

export interface ErrorState {
  hasError: boolean;
  errorCode?: string;
  errorMessage?: string;
  isRetryable?: boolean;
  retryCount?: number;
  lastErrorTime?: Date;
}

export interface NetworkState {
  isOnline: boolean;
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  downlink: number; // Mbps
  rtt: number; // ms
}

/**
 * Initial state factory
 */
export function createInitialAppState(): AppState {
  return {
    currentQuote: null,
    quotesHistory: [],
    isLoading: false,
    error: null,
    preferences: createDefaultPreferences(),
    isOnline: navigator.onLine,
    lastSyncTime: null,
    cacheSize: 0,
    cacheLastCleared: null,
    sessionId: generateSessionId(),
    quotesViewed: 0,
    quotesShared: 0,
    quotesCopied: 0
  };
}

export function createDefaultPreferences(): UserPreferences {
  return {
    theme: 'auto',
    fontSize: 'medium',
    animation: true,
    categories: [],
    excludeCategories: [],
    minQuoteLength: 10,
    maxQuoteLength: 150,
    highContrast: false,
    reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    screenReader: false,
    analytics: true,
    shareUsage: true
  };
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * State update helpers
 */
export function updateAppState(
  currentState: AppState, 
  updates: Partial<AppState>
): AppState {
  return {
    ...currentState,
    ...updates
  };
}

export function updatePreferences(
  currentPreferences: UserPreferences,
  updates: Partial<UserPreferences>
): UserPreferences {
  return {
    ...currentPreferences,
    ...updates
  };
}

/**
 * Type guards
 */
export function isValidAppState(obj: any): obj is AppState {
  return (
    obj &&
    typeof obj.isLoading === 'boolean' &&
    typeof obj.isOnline === 'boolean' &&
    typeof obj.sessionId === 'string' &&
    Array.isArray(obj.quotesHistory)
  );
}
