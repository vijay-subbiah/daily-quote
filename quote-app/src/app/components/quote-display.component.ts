/**
 * T044: QuoteDisplayComponent Implementation
 * 
 * A modern Angular 20+ standalone component that renders individual quotes with
 * responsive typography, comprehensive accessibility features, and adaptive design.
 * 
 * Features:
 * - Standalone component with signals
 * - OnPush change detection for performance
 * - Responsive typography that adapts to quote length
 * - Comprehensive accessibility support (WCAG 2.1 Level AA)
 * - Interactive elements with proper focus management
 * - Content sanitization for security
 * - Visual indicators for verified and popular quotes
 * - Keyboard navigation support
 */

import { 
  Component, 
  ChangeDetectionStrategy, 
  input, 
  output,
  computed,
  signal
} from '@angular/core';
import { Quote } from '../models/quote.interface';

@Component({
  selector: 'app-quote-display',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (quote()) {
      <div 
        [class]="containerClasses()"
        data-testid="quote-container">
        
        <!-- Main Quote Section -->
        <blockquote
          role="blockquote"
          [attr.aria-label]="ariaLabel()"
          [attr.tabindex]="0"
          [class]="quoteClasses()"
          (click)="onQuoteClick()"
          (keydown)="onQuoteKeydown($event)">
          {{ sanitizedQuoteText() }}
        </blockquote>

        <!-- Author Section -->
        <div class="mt-4 flex items-center justify-between">
          <button
            type="button"
            [attr.tabindex]="0"
            [class]="authorClasses()"
            [attr.aria-label]="'View more quotes by ' + displayAuthor()"
            (click)="onAuthorClick()"
            (keydown)="onAuthorKeydown($event)">
            — {{ displayAuthor() }}
            
            <!-- Verified Icon -->
            @if (quote()?.verified) {
              <svg 
                class="w-4 h-4 ml-1 text-green-500" 
                data-testid="verified-icon"
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true">
                <path 
                  fill-rule="evenodd" 
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                  clip-rule="evenodd">
                </path>
              </svg>
            }
          </button>

          <!-- Popularity Indicator -->
          @if (showPopularityIndicator()) {
            <div 
              class="flex items-center text-xs text-gray-500"
              data-testid="popularity-indicator"
              [attr.aria-label]="'Popularity: ' + quote()?.popularity + '%'">
              <svg class="w-3 h-3 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              {{ quote()?.popularity }}%
            </div>
          }
        </div>

        <!-- Category Section -->
        @if (quote()?.category) {
          <div class="mt-3" data-testid="quote-category">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {{ quote()?.category }}
            </span>
          </div>
        }

        <!-- Tags Section -->
        @if (hasTags()) {
          <div class="mt-3 flex flex-wrap gap-2" data-testid="quote-tags">
            @for (tag of quote()?.tags; track tag) {
              <button
                type="button"
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors cursor-pointer"
                [attr.aria-label]="'Filter by tag: ' + tag"
                (click)="onTagClick(tag)"
                (keydown)="onTagKeydown($event, tag)">
                #{{ tag }}
              </button>
            }
          </div>
        }

        <!-- Source Attribution -->
        <div class="mt-4 text-xs text-gray-400 flex items-center justify-between">
          <span>Source: {{ formatSource() }}</span>
          @if (quote()?.dateAdded) {
            <span>{{ formatDate() }}</span>
          }
        </div>
      </div>
    } @else {
      <!-- No Quote Message -->
      <div 
        class="flex items-center justify-center p-8 text-gray-500"
        data-testid="no-quote-message">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h6a2 2 0 002-2V8M9 12h6"></path>
          </svg>
          <p class="text-sm font-medium">No quote to display</p>
          <p class="text-xs mt-1">Please select or load a quote</p>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-in {
      animation: fadeIn 300ms ease-out;
    }

    @media (prefers-reduced-motion: reduce) {
      .motion-reduce\\:transition-none {
        transition: none;
        animation: none;
      }
    }
  `]
})
export class QuoteDisplayComponent {
  // Input signals
  readonly quote = input<Quote | null>(null);

  // Output events
  readonly quoteClicked = output<Quote>();
  readonly authorClicked = output<string>();
  readonly tagClicked = output<string>();

  // Computed properties for content processing
  readonly sanitizedQuoteText = computed(() => {
    const q = this.quote();
    if (!q?.text) return '';
    
    // Basic XSS protection - strip HTML tags but preserve content
    return q.text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '');
  });

  readonly displayAuthor = computed(() => {
    const q = this.quote();
    if (!q?.author || q.author.trim() === '') {
      return 'Unknown Author';
    }
    
    // Sanitize author name
    const sanitized = q.author
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '');
    
    return sanitized;
  });

  readonly ariaLabel = computed(() => {
    const q = this.quote();
    return q ? `Quote by ${this.displayAuthor()}` : 'No quote available';
  });

  readonly hasTags = computed(() => {
    const q = this.quote();
    return q?.tags && q.tags.length > 0;
  });

  readonly showPopularityIndicator = computed(() => {
    const q = this.quote();
    return q?.popularity && q.popularity >= 90;
  });

  // Responsive and adaptive styling
  readonly containerClasses = computed(() => 
    'max-w-sm md:max-w-lg lg:max-w-2xl p-4 md:p-6 lg:p-8 bg-white rounded-lg shadow-sm border border-gray-200 motion-reduce:transition-none animate-fade-in'
  );

  readonly quoteClasses = computed(() => {
    const q = this.quote();
    if (!q) return '';

    const length = q.length || q.text?.length || 0;
    let sizeClasses = '';
    
    // Adaptive text size based on quote length
    if (length <= 50) {
      sizeClasses = 'text-xl lg:text-3xl';
    } else if (length <= 100) {
      sizeClasses = 'text-lg md:text-xl lg:text-2xl';
    } else {
      sizeClasses = 'text-base md:text-lg';
    }

    return `${sizeClasses} font-medium leading-relaxed text-gray-900 border-l-4 border-blue-500 pl-4 whitespace-pre-line cursor-pointer hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors motion-reduce:transition-none`;
  });

  readonly authorClasses = computed(() => 
    'text-gray-600 font-medium hover:text-blue-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1 py-0.5 transition-colors motion-reduce:transition-none flex items-center truncate max-w-xs'
  );

  readonly formatSource = computed(() => {
    const q = this.quote();
    if (!q?.source) return 'Unknown';
    
    const sourceMap: Record<string, string> = {
      'quotegarden': 'QuoteGarden',
      'quotable': 'Quotable',
      'local': 'Local Collection'
    };
    
    return sourceMap[q.source] || q.source;
  });

  readonly formatDate = computed(() => {
    const q = this.quote();
    if (!q?.dateAdded) return '';
    
    try {
      const date = q.dateAdded instanceof Date ? q.dateAdded : new Date(q.dateAdded);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  });

  // Event handlers
  onQuoteClick(): void {
    const q = this.quote();
    if (q) {
      this.quoteClicked.emit(q);
    }
  }

  onQuoteKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onQuoteClick();
    }
  }

  onAuthorClick(): void {
    const author = this.displayAuthor();
    if (author && author !== 'Unknown Author') {
      this.authorClicked.emit(author);
    }
  }

  onAuthorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onAuthorClick();
    }
  }

  onTagClick(tag: string): void {
    if (tag && tag.trim()) {
      this.tagClicked.emit(tag.trim());
    }
  }

  onTagKeydown(event: KeyboardEvent, tag: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onTagClick(tag);
    }
  }
}
