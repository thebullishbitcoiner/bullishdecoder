# bullishDecoder

A Progressive Web App (PWA) for decoding BOLT12 offers and invoices with a retro terminal interface.

## Features

- 🧡 Retro terminal-style dark theme with orange accents
- 🔍 BOLT12 offer and invoice string decoding
- 📱 Progressive Web App (PWA) - installable on mobile and desktop
- ⚡ Offline functionality with service worker caching
- 🎯 Clean, minimal interface with paste functionality

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Preview production build
npm run preview
```

## Vercel Deployment

The app is configured for Vercel deployment:

1. **Connect to Vercel**: Link your GitHub repository to Vercel
2. **Automatic Deployments**: Vercel will automatically deploy on every push to main
3. **Manual Build**: Run the Vercel build script locally:

```bash
# Run Vercel build (bumps version and builds)
npm run vercel-build
```

The app will be available at your Vercel deployment URL.

## PWA Features

- **Installable**: Can be installed as a native app on mobile and desktop
- **Offline Support**: Works offline with cached resources
- **App Icons**: Custom orange icons for app launcher
- **Manifest**: Configured for standalone app experience

## Usage

1. Paste a BOLT12 offer or invoice string into the input field
2. Click "paste" to paste from clipboard
3. View the decoded output in the terminal-style interface

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Build Tool**: Vite
- **PWA**: Service Worker, Web App Manifest
- **BOLT12 Decoding**: bolt12-decoder library

## License

MIT