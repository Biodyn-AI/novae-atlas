import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build-time cache-buster — appended as ?v=<id> to data fetches so a fresh
// deployment always gets fresh data files even if the browser had the
// previous file cached.
const BUILD_ID = Date.now().toString(36)

// Set base for GitHub Pages deployment at /novae-atlas/
// Uses './' for local dev, '/novae-atlas/' for production build.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/novae-atlas/' : '/',
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173,
    open: false,
  },
}))
