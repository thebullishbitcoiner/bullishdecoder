import { defineConfig } from 'vite'

export default defineConfig({
  base: '/bullishdecoder/', // GitHub Pages repository name
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    include: ['bolt12-decoder']
  },
  resolve: {
    alias: {
      'bolt12-decoder': '/node_modules/bolt12-decoder/dist/index.js'
    }
  }
})
