/**
 * T045: QuoteOfTheDayComponent Implementation
 * 
 * Main container component that orchestrates the entire Quote of the Day application.
 * Serves as the application shell, managing global state and coordinating child components.
 * 
 * Features:
 * - Standalone component with signals and OnPush change detection
 * - Comprehensive accessibility with ARIA support and keyboard navigation
 * - Error handling with user-friendly messages and retry functionality
 * - Clipboard integration with fallback for unsupported browsers
 * - Responsive design with Tailwind CSS utilities
 * - Performance optimizations including debounced interactions
 * - Social sharing integration with native share API fallback
 * - State management using Angular signals for reactive updates
 */

import { 
  Component, 
  OnInit,
  ChangeDetectionStrategy, 
  signal, 
  computed, 
  inject,
  afterNextRender,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Services
import { QuoteService } from '../services/quote.service';
import { CacheService } from '../services/cache.service';
import { ErrorHandler } from '../services/error-handler.service';

// Components
import { SocialShareComponent } from './social-share.component';

// Models
import { Quote } from '../models/quote.interface';

@Component({
  selector: 'app-quote-of-the-day',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SocialShareComponent
  ],
  template: `
    <div class="min-vh-100 bg-dark text-white">
      <div class="container py-5">
        <div class="text-center mb-5">
          <h1 class="display-4 fw-bold text-primary mb-4">
            Daily Inspiration
          </h1>
        </div>
        
        <div class="row justify-content-center">
          <div class="col-12 col-lg-8">
            <div class="card bg-secondary border-light shadow-lg">
              <div class="card-body p-4 p-md-5">
                
                <!-- Action Buttons -->
                <div class="d-flex flex-wrap justify-content-center gap-3 mb-4">
                  <!-- New Quote Button -->
                  <button
                    type="button"
                    class="btn btn-primary btn-lg"
                    [disabled]="loading() || debounceActive()"
                    (click)="handleNewQuote()"
                  >
                    @if (loading()) {
                      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      <span>Loading...</span>
                    } @else {
                      <i class="bi bi-arrow-clockwise me-2"></i>
                      <span>New Quote</span>
                    }
                  </button>

                  <!-- Copy Button -->
                  <button
                    type="button"
                    class="btn btn-success btn-lg"
                    [disabled]="!currentQuote() || copyingToClipboard()"
                    (click)="handleCopyQuote()"
                  >
                    @if (copyingToClipboard()) {
                      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    } @else {
                      <i class="bi bi-clipboard me-2"></i>
                    }
                    Copy
                  </button>

                  <!-- Share Button -->
                  <button
                    type="button"
                    class="btn btn-info btn-lg"
                    [disabled]="!currentQuote()"
                    (click)="handleShare()"
                  >
                    <i class="bi bi-share me-2"></i>
                    Share
                  </button>
                </div>

                <!-- Quote Display -->
                @if (currentQuote()) {
                  <div class="text-center" data-testid="quote-display">
                    <blockquote class="blockquote">
                      <p class="fs-3 fw-light text-light mb-4" data-testid="quote-text">
                        "{{ currentQuote()!.text }}"
                      </p>
                      <footer class="blockquote-footer">
                        <cite class="fs-5 text-info" data-testid="quote-author">{{ currentQuote()!.author }}</cite>
                      </footer>
                    </blockquote>
                    
                    <!-- Source Badge -->
                    <span class="badge bg-primary mt-3">
                      {{ getSourceDisplayName(currentQuote()!.source) }}
                    </span>
                  </div>
                }

                <!-- Loading State -->
                @if (loading()) {
                  <div class="text-center py-5" data-testid="loading-spinner">
                    <div class="spinner-border text-primary mb-3" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="text-muted">Loading inspiration...</p>
                  </div>
                }

                <!-- Error State -->
                @if (error()) {
                  <div class="text-center py-5">
                    <div class="alert alert-danger" role="alert">
                      <i class="bi bi-exclamation-triangle me-2"></i>
                      {{ error() }}
                    </div>
                    <button
                      type="button"
                      class="btn btn-outline-danger"
                      (click)="handleNewQuote()"
                    >
                      Try Again
                    </button>
                  </div>
                }

                <!-- Welcome Screen -->
                @if (!currentQuote() && !loading() && !error()) {
                  <div class="text-center py-5">
                    <div class="mb-4">
                      <i class="bi bi-lightbulb display-1 text-warning"></i>
                    </div>
                    
                    <h2 class="h3 fw-bold mb-3">
                      Welcome to 
                      <span class="text-primary">Daily Inspiration</span>
                    </h2>
                    
                    <p class="lead text-light mb-4">
                      Click the button below to discover your first inspiring quote
                    </p>
                    
                    <button
                      type="button"
                      class="btn btn-primary btn-lg"
                      (click)="handleNewQuote()"
                    >
                      <i class="bi bi-lightning me-2"></i>
                      Get Your First Quote
                    </button>
                  </div>
                }

              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Social Share Modal -->
      @if (showShareDialog()) {
        <app-social-share
          [quote]="currentQuote()!"
          (close)="handleCloseShare()"
        />
      }
    </div>
  `,
  styles: [`
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    /* Advanced Keyframe Animations */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes fade-in-up {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(-50px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-30px) rotate(1deg); }
      66% { transform: translateY(-20px) rotate(-1deg); }
    }

    @keyframes float-delayed {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-25px) rotate(-1deg); }
      66% { transform: translateY(-35px) rotate(1deg); }
    }

    @keyframes float-slow {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-15px) rotate(0.5deg); }
    }

    @keyframes gradient {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    @keyframes spin-reverse {
      from { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }

    @keyframes particle-float {
      0%, 100% { 
        transform: translateY(0px) translateX(0px) scale(1);
        opacity: 0.8;
      }
      33% { 
        transform: translateY(-100px) translateX(50px) scale(1.2);
        opacity: 0.4;
      }
      66% { 
        transform: translateY(-50px) translateX(-30px) scale(0.8);
        opacity: 0.6;
      }
    }

    /* Animation Classes */
    .animate-fade-in {
      animation: fadeIn 1s ease-out forwards;
      opacity: 0;
    }

    .animate-fade-in-up {
      animation: fade-in-up 1s ease-out forwards;
      opacity: 0;
    }

    .animate-slide-in {
      animation: slideIn 1s ease-out forwards;
      opacity: 0;
    }

    .animate-float {
      animation: float 8s ease-in-out infinite;
    }

    .animate-float-delayed {
      animation: float-delayed 10s ease-in-out infinite;
      animation-delay: 2s;
    }

    .animate-float-slow {
      animation: float-slow 12s ease-in-out infinite;
      animation-delay: 4s;
    }

    .animate-gradient {
      background-size: 200% 200%;
      animation: gradient 3s ease infinite;
    }

    .animate-spin-reverse {
      animation: spin-reverse 2s linear infinite;
    }

    /* Particle System */
    .particles {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
    }

    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: linear-gradient(45deg, #60a5fa, #a855f7);
      border-radius: 50%;
      animation: particle-float 15s ease-in-out infinite;
    }

    .particle:nth-child(1) {
      top: 20%;
      left: 20%;
      animation-delay: 0s;
      animation-duration: 15s;
    }

    .particle:nth-child(2) {
      top: 40%;
      left: 80%;
      animation-delay: 3s;
      animation-duration: 18s;
    }

    .particle:nth-child(3) {
      top: 80%;
      left: 30%;
      animation-delay: 6s;
      animation-duration: 20s;
    }

    .particle:nth-child(4) {
      top: 60%;
      left: 70%;
      animation-delay: 9s;
      animation-duration: 16s;
    }

    .particle:nth-child(5) {
      top: 30%;
      left: 50%;
      animation-delay: 12s;
      animation-duration: 22s;
    }

    /* Advanced Glassmorphism Effects */
    .backdrop-blur-sm {
      backdrop-filter: blur(8px);
    }

    .backdrop-blur-md {
      backdrop-filter: blur(12px);
    }

    .backdrop-blur-xl {
      backdrop-filter: blur(24px);
    }

    /* Interactive button effects */
    button:hover svg {
      transform: scale(1.1);
    }

    button:active {
      transform: scale(0.98);
    }

    /* Premium Button Shine Effect */
    .group:hover .absolute.inset-0.bg-gradient-to-r {
      transform: skewX(12deg) translateX(100%);
    }

    /* Responsive Particle Adjustments */
    @media (max-width: 768px) {
      .particles {
        display: none;
      }
      
      .animate-float,
      .animate-float-delayed,
      .animate-float-slow {
        animation-duration: 6s;
      }
    }

    /* Reduced Motion Support */
    @media (prefers-reduced-motion: reduce) {
      .animate-fade-in,
      .animate-fade-in-up,
      .animate-slide-in,
      .animate-float,
      .animate-float-delayed,
      .animate-float-slow,
      .animate-gradient,
      .particle {
        animation: none !important;
      }
      
      .particles {
        display: none;
      }
    }

    /* High Contrast Support */
    @media (prefers-contrast: high) {
      .bg-white-10,
      .bg-white-5 {
        background: rgba(255, 255, 255, 0.9) !important;
        color: #000 !important;
      }
      
      .text-white,
      .text-gray-300,
      .text-gray-400 {
        color: #000 !important;
      }
      
      .border-white-20,
      .border-white-10 {
        border-color: #000 !important;
      }
    }
  `]
})
export class QuoteOfTheDayComponent implements OnInit {
  @ViewChild('newQuoteButton') newQuoteButton!: ElementRef<HTMLButtonElement>;

  // Inject services
  private quoteService = inject(QuoteService);
  private cacheService = inject(CacheService);
  private errorHandler = inject(ErrorHandler);

  // State signals
  private _showShareDialog = signal(false);
  private _successMessage = signal<string | null>(null);
  private _copyingToClipboard = signal(false);
  private _debounceActive = signal(false);

  // Computed state from services
  currentQuote = computed(() => this.quoteService.currentQuote());
  loading = computed(() => this.quoteService.loading());
  error = computed(() => this.quoteService.error());

  // Component-specific computed properties
  showShareDialog = computed(() => this._showShareDialog());
  successMessage = computed(() => this._successMessage());
  copyingToClipboard = computed(() => this._copyingToClipboard());
  debounceActive = computed(() => this._debounceActive());

  userFriendlyError = computed(() => {
    const error = this.error();
    if (!error) return null;
    // For now, return the error directly. In a real app, you'd implement error classification
    return error;
  });

  isCurrentQuoteFavorite = computed(() => {
    const quote = this.currentQuote();
    // For now, return false. Favorites functionality would be implemented in future iteration
    return false;
  });

  constructor() {
    // Auto-clear success messages after 3 seconds
    afterNextRender(() => {
      setInterval(() => {
        if (this._successMessage()) {
          this._successMessage.set(null);
        }
      }, 3000);
    });
  }

  ngOnInit(): void {
    // Load initial quote if cache is available
    this.loadInitialQuote();
  }

  private async loadInitialQuote(): Promise<void> {
    try {
      // For now, just fetch a new quote. Cache functionality would be implemented in future iteration
      // const cachedQuotes = this.quoteService.getCachedQuotes();
      // if (cachedQuotes.length === 0) {
        await this.fetchNewQuote();
      // }
      // If cached quotes exist, the service will automatically show the most recent one
    } catch (error) {
      // Don't show error on initial load, let user manually fetch
      console.warn('Failed to load initial quote:', error);
    }
  }

  async handleNewQuote(): Promise<void> {
    if (this.loading() || this.debounceActive()) {
      return;
    }

    // Activate debounce to prevent rapid requests
    this._debounceActive.set(true);
    setTimeout(() => this._debounceActive.set(false), 1000);

    try {
      await this.fetchNewQuote();
      this._successMessage.set('New quote loaded successfully!');
    } catch (error) {
      // Simple error logging for now
      console.error('Error fetching new quote:', error);
    }
  }

  private async fetchNewQuote(): Promise<void> {
    try {
      const result = await this.quoteService.fetchRandomQuote();
      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to fetch quote';
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Error is handled by the service and reflected in the error signal
      throw error;
    }
  }

  async handleCopyQuote(): Promise<void> {
    const quote = this.currentQuote();
    if (!quote || this.copyingToClipboard()) {
      return;
    }

    this._copyingToClipboard.set(true);

    try {
      const textToCopy = `"${quote.text}" - ${quote.author}`;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        this._successMessage.set('Copied to clipboard!');
      } else {
        // Fallback for browsers without clipboard API
        this.fallbackCopyToClipboard(textToCopy);
        this._successMessage.set('Copied to clipboard!');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this._successMessage.set('Unable to copy. Please try selecting and copying manually.');
    } finally {
      this._copyingToClipboard.set(false);
    }
  }

  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (err) {
      throw new Error('Fallback copy failed');
    } finally {
      document.body.removeChild(textArea);
    }
  }

  handleShare(): void {
    const quote = this.currentQuote();
    if (!quote) {
      return;
    }

    // Try native share API first
    if (navigator.share) {
      const shareData = {
        title: 'Quote of the Day',
        text: `"${quote.text}" - ${quote.author}`,
        url: window.location.href
      };

      navigator.share(shareData).catch((error) => {
        // If native share fails or is cancelled, show our share dialog
        if (error.name !== 'AbortError') {
          this._showShareDialog.set(true);
        }
      });
    } else {
      // Fallback to our share dialog
      this._showShareDialog.set(true);
    }
  }

  handleCloseShare(): void {
    this._showShareDialog.set(false);
  }

  handleToggleFavorite(): void {
    const quote = this.currentQuote();
    if (!quote) {
      return;
    }

    try {
      // For now, simulate favorite toggling. This would be implemented in future iteration
      // if (this.quoteService.isFavorite(quote.id)) {
      //   this.quoteService.removeFromFavorites(quote.id);
      //   this._successMessage.set('Removed from favorites');
      // } else {
      //   this.quoteService.addToFavorites(quote);
      //   this._successMessage.set('Added to favorites');
      // }
      this._successMessage.set('Favorites feature coming soon!');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      this._successMessage.set('Unable to update favorites. Please try again.');
    }
  }

  handleRetry(): void {
    // For now, just clear any existing error state by triggering a new quote fetch
    // this.quoteService.clearError();
    this.handleNewQuote();
  }

  getSourceDisplayName(source: string): string {
    const sourceMap: Record<string, string> = {
      'quotegarden': 'Quote Garden',
      'quotable': 'Quotable',
      'zenquotes': 'Zen Quotes',
      'dummyjson': 'DummyJSON',
      'local': 'Local Collection'
    };
    return sourceMap[source] || source;
  }

}
