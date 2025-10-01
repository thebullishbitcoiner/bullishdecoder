#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vercel build...');

try {
  // Bump version automatically
  console.log('Bumping version...');
  execSync('npm version patch --no-git-tag-version', { stdio: 'inherit' });
  
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
  
  // Update service worker cache version to match package.json version
  console.log('Updating service worker cache version...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = packageJson.version;
  
  let swContent = fs.readFileSync('sw.js', 'utf8');
  swContent = swContent.replace(/CACHE_NAME = 'bullishdecoder-v[^']*'/, `CACHE_NAME = 'bullishdecoder-v${version}'`);
  fs.writeFileSync('sw.js', swContent);
  console.log(`✓ Updated service worker cache to v${version}`);
  
  // Copy service worker
  if (fs.existsSync('sw.js')) {
    fs.copyFileSync('sw.js', 'dist/sw.js');
    console.log('✓ Copied sw.js');
  }
  
  // Copy icon
  if (fs.existsSync('logo.png')) {
    // Ensure assets directory exists
    if (!fs.existsSync('dist/assets')) {
      fs.mkdirSync('dist/assets', { recursive: true });
    }
    fs.copyFileSync('logo.png', 'dist/assets/logo.png');
    console.log('✓ Copied logo.png');
  }
  
  console.log('Vercel build complete!');
  
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
