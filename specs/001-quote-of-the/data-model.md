# Data Model: Quote of the Day

## Core Entities

### Quote
**Purpose**: Represents an inspirational quote with author attribution

**Fields**:
- `id`: string - Unique identifier for caching and deduplication
- `text`: string - Quote content (10-150 characters as per requirements)
- `author`: string - Quote author name
- `source`: string - Origin API or 'local' for fallback quotes
- `category?`: string - Optional category/tag for future filtering
- `length`: number - Character count for quick filtering

**Validation Rules**:
- `text`: Required, 10-150 characters, no HTML content
- `author`: Required, non-empty string, no special characters
- `id`: Required, unique within cache
- `source`: Required, enum of allowed sources

**State Transitions**:
```
NEW → VALIDATED → CACHED → DISPLAYED → EXPIRED
```

**Example**:
```typescript
interface Quote {
  id: string;
  text: string;
  author: string;
  source: 'quotegarden' | 'quotable' | 'local';
  category?: string;
  length: number;
}
```

### Cache Entry
**Purpose**: Manages local storage of quotes for offline functionality

**Fields**:
- `quote`: Quote - The cached quote object
- `timestamp`: number - When quote was cached (Unix timestamp)
- `accessCount`: number - How many times accessed (for LRU eviction)
- `lastAccessed`: number - Last access timestamp
- `expiresAt`: number - Expiration timestamp (24 hours from cache)

**Validation Rules**:
- `timestamp`: Required, valid Unix timestamp
- `accessCount`: Required, non-negative integer
- `expiresAt`: Required, must be future timestamp

**Cache Management**:
- Maximum 50 quotes stored
- LRU eviction when cache full
- 24-hour expiration per quote
- Automatic cleanup of expired entries

**Example**:
```typescript
interface CacheEntry {
  quote: Quote;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  expiresAt: number;
}
```

### API Response
**Purpose**: Standardizes responses from different quote APIs

**Fields**:
- `success`: boolean - Request success status
- `data`: Quote | null - Quote data if successful
- `error`: string | null - Error message if failed
- `source`: string - Which API provided the response
- `rateLimit`: RateLimitInfo - Rate limiting information

**Validation Rules**:
- `success`: Required boolean
- `data`: Required if success=true, null if success=false
- `error`: Required if success=false, null if success=true
- `source`: Required, valid API source identifier

**Example**:
```typescript
interface ApiResponse {
  success: boolean;
  data: Quote | null;
  error: string | null;
  source: string;
  rateLimit: {
    remaining: number;
    resetTime: number;
  };
}
```

### Application State
**Purpose**: Manages the reactive state of the application

**Fields**:
- `currentQuote`: Quote | null - Currently displayed quote
- `isLoading`: boolean - Loading state for UI
- `error`: string | null - Current error message
- `cache`: CacheEntry[] - Array of cached quotes
- `apiCallCount`: number - Hourly API call counter
- `lastApiCall`: number - Timestamp of last API call

**State Transitions**:
```
IDLE → LOADING → SUCCESS|ERROR → IDLE
```

**Computed Properties**:
- `canFetchNew`: boolean - Whether new API call is allowed (rate limiting)
- `hasCache`: boolean - Whether cached quotes are available
- `cacheSize`: number - Current number of cached quotes

**Example**:
```typescript
interface AppState {
  currentQuote: Quote | null;
  isLoading: boolean;
  error: string | null;
  cache: CacheEntry[];
  apiCallCount: number;
  lastApiCall: number;
}
```

## Relationships

### Quote → Cache Entry
- One-to-One: Each quote can have one cache entry
- Cache entry contains the quote plus metadata

### Cache Entry → Application State
- One-to-Many: Application state contains multiple cache entries
- Managed through cache service

### API Response → Quote
- One-to-One: Each successful API response produces one quote
- Failed responses produce error states

## Data Flow

```
API Call → API Response → Quote Validation → Cache Storage → State Update → UI Display
```

### Validation Pipeline
1. **API Response Validation**: Check structure and required fields
2. **Quote Content Validation**: Verify length, characters, author
3. **Deduplication Check**: Ensure quote not already cached
4. **Cache Validation**: Verify cache space and expiration rules

### Error Handling
- **Validation Errors**: Return user-friendly error messages
- **API Errors**: Fallback to cached quotes or local quotes
- **Cache Errors**: Clear corrupted cache and restart
- **Network Errors**: Use cached quotes with offline indicator

## Performance Considerations

### Caching Strategy
- **Cache First**: Check cache before API calls
- **Background Refresh**: Preload next quote after display
- **Intelligent Eviction**: LRU with access count weighting

### Memory Management
- **Bounded Cache**: Maximum 50 quotes prevents memory bloat
- **Cleanup Schedule**: Regular removal of expired entries
- **JSON Serialization**: Efficient localStorage storage

### API Optimization
- **Rate Limiting**: Prevent API abuse and maintain access
- **Debouncing**: 750ms minimum between user-triggered calls
- **Retry Logic**: Exponential backoff for failed requests
