#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vercel build...');

try {
  // Run vite build
  console.log('Running vite build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Copy additional files
  console.log('Copying additional files...');
  
  // Copy package.json
  if (fs.existsSync('package.json')) {
    fs.copyFileSync('package.json', 'dist/package.json');
    console.log('✓ Copied package.json');
  }
  
  // Copy service worker
  if (fs.existsSync('sw.js')) {
    fs.copyFileSync('sw.js', 'dist/sw.js');
    console.log('✓ Copied sw.js');
  }
  
  // Copy icon
  if (fs.existsSync('icon-512.png')) {
    // Ensure assets directory exists
    if (!fs.existsSync('dist/assets')) {
      fs.mkdirSync('dist/assets', { recursive: true });
    }
    fs.copyFileSync('icon-512.png', 'dist/assets/icon-512.png');
    console.log('✓ Copied icon-512.png');
  }
  
  console.log('Vercel build complete!');
  
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
