#!/bin/bash

# Local Performance Testing Script
# Usage: ./run-performance-tests.sh

set -e

echo "🚀 Starting Performance Testing Suite..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js and npm are available
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

print_status "Dependencies ready"

# Run linting
echo "🔍 Running code linting..."
npm run lint
print_status "Linting passed"

# Run unit tests
echo "🧪 Running unit tests..."
npm run test -- --watchAll=false --coverage
print_status "Unit tests passed"

# Build for production
echo "🏗️  Building for production..."
npm run build:prod
print_status "Production build completed"

# Run bundle analysis
echo "📊 Analyzing bundle size..."
npm run build:analyze -- --output-path=dist/bundle-analysis --open=false
print_status "Bundle analysis completed"

# Check bundle sizes
echo "📏 Checking bundle size limits..."
npm run bundlesize
print_status "Bundle size checks passed"

# Start the application server in background
echo "🚀 Starting application server..."
npm start &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to be ready..."
npx wait-on http://localhost:4200 --timeout 60000

if [ $? -eq 0 ]; then
    print_status "Server is ready"
else
    print_error "Server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Run Lighthouse audit
echo "🔍 Running Lighthouse performance audit..."
npx lighthouse http://localhost:4200 \
    --budget-path=lighthouse-budget.json \
    --output=json \
    --output=html \
    --output-path=./lighthouse-report \
    --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage" \
    --preset=desktop

if [ $? -eq 0 ]; then
    print_status "Lighthouse audit completed - check lighthouse-report.html"
else
    print_warning "Lighthouse audit completed with warnings"
fi

# Run performance E2E tests
echo "🎭 Running performance E2E tests..."
npm run e2e -- --grep="performance"

if [ $? -eq 0 ]; then
    print_status "Performance E2E tests passed"
else
    print_warning "Some performance E2E tests failed"
fi

# Cleanup
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true

echo ""
print_status "Performance testing completed!"
echo ""
echo "📋 Results Summary:"
echo "   • Bundle analysis: dist/bundle-analysis/"
echo "   • Lighthouse report: lighthouse-report.html"
echo "   • Test coverage: coverage/"
echo ""
echo "🔗 To view bundle analysis: npm run build:analyze"
echo "🔗 To view Lighthouse report: open lighthouse-report.html"
