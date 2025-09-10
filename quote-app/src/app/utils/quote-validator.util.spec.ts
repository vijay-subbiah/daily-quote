/**
 * T013: Quote Validation Utility Tests
 * 
 * IMPORTANT: This test MUST fail initially as the QuoteValidator utility doesn't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Tests the quote validation utility that ensures quotes meet quality standards.
 */

import { QuoteValidator } from '../utils/quote-validator.util';
import { Quote } from '../models/quote.interface';

describe('QuoteValidator Utility', () => {
  describe('isValidQuote method', () => {
    it('should return true for valid quotes with all required fields', () => {
      const validQuote: Quote = {
        id: 'q1',
        text: 'Life is what happens to you while you are busy making other plans.',
        author: 'John Lennon',
        source: 'quotegarden',
        category: 'life',
        tags: ['life', 'planning'],
        length: 66,
        dateAdded: new Date('2024-01-01'),
        popularity: 85,
        verified: true
      };

      expect(QuoteValidator.isValidQuote(validQuote)).toBe(true);
    });

    it('should return false for quotes with missing required fields', () => {
      const incompleteQuote = {
        id: 'q2',
        text: 'Some quote text'
        // Missing author, source, etc.
      } as Quote;

      expect(QuoteValidator.isValidQuote(incompleteQuote)).toBe(false);
    });

    it('should return false for quotes with empty text', () => {
      const emptyTextQuote: Quote = {
        id: 'q3',
        text: '',
        author: 'Someone',
        source: 'quotegarden',
        category: 'unknown',
        tags: [],
        length: 0,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      expect(QuoteValidator.isValidQuote(emptyTextQuote)).toBe(false);
    });

    it('should return false for quotes with empty author', () => {
      const emptyAuthorQuote: Quote = {
        id: 'q4',
        text: 'Some meaningful text',
        author: '',
        source: 'quotegarden',
        category: 'unknown',
        tags: [],
        length: 20,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      expect(QuoteValidator.isValidQuote(emptyAuthorQuote)).toBe(false);
    });

    it('should return false for quotes that are too short', () => {
      const shortQuote: Quote = {
        id: 'q5',
        text: 'Hi',
        author: 'Someone',
        source: 'quotegarden',
        category: 'unknown',
        tags: [],
        length: 2,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      expect(QuoteValidator.isValidQuote(shortQuote)).toBe(false);
    });

    it('should return false for quotes that are too long', () => {
      const longText = 'A'.repeat(501); // Over 500 character limit
      const longQuote: Quote = {
        id: 'q6',
        text: longText,
        author: 'Someone',
        source: 'quotegarden',
        category: 'unknown',
        tags: [],
        length: 501,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      expect(QuoteValidator.isValidQuote(longQuote)).toBe(false);
    });
  });

  describe('sanitizeQuote method', () => {
    it('should trim whitespace from text and author', () => {
      const dirtyQuote: Quote = {
        id: 'q7',
        text: '  Life is beautiful  ',
        author: '  John Doe  ',
        source: 'quotegarden',
        category: 'life',
        tags: ['life'],
        length: 17,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      const sanitized = QuoteValidator.sanitizeQuote(dirtyQuote);
      expect(sanitized.text).toBe('Life is beautiful');
      expect(sanitized.author).toBe('John Doe');
    });

    it('should remove excessive quotes and punctuation', () => {
      const messyQuote: Quote = {
        id: 'q8',
        text: '""Life is beautiful""',
        author: 'John Doe.',
        source: 'quotegarden',
        category: 'life',
        tags: ['life'],
        length: 20,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      const sanitized = QuoteValidator.sanitizeQuote(messyQuote);
      expect(sanitized.text).toBe('Life is beautiful');
      expect(sanitized.author).toBe('John Doe');
    });

    it('should update length after sanitization', () => {
      const quote: Quote = {
        id: 'q9',
        text: '  Life is beautiful  ',
        author: 'John Doe',
        source: 'quotegarden',
        category: 'life',
        tags: ['life'],
        length: 21, // Original length with spaces
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      const sanitized = QuoteValidator.sanitizeQuote(quote);
      expect(sanitized.length).toBe(17); // Updated length without spaces
    });

    it('should preserve other quote properties', () => {
      const originalQuote: Quote = {
        id: 'q10',
        text: '  Life is beautiful  ',
        author: '  John Doe  ',
        source: 'quotegarden',
        category: 'life',
        tags: ['life', 'beauty'],
        length: 21,
        dateAdded: new Date('2024-01-01'),
        popularity: 85,
        verified: true
      };

      const sanitized = QuoteValidator.sanitizeQuote(originalQuote);
      expect(sanitized.id).toBe('q10');
      expect(sanitized.source).toBe('quotegarden');
      expect(sanitized.category).toBe('life');
      expect(sanitized.tags).toEqual(['life', 'beauty']);
      expect(sanitized.dateAdded).toEqual(new Date('2024-01-01'));
      expect(sanitized.popularity).toBe(85);
      expect(sanitized.verified).toBe(true);
    });
  });

  describe('validateQuoteCollection method', () => {
    it('should return validation summary for valid quotes', () => {
      const quotes: Quote[] = [
        {
          id: 'q1',
          text: 'Life is beautiful',
          author: 'John Doe',
          source: 'quotegarden',
          category: 'life',
          tags: ['life'],
          length: 17,
          dateAdded: new Date(),
          popularity: 0,
          verified: false
        },
        {
          id: 'q2',
          text: 'Code is poetry',
          author: 'Jane Smith',
          source: 'quotable',
          category: 'technology',
          tags: ['coding'],
          length: 14,
          dateAdded: new Date(),
          popularity: 0,
          verified: false
        }
      ];

      const validation = QuoteValidator.validateQuoteCollection(quotes);
      expect(validation.totalQuotes).toBe(2);
      expect(validation.validQuotes).toBe(2);
      expect(validation.invalidQuotes).toBe(0);
      expect(validation.duplicateIds).toBe(0);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect duplicate IDs', () => {
      const quotes: Quote[] = [
        {
          id: 'q1',
          text: 'Life is beautiful',
          author: 'John Doe',
          source: 'quotegarden',
          category: 'life',
          tags: ['life'],
          length: 17,
          dateAdded: new Date(),
          popularity: 0,
          verified: false
        },
        {
          id: 'q1', // Duplicate ID
          text: 'Code is poetry',
          author: 'Jane Smith',
          source: 'quotable',
          category: 'technology',
          tags: ['coding'],
          length: 14,
          dateAdded: new Date(),
          popularity: 0,
          verified: false
        }
      ];

      const validation = QuoteValidator.validateQuoteCollection(quotes);
      expect(validation.duplicateIds).toBe(1);
      expect(validation.errors).toContain('Duplicate quote ID found: q1');
    });

    it('should count invalid quotes correctly', () => {
      const quotes: Quote[] = [
        {
          id: 'q1',
          text: 'Life is beautiful',
          author: 'John Doe',
          source: 'quotegarden',
          category: 'life',
          tags: ['life'],
          length: 17,
          dateAdded: new Date(),
          popularity: 0,
          verified: false
        },
        {
          id: 'q2',
          text: '', // Invalid - empty text
          author: 'Jane Smith',
          source: 'quotable',
          category: 'technology',
          tags: ['coding'],
          length: 0,
          dateAdded: new Date(),
          popularity: 0,
          verified: false
        }
      ];

      const validation = QuoteValidator.validateQuoteCollection(quotes);
      expect(validation.totalQuotes).toBe(2);
      expect(validation.validQuotes).toBe(1);
      expect(validation.invalidQuotes).toBe(1);
    });
  });

  describe('generateQuoteId method', () => {
    it('should generate unique IDs based on text and author', () => {
      const quote1: Omit<Quote, 'id'> = {
        text: 'Life is beautiful',
        author: 'John Doe',
        source: 'quotegarden',
        category: 'life',
        tags: ['life'],
        length: 17,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      const quote2: Omit<Quote, 'id'> = {
        text: 'Code is poetry',
        author: 'Jane Smith',
        source: 'quotable',
        category: 'technology',
        tags: ['coding'],
        length: 14,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      const id1 = QuoteValidator.generateQuoteId(quote1);
      const id2 = QuoteValidator.generateQuoteId(quote2);

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('should generate consistent IDs for same text and author', () => {
      const quote: Omit<Quote, 'id'> = {
        text: 'Life is beautiful',
        author: 'John Doe',
        source: 'quotegarden',
        category: 'life',
        tags: ['life'],
        length: 17,
        dateAdded: new Date(),
        popularity: 0,
        verified: false
      };

      const id1 = QuoteValidator.generateQuoteId(quote);
      const id2 = QuoteValidator.generateQuoteId(quote);

      expect(id1).toBe(id2);
    });
  });
});
