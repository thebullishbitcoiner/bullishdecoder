#!/bin/bash

# Build script for bullishDecoder PWA
echo "Building bullishDecoder PWA..."

# Bump version automatically
echo "Bumping version..."
npm version patch --no-git-tag-version

# Run the Vite build
npm run build

# Update service worker cache version to match package.json version
echo "Updating service worker cache version..."
VERSION=$(node -p "require('./package.json').version")
sed -i.bak "s/CACHE_NAME = 'bullishdecoder-v[^']*'/CACHE_NAME = 'bullishdecoder-v$VERSION'/" sw.js
rm sw.js.bak

# Copy additional assets to dist folder
echo "Copying assets to dist folder..."
cp package.json dist/
cp sw.js dist/
cp icon-512.png dist/assets/

echo "Build complete! Assets copied to dist folder."
echo "Ready for deployment to Vercel."
