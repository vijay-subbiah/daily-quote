Design and implement a responsive "Quote of the Day" web component with the following specifications:

CORE FUNCTIONALITY:
1. Create a primary button with:
   - Label: "Get Daily Quote"
   - ARIA attributes for accessibility
   - Clear hover and focus states
   - Disabled state during quote fetching

2. Quote Display Requirements:
   - Container with distinct visual hierarchy
   - Quote text (font size: 18-24px)
   - Author attribution (font size: 14-16px)
   - Loading spinner during fetch
   - Error message template for failed requests

3. Quote Content Criteria:
   - Professional motivational/inspirational content
   - Length: 10-150 characters
   - Must include author attribution
   - No explicit, political, or controversial content

4. User Interactions:
   - Click/tap to generate new quote
   - Copy quote feature with success feedback
   - Social share buttons for Twitter/LinkedIn
   - Keyboard navigation support

TECHNICAL IMPLEMENTATION:
1. Data Source:
   - Use quotes.api.example.com/v1/quotes [replace with actual API]
   - Implement local fallback quotes array
   - Cache up to 50 quotes in localStorage

2. Performance:
   - Debounce quote generation (750ms)
   - Preload next quote after display
   - Maximum 100 API calls per hour

3. Error Handling:
   - Display user-friendly error messages
   - Retry failed API calls (max 3 attempts)
   - Fallback to cached quotes when offline

4. Accessibility:
   - WCAG 2.1 Level AA compliance
   - Screen reader announcements for new quotes
   - Minimum contrast ratio: 4.5:1
   - Focus management for interactive elements

Deliver production-ready code following modern web standards and progressive enhancement principles.