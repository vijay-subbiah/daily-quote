# GitHub Copilot Instructions: Quote of the Day

## Project Context
Angular 20+ standalone component application for displaying inspirational quotes with accessibility compliance and social sharing features.

## Technology Stack
- **Framework**: Angular 20+ with standalone components, signals, and modern APIs
- **Styling**: Tailwind CSS 3.4+ with responsive design utilities
- **State Management**: Angular Signals with computed properties
- **Testing**: Jest + Angular Testing Library + Playwright + axe-core
- **Build**: Angular CLI with ESBuild optimization

## Component Architecture Guidelines

### Standalone Components (Required)
```typescript
@Component({
  standalone: true,
  selector: 'app-quote-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, /* other imports */],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    }
    @if (quote(); as currentQuote) {
      <blockquote [class]="quoteClasses()">
        {{ currentQuote.text }}
      </blockquote>
    }
  `
})
```

### Signal-Based State Management
```typescript
export class QuoteComponent {
  // Use signal() for reactive state
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Use computed() for derived state
  quote = computed(() => this.quoteData());
  canGenerateNew = computed(() => !this.loading() && !this.error());
  
  // Use input() and output() functions
  quoteData = input<Quote | null>(null);
  quoteSelected = output<Quote>();
  
  // Use inject() for dependencies
  private quoteService = inject(QuoteService);
}
```

### Modern Template Syntax
- Use `@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use `[class]` and `[style]` bindings instead of `ngClass`/`ngStyle`
- Use `async` pipe for observables in templates

## Service Patterns

### Injectable Services
```typescript
@Injectable({
  providedIn: 'root'
})
export class QuoteService {
  private http = inject(HttpClient);
  private cache = inject(CacheService);
  
  getRandomQuote(): Observable<Quote> {
    // Implementation with error handling and caching
  }
}
```

## Accessibility Requirements (WCAG 2.1 Level AA)

### ARIA Implementation
```typescript
// Use Angular CDK for accessibility utilities
import { A11yModule } from '@angular/cdk/a11y';

// Proper ARIA attributes
template: `
  <button 
    [attr.aria-label]="buttonAriaLabel()"
    [attr.aria-describedby]="errorId"
    (click)="generateQuote()">
    Get Daily Quote
  </button>
  
  <div [attr.aria-live]="'polite'" 
       [attr.aria-atomic]="true">
    @if (currentQuote()) {
      <blockquote role="blockquote">
        {{ currentQuote().text }}
      </blockquote>
    }
  </div>
`
```

### Focus Management
```typescript
// Use CDK focus utilities
import { FocusMonitor } from '@angular/cdk/a11y';

constructor() {
  private focusMonitor = inject(FocusMonitor);
}

// Manage focus for keyboard users
manageFocus(element: ElementRef) {
  this.focusMonitor.focusVia(element, 'keyboard');
}
```

## Testing Patterns

### Component Testing
```typescript
import { render, screen } from '@testing-library/angular';
import { axe } from '@axe-core/playwright';

describe('QuoteDisplayComponent', () => {
  it('should render quote with accessibility compliance', async () => {
    const { container } = await render(QuoteDisplayComponent, {
      componentInputs: { quote: mockQuote }
    });
    
    // Test content
    expect(screen.getByRole('blockquote')).toBeInTheDocument();
    
    // Test accessibility
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Service Testing
```typescript
describe('QuoteService', () => {
  it('should handle API errors gracefully', () => {
    // Arrange
    const errorResponse = new HttpErrorResponse({ status: 429 });
    httpMock.expectOne('/api/quotes').error(errorResponse);
    
    // Act & Assert
    service.getRandomQuote().subscribe({
      next: (quote) => expect(quote.source).toBe('local'),
      error: () => fail('Should fallback to local quotes')
    });
  });
});
```

## Data Models

### Core Interfaces
```typescript
interface Quote {
  id: string;
  text: string;          // 10-150 characters
  author: string;
  source: 'quotegarden' | 'quotable' | 'local';
  category?: string;
  length: number;
}

interface AppState {
  currentQuote: Quote | null;
  isLoading: boolean;
  error: string | null;
  cache: CacheEntry[];
}
```

## Error Handling Patterns

### HTTP Interceptors
```typescript
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => timer(Math.pow(2, retryCount) * 1000)
      }),
      catchError(this.handleError)
    );
  }
}
```

### User-Friendly Error Messages
```typescript
// Convert technical errors to user-friendly messages
private getUserFriendlyError(error: any): string {
  if (error.status === 429) return 'Too many requests. Please try again later.';
  if (error.status === 0) return 'Network connection unavailable. Using cached quotes.';
  return 'Unable to fetch new quote. Please try again.';
}
```

## Performance Optimizations

### OnPush Change Detection
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ... component config
})
```

### Lazy Loading
```typescript
// Dynamic imports for large features
const SocialShareModule = () => import('./social-share/social-share.module');
```

### Caching Strategy
```typescript
// Implement intelligent caching
private cacheQuote(quote: Quote): void {
  if (this.cache.length >= 50) {
    this.evictLeastRecentlyUsed();
  }
  this.cache.push(new CacheEntry(quote));
}
```

## Tailwind CSS Guidelines

### Responsive Design
```html
<div class="
  flex flex-col 
  space-y-4 
  p-4 sm:p-6 lg:p-8
  max-w-md sm:max-w-lg lg:max-w-2xl
  mx-auto
">
```

### Accessibility-First Styling
```html
<button class="
  px-4 py-2 
  bg-blue-600 hover:bg-blue-700 
  focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  text-white font-medium rounded-lg
  transition-colors duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
```

## Code Quality Standards

### TypeScript Strictness
- Enable strict mode in tsconfig.json
- Avoid `any` type - use `unknown` when uncertain
- Prefer type inference when obvious
- Use proper return types for all functions

### Naming Conventions
- Components: PascalCase (QuoteDisplayComponent)
- Services: PascalCase with Service suffix (QuoteService)
- Methods: camelCase (generateNewQuote)
- Properties: camelCase (currentQuote)
- Constants: UPPER_SNAKE_CASE (MAX_CACHE_SIZE)

## Recent Implementation Context

The project follows modern Angular best practices:
1. Standalone components without NgModules
2. Signals for reactive state management
3. Native control flow syntax (@if, @for, @switch)
4. input()/output() functions instead of decorators
5. inject() function for dependency injection
6. Comprehensive accessibility testing with axe-core

Focus on creating production-ready, accessible, and performant code that follows the established patterns and maintains consistency across the application.
