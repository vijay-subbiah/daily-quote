/**
 * Quote Validator Utility Implementation
 * T029: Utility functions for quote validation and processing
 */

import { Quote, createQuote } from '../models/quote.interface';

export class QuoteValidator {
  private static readonly MIN_LENGTH = 10;
  private static readonly MAX_LENGTH = 150;
  private static readonly VALID_SOURCES = ['quotegarden', 'quotable', 'local'] as const;

  /**
   * Validates a complete quote object
   */
  static validateQuote(quote: Quote): ValidationResult {
    const errors: string[] = [];

    // Validate required fields
    if (!quote.id || typeof quote.id !== 'string') {
      errors.push('Quote ID is required and must be a string');
    }

    if (!quote.text || typeof quote.text !== 'string') {
      errors.push('Quote text is required and must be a string');
    } else {
      const textValidation = this.validateText(quote.text);
      if (!textValidation.isValid) {
        errors.push(...textValidation.errors);
      }
    }

    if (!quote.author || typeof quote.author !== 'string') {
      errors.push('Quote author is required and must be a string');
    } else {
      const authorValidation = this.validateAuthor(quote.author);
      if (!authorValidation.isValid) {
        errors.push(...authorValidation.errors);
      }
    }

    if (!this.VALID_SOURCES.includes(quote.source as any)) {
      errors.push(`Quote source must be one of: ${this.VALID_SOURCES.join(', ')}`);
    }

    // Validate computed length
    if (quote.text && quote.length !== quote.text.length) {
      errors.push('Quote length must match text length');
    }

    // Validate optional fields
    if (quote.category && typeof quote.category !== 'string') {
      errors.push('Quote category must be a string');
    }

    if (quote.tags && !Array.isArray(quote.tags)) {
      errors.push('Quote tags must be an array');
    } else if (quote.tags) {
      const tagsValidation = this.validateTags(quote.tags);
      if (!tagsValidation.isValid) {
        errors.push(...tagsValidation.errors);
      }
    }

    if (quote.popularity !== undefined) {
      const popularityValidation = this.validatePopularity(quote.popularity);
      if (!popularityValidation.isValid) {
        errors.push(...popularityValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: this.generateWarnings(quote)
    };
  }

  /**
   * Convenience method to check if a quote is valid
   */
  static isValidQuote(quote: Quote): boolean {
    const result = this.validateQuote(quote);
    // For debugging: console.log('Validation result:', result);
    return result.isValid;
  }

  /**
   * Validates quote text content
   */
  static validateText(text: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!text || typeof text !== 'string') {
      errors.push('Text is required and must be a string');
      return { isValid: false, errors, warnings };
    }

    // Length validation
    const trimmedText = text.trim();
    if (trimmedText.length < this.MIN_LENGTH) {
      errors.push(`Text must be at least ${this.MIN_LENGTH} characters long`);
    }

    if (trimmedText.length > this.MAX_LENGTH) {
      errors.push(`Text must be no more than ${this.MAX_LENGTH} characters long`);
    }

    // Content quality checks
    if (trimmedText !== text) {
      warnings.push('Text contains leading or trailing whitespace');
    }

    if (this.hasExcessiveRepetition(trimmedText)) {
      warnings.push('Text contains excessive character repetition');
    }

    if (this.isAllCaps(trimmedText)) {
      warnings.push('Text is entirely in uppercase');
    }

    if (!this.hasProperPunctuation(trimmedText)) {
      warnings.push('Text may be missing proper punctuation');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates quote author
   */
  static validateAuthor(author: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!author || typeof author !== 'string') {
      errors.push('Author is required and must be a string');
      return { isValid: false, errors, warnings };
    }

    const trimmedAuthor = author.trim();
    if (trimmedAuthor.length === 0) {
      errors.push('Author cannot be empty');
    }

    if (trimmedAuthor.length > 100) {
      errors.push('Author name cannot exceed 100 characters');
    }

    // Quality checks
    if (trimmedAuthor !== author) {
      warnings.push('Author contains leading or trailing whitespace');
    }

    if (!/^[a-zA-Z\s\-'.]+$/.test(trimmedAuthor)) {
      warnings.push('Author contains unusual characters');
    }

    if (trimmedAuthor.toLowerCase() === 'unknown' || trimmedAuthor.toLowerCase() === 'anonymous') {
      warnings.push('Consider providing a more specific author attribution');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates quote tags
   */
  static validateTags(tags: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(tags)) {
      errors.push('Tags must be an array');
      return { isValid: false, errors, warnings };
    }

    if (tags.length > 10) {
      warnings.push('Consider limiting tags to 10 or fewer for better organization');
    }

    const seenTags = new Set<string>();
    
    for (const tag of tags) {
      if (typeof tag !== 'string') {
        errors.push('All tags must be strings');
        continue;
      }

      const normalizedTag = tag.toLowerCase().trim();
      
      if (normalizedTag.length === 0) {
        errors.push('Tags cannot be empty');
        continue;
      }

      if (normalizedTag.length > 50) {
        errors.push('Tags cannot exceed 50 characters');
        continue;
      }

      if (seenTags.has(normalizedTag)) {
        warnings.push(`Duplicate tag found: ${tag}`);
        continue;
      }

      seenTags.add(normalizedTag);

      if (!/^[a-zA-Z0-9\s\-]+$/.test(normalizedTag)) {
        warnings.push(`Tag contains special characters: ${tag}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates popularity score
   */
  static validatePopularity(popularity: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof popularity !== 'number') {
      errors.push('Popularity must be a number');
      return { isValid: false, errors, warnings };
    }

    if (!Number.isFinite(popularity)) {
      errors.push('Popularity must be a finite number');
      return { isValid: false, errors, warnings };
    }

    if (popularity < 0 || popularity > 100) {
      errors.push('Popularity must be between 0 and 100');
    }

    if (popularity % 1 !== 0) {
      warnings.push('Popularity should typically be a whole number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitizes and normalizes quote data
   */
  static sanitizeQuote(rawQuote: any): Quote {
    const sanitized = {
      id: this.sanitizeString(rawQuote.id) || `quote_${Date.now()}`,
      text: this.sanitizeText(rawQuote.text || rawQuote.quoteText || rawQuote.content) || '',
      author: this.sanitizeString(rawQuote.author || rawQuote.quoteAuthor) || 'Unknown',
      source: this.sanitizeSource(rawQuote.source),
      category: this.sanitizeString(rawQuote.category || rawQuote.quoteGenre),
      tags: this.sanitizeTags(rawQuote.tags),
      popularity: this.sanitizeNumber(rawQuote.popularity, 0, 100),
      verified: Boolean(rawQuote.verified),
      dateAdded: rawQuote.dateAdded ? new Date(rawQuote.dateAdded) : undefined
    };

    return createQuote(sanitized);
  }

  /**
   * Private helper methods
   */
  private static sanitizeString(value: any): string | undefined {
    if (typeof value === 'string') {
      return value.trim().replace(/[.!?]+$/, ''); // Remove trailing punctuation
    }
    return undefined;
  }

  private static sanitizeText(value: any): string {
    if (typeof value === 'string') {
      return value.trim()
        .replace(/^["']+|["']+$/g, '') // Remove leading/trailing quotes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[""]/g, '"') // Normalize quotes
        .replace(/['']/g, "'"); // Normalize apostrophes
    }
    return '';
  }

  private static sanitizeSource(value: any): Quote['source'] {
    if (this.VALID_SOURCES.includes(value)) {
      return value;
    }
    return 'local';
  }

  private static sanitizeTags(value: any): string[] | undefined {
    if (Array.isArray(value)) {
      return value
        .filter(tag => typeof tag === 'string')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .slice(0, 10); // Limit to 10 tags
    }
    return undefined;
  }

  private static sanitizeNumber(value: any, min: number, max: number): number | undefined {
    const num = Number(value);
    if (Number.isFinite(num) && num >= min && num <= max) {
      return Math.round(num);
    }
    return undefined;
  }

  private static hasExcessiveRepetition(text: string): boolean {
    // Check for more than 3 consecutive identical characters
    return /(.)\1{3,}/.test(text);
  }

  private static isAllCaps(text: string): boolean {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    return letters.length > 0 && letters === letters.toUpperCase();
  }

  private static hasProperPunctuation(text: string): boolean {
    // Basic check for ending punctuation
    return /[.!?]$/.test(text.trim());
  }

  /**
   * Validates a collection of quotes
   */
  static validateQuoteCollection(quotes: Quote[]): QuoteCollectionValidation {
    const validation: QuoteCollectionValidation = {
      totalQuotes: quotes.length,
      validQuotes: 0,
      invalidQuotes: 0,
      duplicateIds: 0,
      errors: [],
      warnings: []
    };

    const seenIds = new Set<string>();

    for (const quote of quotes) {
      // Check for duplicates
      if (seenIds.has(quote.id)) {
        validation.duplicateIds++;
        validation.errors.push(`Duplicate quote ID found: ${quote.id}`);
      } else {
        seenIds.add(quote.id);
      }

      // Validate individual quote
      const quoteValidation = this.validateQuote(quote);
      if (quoteValidation.isValid) {
        validation.validQuotes++;
      } else {
        validation.invalidQuotes++;
        validation.errors.push(...quoteValidation.errors.map(error => 
          `Quote ${quote.id}: ${error}`
        ));
      }

      validation.warnings.push(...quoteValidation.warnings.map(warning => 
        `Quote ${quote.id}: ${warning}`
      ));
    }

    return validation;
  }

  /**
   * Generates a unique ID for a quote based on text and author
   */
  static generateQuoteId(quote: { text: string; author: string }): string {
    const combined = `${quote.text}${quote.author}`.toLowerCase().replace(/\s+/g, '');
    let hash = 0;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `quote_${Math.abs(hash).toString(36)}`;
  }

  private static generateWarnings(quote: Quote): string[] {
    const warnings: string[] = [];

    if (quote.text.length < 20) {
      warnings.push('Quote is quite short - consider if it provides sufficient value');
    }

    if (quote.text.length > 120) {
      warnings.push('Quote is quite long - consider if it can be more concise');
    }

    if (!quote.category && !quote.tags?.length) {
      warnings.push('Quote has no category or tags - consider adding for better organization');
    }

    if (!quote.verified) {
      warnings.push('Quote attribution is not verified');
    }

    return warnings;
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface QuoteCollectionValidation {
  totalQuotes: number;
  validQuotes: number;
  invalidQuotes: number;
  duplicateIds: number;
  errors: string[];
  warnings: string[];
}

/**
 * Convenience functions
 */
export function isValidQuote(quote: Quote): boolean {
  return QuoteValidator.validateQuote(quote).isValid;
}

export function validateQuoteText(text: string): boolean {
  return QuoteValidator.validateText(text).isValid;
}

export function sanitizeQuoteFromAPI(apiData: any): Quote {
  return QuoteValidator.sanitizeQuote(apiData);
}
