# API Contracts: External Quote Services

## QuoteGarden API Contract (Primary)

**Base URL**: `https://quotegarden.com/api/v3`

### GET /quotes/random

**Purpose**: Fetch a random inspirational quote

**Request**:
```typescript
interface QuoteGardenRequest {
  // No parameters required for random quote
}
```

**Response**:
```typescript
interface QuoteGardenResponse {
  statusCode: number;
  message: string;
  pagination: {
    currentPage: number;
    nextPage: number | null;
    totalPages: number;
  };
  data: {
    _id: string;
    quoteText: string;
    quoteAuthor: string;
    quoteGenre: string;
    __v: number;
  }[];
}
```

**Success Response Example**:
```json
{
  "statusCode": 200,
  "message": "Quotes",
  "pagination": {
    "currentPage": 1,
    "nextPage": null,
    "totalPages": 1
  },
  "data": [
    {
      "_id": "5d91b45d9980192a317c8acc",
      "quoteText": "The only way to do great work is to love what you do.",
      "quoteAuthor": "Steve Jobs",
      "quoteGenre": "motivational",
      "__v": 0
    }
  ]
}
```

**Error Response Example**:
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "data": []
}
```

**Rate Limits**:
- 100 requests per hour
- 429 status code when exceeded
- Reset time in headers

---

## Quotable API Contract (Backup)

**Base URL**: `https://quotable.io`

### GET /random

**Purpose**: Fetch a random quote as backup source

**Request**:
```typescript
interface QuotableRequest {
  minLength?: number;  // Minimum quote length
  maxLength?: number;  // Maximum quote length (150 for our use case)
  tags?: string;       // Optional genre filtering
}
```

**Response**:
```typescript
interface QuotableResponse {
  _id: string;
  content: string;
  author: string;
  tags: string[];
  authorSlug: string;
  length: number;
  dateAdded: string;
  dateModified: string;
}
```

**Success Response Example**:
```json
{
  "_id": "abc123",
  "content": "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "author": "Winston Churchill",
  "tags": ["motivational", "success"],
  "authorSlug": "winston-churchill",
  "length": 85,
  "dateAdded": "2020-01-01",
  "dateModified": "2020-01-01"
}
```

**Error Response Example**:
```json
{
  "statusCode": 404,
  "statusMessage": "Not Found"
}
```

**Rate Limits**:
- 180 requests per minute
- No API key required
- CORS enabled

---

## Local Fallback Contract

**Purpose**: Provide quotes when external APIs are unavailable

### FallbackQuoteService

**Interface**:
```typescript
interface FallbackQuoteService {
  getRandomQuote(): Quote;
  getAllQuotes(): Quote[];
  getQuoteById(id: string): Quote | null;
}
```

**Local Quote Format**:
```typescript
interface LocalQuote {
  id: string;
  text: string;
  author: string;
  source: 'local';
  category: string;
  length: number;
}
```

**Sample Local Quotes**:
```json
[
  {
    "id": "local-001",
    "text": "The only way to do great work is to love what you do.",
    "author": "Steve Jobs",
    "source": "local",
    "category": "motivation",
    "length": 54
  },
  {
    "id": "local-002", 
    "text": "Innovation distinguishes between a leader and a follower.",
    "author": "Steve Jobs",
    "source": "local",
    "category": "leadership",
    "length": 60
  }
]
```

---

## Unified Quote Service Contract

**Purpose**: Normalize responses from different APIs into consistent format

### QuoteService Interface

```typescript
interface QuoteService {
  fetchQuote(): Observable<QuoteResponse>;
  normalizeQuote(rawResponse: any, source: string): Quote;
  validateQuote(quote: Partial<Quote>): ValidationResult;
}
```

### Normalized Response Format

```typescript
interface QuoteResponse {
  success: boolean;
  quote: Quote | null;
  error: string | null;
  source: 'quotegarden' | 'quotable' | 'local';
  metadata: {
    apiCallsRemaining: number;
    cacheHit: boolean;
    responseTime: number;
  };
}
```

### Quote Validation Contract

```typescript
interface QuoteValidation {
  isValidLength(text: string): boolean;     // 10-150 characters
  hasValidAuthor(author: string): boolean;  // Non-empty, valid characters
  isAppropriate(text: string): boolean;     // Content filtering
  isUnique(quote: Quote, cache: Quote[]): boolean; // Deduplication
}
```

---

## Error Handling Contracts

### API Error Classification

```typescript
enum ApiErrorType {
  NETWORK_ERROR = 'network',
  RATE_LIMIT = 'rate_limit', 
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server',
  VALIDATION_ERROR = 'validation',
  TIMEOUT = 'timeout'
}

interface ApiError {
  type: ApiErrorType;
  message: string;
  statusCode?: number;
  retryAfter?: number;
  source: string;
}
```

### Retry Logic Contract

```typescript
interface RetryConfig {
  maxAttempts: 3;
  baseDelay: 1000;     // 1 second
  maxDelay: 10000;     // 10 seconds
  exponentialBackoff: true;
  retryCondition: (error: ApiError) => boolean;
}
```

**Retry Conditions**:
- Network timeouts: Retry
- Server errors (5xx): Retry
- Rate limit (429): Retry after delay
- Client errors (4xx): Don't retry
- Validation errors: Don't retry

---

## Performance Monitoring Contract

### Request Metrics

```typescript
interface RequestMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  source: string;
  success: boolean;
  cacheHit: boolean;
  retryCount: number;
}
```

### Service Level Objectives

- **Primary API Response Time**: < 2 seconds 95th percentile
- **Backup API Response Time**: < 3 seconds 95th percentile
- **Cache Hit Ratio**: > 80% for repeat requests
- **Error Rate**: < 5% excluding rate limits
- **Availability**: > 99% with fallback

### Circuit Breaker Contract

```typescript
interface CircuitBreakerConfig {
  failureThreshold: 5;     // Failures before opening
  recoveryTimeout: 30000;  // 30 seconds
  monitoringPeriod: 60000; // 1 minute
  onOpen: () => void;      // Switch to fallback
  onClose: () => void;     // Resume normal operation
}
```
