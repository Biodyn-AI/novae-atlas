import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set base for GitHub Pages deployment at /novae-atlas/
// Uses './' for local dev, '/novae-atlas/' for production build.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/novae-atlas/' : '/',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173,
    open: false,
  },
}))
