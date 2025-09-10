# Quickstart Guide: Quote of the Day

## Prerequisites

- Node.js 18+ installed
- Angular CLI 18+ installed globally
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+)

## Quick Setup (5 minutes)

### 1. Project Initialization
```bash
# Create new Angular project with standalone components
ng new daily-quote --style=scss --routing=false --standalone
cd daily-quote

# Add Angular Material and Tailwind CSS
ng add @angular/material
npm install tailwindcss @tailwindcss/typography @angular/cdk
npx tailwindcss init

# Install additional dependencies
npm install @angular/testing-library jest @axe-core/playwright
```

### 2. Configure Tailwind CSS
```bash
# Add Tailwind to styles
echo '@tailwind base; @tailwind components; @tailwind utilities;' > src/styles.scss

# Update tailwind.config.js
cat > tailwind.config.js << 'EOF'
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {}
  },
  plugins: [@tailwindcss/typography]
}
EOF
```

### 3. Generate Components
```bash
# Generate core components
ng generate component components/quote-of-the-day --standalone
ng generate component components/quote-display --standalone  
ng generate component components/loading-spinner --standalone --inline-template
ng generate component components/social-share --standalone

# Generate services
ng generate service services/quote
ng generate service services/cache  
ng generate service services/error-handler
```

### 4. Start Development
```bash
# Start development server
ng serve

# Run tests (in separate terminal)
npm test

# Check accessibility
npm run test:a11y
```

## Verification Checklist

### ✅ Basic Setup Verification
1. **Project Structure**: Verify components and services generated correctly
2. **Dependencies**: Check all packages installed without errors
3. **Development Server**: Application loads at `http://localhost:4200`
4. **Build Process**: `ng build` completes successfully

### ✅ Component Integration Test
1. **Quote Display**: Click "Get Daily Quote" button shows loading spinner
2. **Error Handling**: Simulate network error shows fallback quote
3. **Copy Function**: Click copy button shows success message
4. **Social Share**: Share buttons open correct social platforms
5. **Keyboard Navigation**: Tab through all interactive elements

### ✅ Accessibility Verification
1. **Screen Reader**: Test with screen reader (NVDA/JAWS/VoiceOver)
2. **Keyboard Only**: Navigate entire app without mouse
3. **Color Contrast**: All text meets 4.5:1 contrast ratio
4. **Focus Management**: Visible focus indicators on all interactive elements
5. **ARIA Labels**: All buttons and regions have descriptive labels

### ✅ Performance Verification
1. **Bundle Size**: Initial bundle < 100KB gzipped
2. **Load Time**: First Contentful Paint < 1.5s
3. **Quote Generation**: New quote appears within 500ms
4. **Cache Function**: Offline mode shows cached quotes
5. **Mobile Performance**: Smooth on 3G connection

## User Story Validation

### Primary User Story: "Get Daily Inspiration"
**Scenario**: User wants motivational quote for their day

**Test Steps**:
1. Open application in browser
2. Verify quote button is visible and labeled clearly
3. Click "Get Daily Quote" button
4. Verify loading state appears
5. Verify inspirational quote appears with author
6. Verify quote is between 10-150 characters
7. Verify no inappropriate content

**Expected Result**: User sees motivational quote with clear attribution

### Copy Quote Story: "Share Quote Easily"  
**Scenario**: User wants to copy quote for personal use

**Test Steps**:
1. Generate a quote (from primary story)
2. Locate copy button near quote
3. Click copy button
4. Verify success feedback appears
5. Paste into external application (email, notes)
6. Verify full quote with author is copied

**Expected Result**: Quote with author copied to clipboard with user feedback

### Social Share Story: "Share Inspiration"
**Scenario**: User wants to share quote on social media

**Test Steps**:
1. Generate a quote (from primary story)
2. Locate social share buttons (Twitter, LinkedIn)
3. Click Twitter share button
4. Verify Twitter compose window opens
5. Verify quote is pre-populated in tweet
6. Verify character count is appropriate for platform

**Expected Result**: Social platform opens with quote pre-filled

### Accessibility Story: "Inclusive Access"
**Scenario**: User with screen reader wants to use application

**Test Steps**:
1. Navigate to application with screen reader active
2. Verify page structure is announced clearly
3. Navigate to quote button with keyboard
4. Activate button and verify loading state announced
5. Verify new quote content is announced automatically
6. Navigate to copy/share buttons with keyboard

**Expected Result**: Full functionality available via screen reader and keyboard

### Offline Story: "Reliable Access"
**Scenario**: User loses internet connection but wants quotes

**Test Steps**:
1. Use application online and generate several quotes
2. Disable internet connection
3. Refresh page and verify basic functionality
4. Click "Get Daily Quote" button
5. Verify cached quote appears
6. Verify offline indicator shows (if implemented)

**Expected Result**: Application continues working with cached quotes

## Development Workflow Validation

### Test-Driven Development (TDD) Verification
1. **Red Phase**: Write failing test for new feature
2. **Green Phase**: Implement minimum code to pass test
3. **Refactor Phase**: Clean up code while maintaining green tests
4. **Git Commits**: Verify tests committed before implementation

### Code Quality Gates
1. **Linting**: `ng lint` passes without errors
2. **TypeScript**: Strict mode enabled, no `any` types
3. **Testing**: 80%+ code coverage maintained
4. **Accessibility**: axe-core tests pass
5. **Performance**: Bundle size within limits

### Integration Testing
1. **Component Integration**: Components work together correctly
2. **Service Integration**: Services communicate properly
3. **API Integration**: External APIs return expected data
4. **Error Integration**: Error scenarios handled gracefully

## Troubleshooting

### Common Issues

**Issue**: Quotes not loading from API
- **Check**: Network connection and API status
- **Solution**: Verify fallback quotes are working
- **Prevention**: Test offline scenarios regularly

**Issue**: Accessibility tests failing  
- **Check**: Color contrast and ARIA labels
- **Solution**: Use Angular CDK accessibility utilities
- **Prevention**: Run accessibility tests in CI/CD

**Issue**: Bundle size exceeding limits
- **Check**: Unnecessary imports and dependencies
- **Solution**: Use tree-shaking and lazy loading
- **Prevention**: Monitor bundle size in builds

### Performance Optimization

**Slow Loading**:
- Enable Angular production build optimizations
- Implement lazy loading for non-critical features
- Use Angular service workers for caching

**Memory Issues**:
- Limit cache size to 50 quotes maximum
- Implement proper cleanup for expired cache entries
- Use OnPush change detection strategy

## Next Steps

After completing quickstart verification:

1. **Customization**: Modify styling and animations
2. **Enhanced Features**: Add quote categories or user preferences  
3. **Analytics**: Implement usage tracking (privacy-compliant)
4. **Progressive Web App**: Add PWA capabilities
5. **Deployment**: Set up CI/CD pipeline for production

## Support Resources

- **Angular Documentation**: https://angular.dev
- **Tailwind CSS Guide**: https://tailwindcss.com/docs
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Testing Library**: https://testing-library.com/docs/angular-testing-library/intro
- **Project Repository**: [Your repository URL]
