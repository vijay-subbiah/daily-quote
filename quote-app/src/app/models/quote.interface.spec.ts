import { Quote } from './quote.interface';

describe('Quote Interface Contract', () => {
  describe('Quote structure validation', () => {
    it('should have required properties with correct types', () => {
      // This test MUST FAIL initially as Quote interface doesn't exist yet
      const mockQuote: Quote = {
        id: 'test-123',
        text: 'The only way to do great work is to love what you do.',
        author: 'Steve Jobs',
        source: 'quotegarden',
        length: 54
      };

      expect(mockQuote.id).toBeDefined();
      expect(typeof mockQuote.id).toBe('string');
      expect(mockQuote.text).toBeDefined();
      expect(typeof mockQuote.text).toBe('string');
      expect(mockQuote.author).toBeDefined();
      expect(typeof mockQuote.author).toBe('string');
      expect(mockQuote.source).toBeDefined();
      expect(['quotegarden', 'quotable', 'local']).toContain(mockQuote.source);
      expect(mockQuote.length).toBeDefined();
      expect(typeof mockQuote.length).toBe('number');
    });

    it('should allow optional category property', () => {
      const quoteWithCategory: Quote = {
        id: 'test-456',
        text: 'Innovation distinguishes between a leader and a follower.',
        author: 'Steve Jobs',
        source: 'local',
        category: 'leadership',
        length: 60
      };

      expect(quoteWithCategory.category).toBe('leadership');
      expect(typeof quoteWithCategory.category).toBe('string');
    });

    it('should work without optional category property', () => {
      const quoteWithoutCategory: Quote = {
        id: 'test-789',
        text: 'Be yourself; everyone else is already taken.',
        author: 'Oscar Wilde',
        source: 'quotable',
        length: 42
      };

      expect(quoteWithoutCategory.category).toBeUndefined();
    });
  });

  describe('Quote content validation', () => {
    it('should enforce text length constraints (10-150 characters)', () => {
      const validQuote: Quote = {
        id: 'q1',
        text: 'Valid length quote.',
        author: 'Test Author',
        source: 'quotegarden',
        category: 'test',
        tags: ['test'],
        length: 19, // Match actual text length (corrected)
        dateAdded: new Date('2024-01-01'),
        popularity: 75,
        verified: true
      };

      expect(validQuote.text.length).toBeGreaterThanOrEqual(10);
      expect(validQuote.text.length).toBeLessThanOrEqual(150);
      expect(validQuote.length).toBe(validQuote.text.length);
    });

    it('should have non-empty author field', () => {
      const quote: Quote = {
        id: 'author-test',
        text: 'A quote needs attribution.',
        author: 'Known Author',
        source: 'quotegarden',
        length: 25
      };

      expect(quote.author).toBeTruthy();
      expect(quote.author.trim()).not.toBe('');
    });

    it('should have valid source enum values', () => {
      const validSources: Quote['source'][] = ['quotegarden', 'quotable', 'local'];
      
      validSources.forEach((source: Quote['source']) => {
        const quote: Quote = {
          id: `source-test-${source}`,
          text: 'Testing source validation.',
          author: 'Test Author',
          source: source,
          length: 26
        };

        expect(['quotegarden', 'quotable', 'local']).toContain(quote.source);
      });
    });
  });

  describe('Quote uniqueness validation', () => {
    it('should have unique id for each quote', () => {
      const quote1: Quote = {
        id: 'unique-1',
        text: 'First quote',
        author: 'Author 1',
        source: 'local',
        length: 11
      };

      const quote2: Quote = {
        id: 'unique-2',
        text: 'Second quote',
        author: 'Author 2',
        source: 'local',
        length: 12
      };

      expect(quote1.id).not.toBe(quote2.id);
    });
  });
});
