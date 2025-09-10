/**
 * Quote Interface Implementation
 * T028: Core interface for quote data structure
 * 
 * This interface defines the complete structure for quote objects
 * used throughout the application.
 */

export interface Quote {
  // Core identification
  id: string;
  
  // Content (10-150 characters as per validation tests)
  text: string;
  author: string;
  
  // Metadata
  source: 'quotegarden' | 'quotable' | 'zenquotes' | 'dummyjson' | 'local';
  category?: string;
  tags?: string[];
  
  // Computed properties
  length: number; // Automatically calculated from text.length
  
  // Timestamps
  dateAdded: Date;
  
  // Quality indicators
  popularity?: number; // 0-100 score
  verified?: boolean;  // Whether quote attribution is verified
}

/**
 * Type guard to check if an object is a valid Quote
 */
export function isQuote(obj: any): obj is Quote {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.text === 'string' &&
    typeof obj.author === 'string' &&
    ['quotegarden', 'quotable', 'zenquotes', 'dummyjson', 'local'].includes(obj.source) &&
    typeof obj.length === 'number' &&
    obj.dateAdded instanceof Date
  );
}

/**
 * Factory function to create a Quote with computed properties
 */
export function createQuote(data: Omit<Quote, 'length' | 'dateAdded'> & { dateAdded?: Date }): Quote {
  return {
    ...data,
    length: data.text.length,
    dateAdded: data.dateAdded || new Date(),
    verified: data.verified ?? false,
    popularity: data.popularity ?? 0
  };
}
