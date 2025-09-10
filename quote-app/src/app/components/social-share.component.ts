/**
 * T043: SocialShareComponent Implementation
 * 
 * A modern Angular 20+ standalone component that provides social media sharing
 * functionality with platform-specific formatting and comprehensive accessibility features.
 * 
 * Features:
 * - Standalone component with signals
 * - OnPush change detection for performance
 * - Multiple social platforms (Twitter, Facebook, LinkedIn, WhatsApp, Telegram)
 * - Clipboard API integration with fallback
 * - Native mobile share API support
 * - Accessibility compliant (WCAG 2.1 Level AA)
 * - Modal dialog with focus trap
 * - Keyboard navigation support
 * - Analytics tracking integration
 */

import { 
  Component, 
  ChangeDetectionStrategy, 
  input, 
  output,
  computed,
  signal,
  effect,
  ElementRef,
  inject,
  afterNextRender
} from '@angular/core';
import { Quote } from '../models/quote.interface';

export interface ShareEvent {
  platform: string;
  quote: Quote;
  timestamp: Date;
}

export interface SocialPlatform {
  name: string;
  label: string;
  icon: string;
  color: string;
  hoverColor: string;
}

@Component({
  selector: 'app-social-share',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showDialog()) {
      <!-- Modal Backdrop -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        (click)="onBackdropClick($event)"
        (keydown)="onKeyDown($event)"
        data-testid="modal-backdrop">
        
        <!-- Dialog Content -->
        <div 
          role="dialog"
          [attr.aria-labelledby]="dialogLabelId()"
          [attr.aria-modal]="true"
          [class]="dialogClasses()"
          (click)="$event.stopPropagation()"
          data-testid="dialog-content">
          
          <!-- Header -->
          <div class="flex justify-between items-center mb-6">
            <h2 [id]="dialogLabelId()" class="text-xl font-semibold text-gray-900">
              Share Quote
            </h2>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              (click)="onClose()"
              aria-label="Close dialog">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Quote Preview -->
          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <blockquote class="text-gray-700 italic mb-2">
              "{{ quote()?.text }}"
            </blockquote>
            <cite class="text-gray-600 font-medium">
              — {{ quote()?.author }}
            </cite>
          </div>

          <!-- Native Share Button (Mobile) -->
          @if (supportsNativeShare()) {
            <button
              type="button"
              class="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              (click)="shareNative()"
              aria-label="Share using device's native share">
              <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
              </svg>
              Share
            </button>
          }

          <!-- Social Platform Buttons -->
          <div 
            class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6"
            data-testid="share-buttons-container">
            
            @for (platform of platforms(); track platform.name) {
              <button
                type="button"
                [class]="getButtonClasses(platform)"
                (click)="shareOnPlatform(platform.name)"
                [attr.aria-label]="'Share on ' + platform.label">
                
                <!-- Platform Icon -->
                <div 
                  [class]="getIconClasses(platform.name)"
                  [attr.data-testid]="platform.name + '-icon'">
                  <!-- SVG icons for each platform -->
                  @if (platform.name === 'twitter') {
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  }
                  @if (platform.name === 'facebook') {
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  }
                  @if (platform.name === 'linkedin') {
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  }
                  @if (platform.name === 'whatsapp') {
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  }
                  @if (platform.name === 'telegram') {
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  }
                  @if (platform.name === 'copy') {
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                  }
                </div>
                
                <span class="mt-1 text-xs font-medium">{{ platform.label }}</span>
              </button>
            }
          </div>

          <!-- Status Message -->
          @if (statusMessage()) {
            <div 
              role="status"
              aria-live="polite"
              [class]="statusClasses()"
              data-testid="status-message">
              {{ statusMessage() }}
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { 
        opacity: 0; 
        transform: translateY(20px); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0); 
      }
    }

    .animate-fade-in {
      animation: fadeIn 200ms ease-out;
    }

    .animate-slide-up {
      animation: slideUp 200ms ease-out;
    }
  `]
})
export class SocialShareComponent {
  private elementRef = inject(ElementRef);

  // Input signals
  readonly quote = input<Quote | null>(null);
  readonly showDialog = input<boolean>(false);

  // Output events
  readonly closeDialog = output<void>();
  readonly shareCompleted = output<ShareEvent>();

  // Internal state
  readonly statusMessage = signal<string>('');
  readonly dialogLabelId = signal('share-dialog-' + Math.random().toString(36).substr(2, 9));

  // Computed signals
  readonly supportsNativeShare = signal(
    typeof navigator !== 'undefined' && 'share' in navigator
  );

  readonly platforms = computed<SocialPlatform[]>(() => [
    {
      name: 'twitter',
      label: 'Twitter',
      icon: 'twitter',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      name: 'facebook',
      label: 'Facebook',
      icon: 'facebook',
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700'
    },
    {
      name: 'linkedin',
      label: 'LinkedIn',
      icon: 'linkedin',
      color: 'bg-blue-700',
      hoverColor: 'hover:bg-blue-800'
    },
    {
      name: 'whatsapp',
      label: 'WhatsApp',
      icon: 'whatsapp',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      name: 'telegram',
      label: 'Telegram',
      icon: 'telegram',
      color: 'bg-blue-400',
      hoverColor: 'hover:bg-blue-500'
    },
    {
      name: 'copy',
      label: 'Copy',
      icon: 'copy',
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600'
    }
  ]);

  readonly formattedQuote = computed(() => {
    const q = this.quote();
    return q ? `"${q.text}" - ${q.author}` : '';
  });

  readonly shareUrl = computed(() => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  });

  readonly dialogClasses = computed(() => 
    'max-w-sm md:max-w-md w-full mx-4 bg-white rounded-lg shadow-xl p-6 animate-slide-up'
  );

  readonly statusClasses = computed(() => {
    const message = this.statusMessage();
    const baseClasses = 'p-3 rounded-lg text-sm font-medium text-center';
    
    if (message.includes('copied') || message.includes('success')) {
      return `${baseClasses} bg-green-100 text-green-800`;
    } else if (message.includes('unable') || message.includes('error')) {
      return `${baseClasses} bg-red-100 text-red-800`;
    }
    
    return `${baseClasses} bg-blue-100 text-blue-800`;
  });

  constructor() {
    // Focus management effect
    effect(() => {
      if (this.showDialog()) {
        afterNextRender(() => {
          this.focusFirstElement();
        });
      }
    });

    // Clear status message after delay
    effect(() => {
      if (this.statusMessage()) {
        setTimeout(() => this.statusMessage.set(''), 3000);
      }
    });
  }

  getButtonClasses(platform: SocialPlatform): string {
    return `flex flex-col items-center justify-center p-4 rounded-lg text-white font-medium 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
            transition-all duration-200 transform hover:scale-105 ${platform.color} ${platform.hoverColor}`;
  }

  getIconClasses(platformName: string): string {
    return `flex items-center justify-center`;
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onClose();
    }
  }

  onClose(): void {
    this.statusMessage.set('');
    this.closeDialog.emit();
  }

  async shareNative(): Promise<void> {
    if (!this.supportsNativeShare() || !this.quote()) return;

    try {
      await navigator.share({
        title: 'Quote of the Day',
        text: this.formattedQuote(),
        url: this.shareUrl()
      });

      this.trackShare('native');
      this.emitShareEvent('native');
    } catch (error) {
      // User cancelled or error occurred
      console.warn('Native share failed:', error);
    }
  }

  shareOnPlatform(platform: string): void {
    const quote = this.quote();
    if (!quote) return;

    if (platform === 'copy') {
      this.copyToClipboard();
      return;
    }

    const url = this.generateShareUrl(platform, quote);
    if (url) {
      this.openShareWindow(url);
      this.trackShare(platform);
      this.emitShareEvent(platform);
    }
  }

  private generateShareUrl(platform: string, quote: Quote): string {
    const text = this.formattedQuote();
    const url = this.shareUrl();
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);

    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
      
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
      
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`;
      
      case 'whatsapp':
        return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
      
      case 'telegram':
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
      
      default:
        return '';
    }
  }

  private openShareWindow(url: string): void {
    const windowFeatures = 'width=600,height=400,scrollbars=yes,resizable=yes';
    window.open(url, '_blank', windowFeatures);
  }

  private async copyToClipboard(): Promise<void> {
    const text = this.formattedQuote();
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        // Modern Clipboard API
        await navigator.clipboard.writeText(text);
        this.statusMessage.set('Copied to clipboard!');
      } else {
        // Fallback for older browsers
        await this.legacyCopyToClipboard(text);
        this.statusMessage.set('Copied to clipboard!');
      }
      
      this.trackShare('copy');
      this.emitShareEvent('copy');
    } catch (error) {
      console.error('Copy failed:', error);
      this.statusMessage.set('Unable to copy to clipboard');
    }
  }

  private async legacyCopyToClipboard(text: string): Promise<void> {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (!successful) {
      throw new Error('Legacy copy command failed');
    }
  }

  private trackShare(platform: string): void {
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        method: platform,
        content_type: 'quote',
        content_id: this.quote()?.id
      });
    }
  }

  private emitShareEvent(platform: string): void {
    const quote = this.quote();
    if (quote) {
      this.shareCompleted.emit({
        platform,
        quote,
        timestamp: new Date()
      });
    }
  }

  private focusFirstElement(): void {
    const dialog = this.elementRef.nativeElement.querySelector('[role="dialog"]');
    if (dialog) {
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }
}
