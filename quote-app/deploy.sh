#!/bin/bash

# Deploy script for Quote of the Day application
echo "🚀 Deploying Quote of the Day application..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the quote-app directory."
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: Working directory is not clean. Please commit or stash changes first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm test -- --coverage --watchAll=false

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Deployment aborted."
    exit 1
fi

# Build application
echo "🔨 Building production application..."
npm run build -- --configuration production --base-href "/daily-quote/"

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Deployment aborted."
    exit 1
fi

# Push to GitHub (triggers GitHub Actions)
echo "📤 Pushing to GitHub..."
git push origin main

echo "✅ Deployment initiated! Check GitHub Actions for progress:"
echo "   https://github.com/vijay-subbiah/daily-quote/actions"
echo ""
echo "🌐 Once deployed, your app will be available at:"
echo "   https://vijay-subbiah.github.io/daily-quote/"
