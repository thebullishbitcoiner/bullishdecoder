#!/bin/bash

# Build script for bullishDecoder PWA
echo "Building bullishDecoder PWA..."

# Run the Vite build
npm run build

# Copy additional assets to dist folder
echo "Copying assets to dist folder..."
cp package.json dist/
cp icon-512.png dist/assets/

echo "Build complete! Assets copied to dist folder."
echo "Ready for deployment to Vercel."
