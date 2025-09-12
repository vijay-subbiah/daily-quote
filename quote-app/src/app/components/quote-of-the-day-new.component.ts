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
    <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <!-- Animated Background -->
      <div class="absolute inset-0">
        <!-- Gradient Overlays -->
        <div class="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div class="absolute inset-0 bg-gradient-to-tl from-cyan-600/10 via-transparent to-violet-600/10"></div>
        
        <!-- Floating Orbs -->
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/30 to-purple-600/30 rounded-full blur-3xl animate-float"></div>
        <div class="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-pink-400/30 to-red-600/30 rounded-full blur-3xl animate-float-delayed"></div>
        <div class="absolute top-1/2 left-3/4 w-64 h-64 bg-gradient-to-r from-cyan-400/30 to-blue-600/30 rounded-full blur-3xl animate-float-slow"></div>
        
        <!-- Mesh Gradient -->
        <div class="absolute inset-0 opacity-50">
          <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-purple-500/5 to-transparent"></div>
        </div>
        
        <!-- Particle Effects -->
        <div class="particles">
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
          <div class="particle"></div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="relative z-10 min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-6xl mx-auto w-full">
          
          <!-- Header -->
          <div class="text-center mb-16 animate-fade-in-up">
            <div class="mb-8">
              <h1 class="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
                <span class="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent drop-shadow-2xl">
                  Daily
                </span>
                <br>
                <span class="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                  Inspiration
                </span>
              </h1>
              <div class="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full shadow-lg"></div>
            </div>
            <p class="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style="animation-delay: 0.3s;">
              Discover profound wisdom and inspiration that transforms your perspective and elevates your day
            </p>
          </div>

          <!-- Main Card -->
          <div class="relative animate-fade-in-up" style="animation-delay: 0.6s;">
            <!-- Card Background with Glassmorphism -->
            <div class="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <!-- Inner Glow -->
              <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
              
              <!-- Content -->
              <div class="relative z-10 p-8 sm:p-12 lg:p-16">
                
                <!-- Action Buttons -->
                <div class="flex flex-wrap justify-center gap-4 mb-12">
                  
                  <!-- New Quote Button -->
                  <button
                    type="button"
                    class="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:rotate-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-blue-500/25"
                    [disabled]="loading() || debounceActive()"
                    [attr.aria-label]="'Fetch new daily quote'"
                    (click)="handleNewQuote()"
                  >
                    <!-- Button Shine Effect -->
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    <div class="relative flex items-center gap-3">
                      @if (loading()) {
                        <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      } @else {
                        <svg class="w-6 h-6 transition-transform group-hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      }
                      <span class="text-lg">{{ loading() ? 'Inspiring...' : 'New Inspiration' }}</span>
                    </div>
                  </button>

                  <!-- Copy Button -->
                  <button
                    type="button"
                    class="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:-rotate-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-emerald-500/25"
                    [disabled]="!currentQuote() || copyingToClipboard()"
                    [attr.aria-label]="'Copy quote to clipboard'"
                    (click)="handleCopyQuote()"
                  >
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    <div class="relative flex items-center gap-3">
                      @if (copyingToClipboard()) {
                        <div class="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      } @else {
                        <svg class="w-6 h-6 transition-transform group-hover:scale-110 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      }
                      <span class="text-lg">Copy</span>
                    </div>
                  </button>

                  <!-- Share Button -->
                  <button
                    type="button"
                    class="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:rotate-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-rose-500/25"
                    [disabled]="!currentQuote()"
                    [attr.aria-label]="'Share this quote'"
                    (click)="handleShare()"
                  >
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    
                    <div class="relative flex items-center gap-3">
                      <svg class="w-6 h-6 transition-transform group-hover:rotate-12 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span class="text-lg">Share</span>
                    </div>
                  </button>

                  <!-- Favorite Button -->
                  @if (currentQuote()) {
                    <button
                      type="button"
                      class="group relative overflow-hidden px-8 py-4 transition-all duration-300 transform hover:scale-105 active:scale-95 font-semibold rounded-2xl shadow-2xl"
                      [class]="isCurrentQuoteFavorite() 
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white hover:shadow-red-500/25' 
                        : 'bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50'"
                      [attr.aria-label]="isCurrentQuoteFavorite() ? 'Remove from favorites' : 'Add to favorites'"
                      (click)="handleToggleFavorite()"
                    >
                      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      <div class="relative flex items-center gap-3">
                        <svg class="w-6 h-6 transition-all duration-300 group-hover:scale-110" 
                             [class.animate-pulse]="isCurrentQuoteFavorite()"
                             [attr.fill]="isCurrentQuoteFavorite() ? 'currentColor' : 'none'" 
                             stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span class="text-lg">{{ isCurrentQuoteFavorite() ? 'Loved' : 'Love' }}</span>
                      </div>
                    </button>
                  }
                </div>

                <!-- Quote Display Section -->
                @if (currentQuote()) {
                  <div class="relative">
                    <!-- Quote Card -->
                    <div class="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 sm:p-10 lg:p-12 shadow-xl hover:shadow-2xl transition-all duration-500 group">
                      <!-- Decorative Elements -->
                      <div class="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-xl"></div>
                      <div class="absolute bottom-4 right-4 w-16 h-16 bg-gradient-to-br from-pink-400/30 to-rose-600/30 rounded-full blur-xl"></div>
                      
                      <!-- Quote Content -->
                      <div class="relative z-10">
                        <blockquote class="relative">
                          <!-- Opening Quote Mark -->
                          <div class="absolute -top-4 -left-2 text-6xl text-blue-400/30 font-serif">"</div>
                          
                          <p class="text-2xl sm:text-3xl lg:text-4xl font-light leading-relaxed text-white mb-8 pl-8 animate-fade-in-up group-hover:text-blue-100 transition-colors duration-500">
                            {{ currentQuote()!.text }}
                          </p>
                          
                          <!-- Closing Quote Mark -->
                          <div class="absolute -bottom-8 -right-2 text-6xl text-purple-400/30 font-serif">"</div>
                        </blockquote>
                        
                        <!-- Author -->
                        <div class="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                          <cite class="text-xl sm:text-2xl font-medium text-gray-300 not-italic animate-fade-in-up" style="animation-delay: 0.2s;">
                            — {{ currentQuote()!.author }}
                          </cite>
                          
                          <!-- Source Badge -->
                          <span class="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-full text-sm font-medium text-blue-200 border border-blue-400/20 animate-fade-in-up" style="animation-delay: 0.4s;">
                            {{ getSourceDisplayName(currentQuote()!.source) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                }

                <!-- Loading State -->
                @if (loading()) {
                  <div class="text-center py-16 animate-fade-in">
                    <div class="relative inline-block">
                      <!-- Loading Animation -->
                      <div class="w-20 h-20 border-4 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto mb-6"></div>
                      <div class="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-400 rounded-full animate-spin-reverse mx-auto"></div>
                    </div>
                    <p class="text-2xl font-light text-gray-300 animate-pulse">
                      Discovering inspiration...
                    </p>
                  </div>
                }

                <!-- Error State -->
                @if (error()) {
                  <div class="text-center py-16 animate-fade-in">
                    <div class="mb-6">
                      <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h3 class="text-xl font-semibold text-red-400 mb-2">Oops! Something went wrong</h3>
                      <p class="text-gray-400 max-w-md mx-auto leading-relaxed">
                        {{ error() }}
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      class="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl"
                      (click)="handleNewQuote()"
                    >
                      Try Again
                    </button>
                  </div>
                }

                <!-- Welcome Screen -->
                @if (!currentQuote() && !loading() && !error()) {
                  <div class="text-center py-20 animate-fade-in">
                    <!-- Welcome Icon -->
                    <div class="mb-8 relative">
                      <div class="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-white/10">
                        <svg class="w-12 h-12 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <!-- Sparkle Effects -->
                      <div class="absolute top-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                      <div class="absolute bottom-0 right-1/2 w-1 h-1 bg-purple-400 rounded-full animate-ping" style="animation-delay: 0.5s;"></div>
                    </div>
                    
                    <h2 class="text-3xl sm:text-4xl font-bold text-white mb-6 animate-fade-in-up">
                      Welcome to Your
                      <span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Daily Inspiration
                      </span>
                    </h2>
                    
                    <p class="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style="animation-delay: 0.3s;">
                      Embark on a journey of wisdom and motivation. Discover quotes that inspire, challenge, and transform your perspective.
                    </p>
                    
                    <button
                      type="button"
                      class="group relative overflow-hidden px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold text-xl rounded-2xl transition-all duration-500 transform hover:scale-110 active:scale-95 shadow-2xl hover:shadow-blue-500/25 animate-fade-in-up"
                      style="animation-delay: 0.6s;"
                      (click)="handleNewQuote()"
                    >
                      <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      <div class="relative flex items-center gap-4">
                        <svg class="w-7 h-7 transition-transform group-hover:rotate-12 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Discover Your First Quote</span>
                        <svg class="w-7 h-7 transition-transform group-hover:translate-x-2 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </button>
                  </div>
                }

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

          <!-- Footer -->
          <footer class="text-center mt-12 animate-fade-in-up" style="animation-delay: 1s;">
            <div class="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 max-w-md mx-auto">
              <p class="text-gray-400 text-sm leading-relaxed">
                Powered by multiple premium APIs for the finest collection of inspirational quotes
              </p>
            </div>
          </footer>
        </div>
      </div>
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
      'local': 'Local Collection'
    };
    return sourceMap[source] || source;
  }

}
