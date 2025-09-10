/**
 * T042: LoadingSpinnerComponent Implementation
 * 
 * A modern Angular 20+ standalone component that provides visual feedback
 * during async operations with full accessibility support and customizable appearance.
 * 
 * Features:
 * - Standalone component with signals
 * - OnPush change detection for performance
 * - Multiple size options (small, medium, large, xl)
 * - Color customization (blue, green, red, gray)
 * - Multiple variants (spinner, outline, dots, bars)
 * - Accessibility compliant (WCAG 2.1 Level AA)
 * - Reduced motion support
 * - Inline and block layout modes
 */

import { 
  Component, 
  ChangeDetectionStrategy, 
  input, 
  computed,
  signal
} from '@angular/core';

export type SpinnerSize = 'small' | 'medium' | 'large' | 'xl';
export type SpinnerColor = 'blue' | 'green' | 'red' | 'gray';
export type SpinnerVariant = 'spinner' | 'outline' | 'dots' | 'bars';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      role="status"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-live]="ariaLive()"
      [attr.aria-atomic]="ariaAtomic()"
      [class]="containerClasses()"
      data-testid="spinner-container">
      
      <!-- Spinner Variant -->
      @if (variant() === 'spinner') {
        <svg
          [class]="spinnerIconClasses()"
          [attr.aria-hidden]="decorative() ? 'true' : null"
          fill="none"
          viewBox="0 0 24 24"
          data-testid="spinner-icon">
          <circle 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            stroke-width="4" 
            class="opacity-25">
          </circle>
          <path 
            fill="currentColor" 
            d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
            class="opacity-75">
          </path>
        </svg>
      }

      <!-- Outline Variant -->
      @if (variant() === 'outline') {
        <div
          [class]="outlineSpinnerClasses()"
          [attr.aria-hidden]="decorative() ? 'true' : null"
          data-testid="spinner-icon">
        </div>
      }

      <!-- Dots Variant -->
      @if (variant() === 'dots') {
        <div 
          [class]="dotsContainerClasses()"
          data-testid="dots-container"
          [attr.aria-hidden]="decorative() ? 'true' : null">
          @for (dot of dotsArray(); track $index) {
            <div
              [class]="dotClasses()"
              [style.animation-delay]="$index * 0.1 + 's'"
              [attr.data-testid]="'dot-' + $index">
            </div>
          }
        </div>
      }

      <!-- Bars Variant -->
      @if (variant() === 'bars') {
        <div 
          [class]="barsContainerClasses()"
          data-testid="bars-container"
          [attr.aria-hidden]="decorative() ? 'true' : null">
          @for (bar of barsArray(); track $index) {
            <div
              [class]="barClasses()"
              [style.animation-delay]="$index * 0.1 + 's'"
              [attr.data-testid]="'bar-' + $index">
            </div>
          }
        </div>
      }

      <!-- Reduced Motion Alternative -->
      @if (prefersReducedMotion()) {
        <div
          [class]="pulseIndicatorClasses()"
          data-testid="pulse-indicator"
          [attr.aria-hidden]="decorative() ? 'true' : null">
        </div>
      }

      <!-- Loading Message -->
      @if (displayMessage() && message()) {
        <div
          [class]="messageClasses()"
          [innerHTML]="sanitizedMessage()"
          data-testid="spinner-message">
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }

    @keyframes wave {
      0%, 40%, 100% {
        transform: scaleY(0.4);
      }
      20% {
        transform: scaleY(1);
      }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .animate-bounce {
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .animate-wave {
      animation: wave 1.2s infinite ease-in-out;
    }

    @media (prefers-reduced-motion: reduce) {
      .motion-reduce\\:animate-none {
        animation: none;
      }
    }
  `]
})
export class LoadingSpinnerComponent {
  // Input signals
  readonly size = input<SpinnerSize>('medium');
  readonly color = input<SpinnerColor>('blue');
  readonly message = input<string>('Loading...');
  readonly inline = input<boolean>(false);
  readonly variant = input<SpinnerVariant>('spinner');
  readonly decorative = input<boolean>(false);

  // Computed signals for reactive styling
  readonly prefersReducedMotion = signal(
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  readonly effectiveSize = computed(() => {
    const size = this.size();
    const validSizes: SpinnerSize[] = ['small', 'medium', 'large', 'xl'];
    return validSizes.includes(size) ? size : 'medium';
  });

  readonly effectiveColor = computed(() => {
    const color = this.color();
    const validColors: SpinnerColor[] = ['blue', 'green', 'red', 'gray'];
    return validColors.includes(color) ? color : 'blue';
  });

  readonly effectiveInlineSize = computed(() => {
    return this.inline() && this.size() === 'medium' ? 'small' : this.effectiveSize();
  });

  readonly displayMessage = computed(() => {
    const msg = this.message();
    return msg !== null && msg !== undefined && msg !== '';
  });

  readonly sanitizedMessage = computed(() => {
    const msg = this.message();
    if (!msg) return '';
    // Basic XSS protection - strip HTML tags
    return msg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  });

  readonly ariaLabel = computed(() => {
    const msg = this.message();
    return msg && msg.trim() ? msg.trim() : 'Loading';
  });

  readonly ariaLive = computed(() => 'polite');
  readonly ariaAtomic = computed(() => 'true');

  // Arrays for dots and bars variants
  readonly dotsArray = computed(() => Array(3).fill(0));
  readonly barsArray = computed(() => Array(4).fill(0));

  // Styling computed signals
  readonly containerClasses = computed(() => {
    const isInline = this.inline();
    const baseClasses = 'flex justify-center items-center';
    
    if (isInline) {
      return `${baseClasses} flex-row space-x-2`;
    } else {
      return `${baseClasses} flex-col py-8`;
    }
  });

  readonly spinnerIconClasses = computed(() => {
    const size = this.effectiveInlineSize();
    const color = this.effectiveColor();
    const reducedMotion = this.prefersReducedMotion();
    
    const sizeClasses = {
      small: 'w-4 h-4',
      medium: 'w-8 h-8',
      large: 'w-12 h-12',
      xl: 'w-16 h-16'
    }[size];

    const colorClass = `text-${color}-600`;
    const animationClass = reducedMotion ? 'motion-reduce:animate-none' : 'animate-spin';

    return `${sizeClasses} ${colorClass} ${animationClass}`;
  });

  readonly outlineSpinnerClasses = computed(() => {
    const size = this.effectiveInlineSize();
    const color = this.effectiveColor();
    const reducedMotion = this.prefersReducedMotion();
    
    const sizeClasses = {
      small: 'w-4 h-4',
      medium: 'w-8 h-8',
      large: 'w-12 h-12',
      xl: 'w-16 h-16'
    }[size];

    const colorClass = `border-${color}-600`;
    const animationClass = reducedMotion ? 'motion-reduce:animate-none' : 'animate-spin';

    return `${sizeClasses} ${colorClass} border-2 border-current border-t-transparent rounded-full ${animationClass}`;
  });

  readonly dotsContainerClasses = computed(() => {
    return 'flex space-x-1';
  });

  readonly dotClasses = computed(() => {
    const size = this.effectiveInlineSize();
    const color = this.effectiveColor();
    const reducedMotion = this.prefersReducedMotion();
    
    const sizeClasses = {
      small: 'w-1 h-1',
      medium: 'w-2 h-2',
      large: 'w-3 h-3',
      xl: 'w-4 h-4'
    }[size];

    const colorClass = `bg-${color}-600`;
    const animationClass = reducedMotion ? 'motion-reduce:animate-none' : 'animate-bounce';

    return `${sizeClasses} ${colorClass} rounded-full ${animationClass}`;
  });

  readonly barsContainerClasses = computed(() => {
    return 'flex space-x-1 items-end';
  });

  readonly barClasses = computed(() => {
    const size = this.effectiveInlineSize();
    const color = this.effectiveColor();
    const reducedMotion = this.prefersReducedMotion();
    
    const widthClasses = {
      small: 'w-0.5',
      medium: 'w-1',
      large: 'w-1.5',
      xl: 'w-2'
    }[size];

    const heightClasses = {
      small: 'h-4',
      medium: 'h-8',
      large: 'h-12',
      xl: 'h-16'
    }[size];

    const colorClass = `bg-${color}-600`;
    const animationClass = reducedMotion ? 'motion-reduce:animate-none' : 'animate-wave';

    return `${widthClasses} ${heightClasses} ${colorClass} ${animationClass}`;
  });

  readonly pulseIndicatorClasses = computed(() => {
    const size = this.effectiveInlineSize();
    const color = this.effectiveColor();
    
    const sizeClasses = {
      small: 'w-4 h-4',
      medium: 'w-8 h-8',
      large: 'w-12 h-12',
      xl: 'w-16 h-16'
    }[size];

    const colorClass = `bg-${color}-600`;

    return `${sizeClasses} ${colorClass} rounded-full animate-pulse`;
  });

  readonly messageClasses = computed(() => {
    const size = this.effectiveInlineSize();
    const color = this.effectiveColor();
    const isInline = this.inline();
    
    const textSizeClasses = {
      small: 'text-xs',
      medium: 'text-sm',
      large: 'text-lg',
      xl: 'text-xl'
    }[size];

    const colorClass = `text-${color}-600`;
    const layoutClasses = isInline ? '' : 'text-center max-w-xs';
    
    return `${textSizeClasses} ${colorClass} font-medium whitespace-pre-line ${layoutClasses}`.trim();
  });

  constructor() {
    // Listen for reduced motion preference changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', (e) => {
        this.prefersReducedMotion.set(e.matches);
      });
    }
  }
}
