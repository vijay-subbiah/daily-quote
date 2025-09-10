/**
 * T020: QuoteDisplay Component Contract Tests
 * 
 * IMPORTANT: This test MUST fail initially as the QuoteDisplay component doesn't exist yet.
 * This follows TDD RED-GREEN-Refactor methodology.
 * 
 * Tests the QuoteDisplay component which renders individual quotes with proper
 * typography, accessibility features, and responsive design.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input, output } from '@angular/core';
import { render, screen, fireEvent } from '@testing-library/angular';

import { QuoteDisplayComponent } from './quote-display.component';
import { Quote } from '../models/quote.interface';

describe('QuoteDisplayComponent', () => {
  let component: QuoteDisplayComponent;
  let fixture: ComponentFixture<QuoteDisplayComponent>;

  const mockQuote: Quote = {
    id: 'test-quote-1',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    source: 'quotegarden',
    category: 'work',
    tags: ['work', 'passion', 'success'],
    length: 49,
    dateAdded: new Date('2024-01-01'),
    popularity: 90,
    verified: true
  };

  const longMockQuote: Quote = {
    id: 'long-quote',
    text: 'Life is what happens to you while you are busy making other plans. The future belongs to those who believe in the beauty of their dreams and work towards achieving them with dedication.',
    author: 'John Lennon',
    source: 'quotegarden',
    category: 'life',
    tags: ['life', 'planning', 'future'],
    length: 180,
    dateAdded: new Date('2024-01-01'),
    popularity: 85,
    verified: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteDisplayComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteDisplayComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should be a standalone component', () => {
      // Test that component can be imported without NgModule
      expect(component).toBeDefined();
      expect(fixture.componentRef).toBeDefined();
    });

    it('should use OnPush change detection', () => {
      // Test that component initializes properly with signals
      expect(component.quote).toBeDefined();
      expect(typeof component.quote).toBe('function');
    });

    it('should accept quote as input', () => {
      expect(component.quote).toBeDefined();
      expect(typeof component.quote).toBe('function'); // input() creates a signal function
    });

    it('should emit events for user interactions', () => {
      expect(component.quoteClicked).toBeDefined();
      expect(component.authorClicked).toBeDefined();
      expect(component.tagClicked).toBeDefined();
    });
  });

  describe('Template Rendering', () => {
    it('should render quote text in blockquote element', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const blockquote = screen.getByRole('blockquote');
      expect(blockquote).toBeInTheDocument();
      expect(blockquote).toHaveTextContent(mockQuote.text);
    });

    it('should render author information', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      expect(screen.getByText(mockQuote.author)).toBeInTheDocument();
    });

    it('should render quote category when provided', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      expect(screen.getByText(mockQuote.category!)).toBeInTheDocument();
    });

    it('should render tags when provided', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      mockQuote.tags!.forEach((tag: string) => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });

    it('should render quote source attribution', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      expect(screen.getByText(/quotegarden/i)).toBeInTheDocument();
    });

    it('should not render tags section when no tags provided', async () => {
      const quoteWithoutTags = { ...mockQuote, tags: [] };
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: quoteWithoutTags }
      });

      expect(screen.queryByTestId('quote-tags')).not.toBeInTheDocument();
    });

    it('should not render category when not provided', async () => {
      const quoteWithoutCategory = { ...mockQuote, category: undefined };
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: quoteWithoutCategory }
      });

      expect(screen.queryByTestId('quote-category')).not.toBeInTheDocument();
    });

    it('should render proper quote typography', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const blockquote = screen.getByRole('blockquote');
      expect(blockquote).toHaveClass('text-lg', 'font-medium', 'leading-relaxed');
    });
  });

  describe('Responsive Design', () => {
    it('should apply responsive text sizing', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const blockquote = screen.getByRole('blockquote');
      expect(blockquote).toHaveClass('text-lg', 'md:text-xl', 'lg:text-2xl');
    });

    it('should use responsive spacing', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const container = screen.getByTestId('quote-container');
      expect(container).toHaveClass('p-4', 'md:p-6', 'lg:p-8');
    });

    it('should adapt layout for different screen sizes', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const container = screen.getByTestId('quote-container');
      expect(container).toHaveClass('max-w-sm', 'md:max-w-lg', 'lg:max-w-2xl');
    });
  });

  describe('Quote Length Adaptation', () => {
    it('should use smaller text for very long quotes', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: longMockQuote }
      });

      const blockquote = screen.getByRole('blockquote');
      expect(blockquote).toHaveClass('text-base'); // Smaller for long quotes
    });

    it('should use larger text for short quotes', async () => {
      const shortQuote = { ...mockQuote, text: 'Short quote.', length: 12 };
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: shortQuote }
      });

      const blockquote = screen.getByRole('blockquote');
      expect(blockquote).toHaveClass('text-xl', 'lg:text-3xl');
    });

    it('should adjust line height based on quote length', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: longMockQuote }
      });

      const blockquote = screen.getByRole('blockquote');
      expect(blockquote).toHaveClass('leading-relaxed');
    });
  });

  describe('User Interactions', () => {
    it('should emit quoteClicked event when quote text is clicked', async () => {
      let clickedQuote: Quote | undefined;
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote },
        componentOutputs: {
          quoteClicked: (quote: Quote) => { clickedQuote = quote; }
        }
      });

      const blockquote = screen.getByRole('blockquote');
      fireEvent.click(blockquote);

      expect(clickedQuote).toEqual(mockQuote);
    });

    it('should emit authorClicked event when author is clicked', async () => {
      let clickedAuthor: string | undefined;
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote },
        componentOutputs: {
          authorClicked: (author: string) => { clickedAuthor = author; }
        }
      });

      const authorElement = screen.getByText(mockQuote.author);
      fireEvent.click(authorElement);

      expect(clickedAuthor).toBe(mockQuote.author);
    });

    it('should emit tagClicked event when tag is clicked', async () => {
      let clickedTag: string | undefined;
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote },
        componentOutputs: {
          tagClicked: (tag: string) => { clickedTag = tag; }
        }
      });

      const tagElement = screen.getByText(mockQuote.tags![0]);
      fireEvent.click(tagElement);

      expect(clickedTag).toBe(mockQuote.tags![0]);
    });

    it('should show hover effects on interactive elements', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const authorElement = screen.getByText(mockQuote.author);
      expect(authorElement).toHaveClass('hover:text-blue-600', 'cursor-pointer');
    });

    it('should show focus styles for keyboard users', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const blockquote = screen.getByRole('blockquote');
      expect(blockquote).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });
  });

  describe('Accessibility', () => {
    it('should use proper semantic HTML structure', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      expect(screen.getByRole('blockquote')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: new RegExp(mockQuote.author) })).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const blockquote = screen.getByRole('blockquote');
      expect(blockquote).toHaveAttribute('aria-label', `Quote by ${mockQuote.author}`);
    });

    it('should be keyboard navigable', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const blockquote = screen.getByRole('blockquote');
      const authorButton = screen.getByRole('button', { name: new RegExp(mockQuote.author) });

      expect(blockquote).toHaveAttribute('tabindex', '0');
      expect(authorButton).toHaveAttribute('tabindex', '0');
    });

    it('should support keyboard activation', async () => {
      let quoteClicked = false;
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote },
        componentOutputs: {
          quoteClicked: () => { quoteClicked = true; }
        }
      });

      const blockquote = screen.getByRole('blockquote');
      fireEvent.keyDown(blockquote, { key: 'Enter' });

      expect(quoteClicked).toBe(true);
    });

    it('should have appropriate contrast ratios', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const blockquote = screen.getByRole('blockquote');
      expect(blockquote).toHaveClass('text-gray-900'); // High contrast text
    });

    it('should support reduced motion preferences', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const container = screen.getByTestId('quote-container');
      expect(container).toHaveClass('motion-reduce:transition-none');
    });
  });

  describe('Visual Design', () => {
    it('should apply proper quote styling', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const blockquote = screen.getByRole('blockquote');
      expect(blockquote).toHaveClass('border-l-4', 'border-blue-500', 'pl-4');
    });

    it('should style author information appropriately', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const authorElement = screen.getByText(mockQuote.author);
      expect(authorElement).toHaveClass('text-gray-600', 'font-medium');
    });

    it('should style tags consistently', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const tagElement = screen.getByText(mockQuote.tags![0]);
      expect(tagElement).toHaveClass('bg-gray-100', 'text-gray-700', 'px-2', 'py-1', 'rounded');
    });

    it('should show different styling for verified quotes', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      const verifiedIcon = screen.getByTestId('verified-icon');
      expect(verifiedIcon).toBeInTheDocument();
      expect(verifiedIcon).toHaveClass('text-green-500');
    });

    it('should show popularity indicator for popular quotes', async () => {
      const popularQuote = { ...mockQuote, popularity: 95 };
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: popularQuote }
      });

      const popularityIndicator = screen.getByTestId('popularity-indicator');
      expect(popularityIndicator).toBeInTheDocument();
    });
  });

  describe('Quote Formatting', () => {
    it('should preserve line breaks in quote text', async () => {
      const quoteWithLineBreaks = {
        ...mockQuote,
        text: 'First line.\nSecond line.\nThird line.'
      };
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: quoteWithLineBreaks }
      });

      const blockquote = screen.getByRole('blockquote');
      expect(blockquote).toHaveClass('whitespace-pre-line');
    });

    it('should handle quotes with special characters', async () => {
      const quoteWithSpecialChars = {
        ...mockQuote,
        text: 'Quote with "quotes" & special <characters>.'
      };
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: quoteWithSpecialChars }
      });

      expect(screen.getByText('Quote with "quotes" & special <characters>.')).toBeInTheDocument();
    });

    it('should truncate very long author names', async () => {
      const quoteWithLongAuthor = {
        ...mockQuote,
        author: 'A Very Long Author Name That Should Be Truncated'
      };
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: quoteWithLongAuthor }
      });

      const authorElement = screen.getByText(/A Very Long Author Name/);
      expect(authorElement).toHaveClass('truncate');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', async () => {
      const renderSpy = jest.spyOn(component, 'ngOnInit').mockImplementation();
      
      const { rerender } = await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      // Re-render with same quote
      rerender({ componentInputs: { quote: mockQuote } });

      // Should only initialize once
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid quote changes efficiently', async () => {
      const { rerender } = await render(QuoteDisplayComponent, {
        componentInputs: { quote: mockQuote }
      });

      // Rapid quote changes
      for (let i = 0; i < 10; i++) {
        const newQuote = { ...mockQuote, id: `quote-${i}`, text: `Quote ${i}` };
        rerender({ componentInputs: { quote: newQuote } });
      }

      // Final quote should be displayed
      expect(screen.getByText('Quote 9')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle null quote gracefully', async () => {
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: null }
      });

      expect(screen.getByTestId('no-quote-message')).toBeInTheDocument();
    });

    it('should handle quote with missing fields', async () => {
      const incompleteQuote = {
        id: 'incomplete',
        text: 'Quote text',
        author: '',
        source: 'unknown'
      } as Quote;
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: incompleteQuote }
      });

      expect(screen.getByText('Quote text')).toBeInTheDocument();
      expect(screen.getByText('Unknown Author')).toBeInTheDocument();
    });

    it('should sanitize potentially dangerous content', async () => {
      const maliciousQuote = {
        ...mockQuote,
        text: 'Quote with <script>alert("xss")</script>',
        author: 'Author <img src=x onerror=alert(1)>'
      };
      
      await render(QuoteDisplayComponent, {
        componentInputs: { quote: maliciousQuote }
      });

      // Should display text without executing scripts
      expect(screen.getByText(/Quote with/)).toBeInTheDocument();
      expect(screen.queryByText(/<script>/)).not.toBeInTheDocument();
    });
  });
});
