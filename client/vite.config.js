import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    // Use /PrepSnippet/ for GitHub Pages, / for local dev
    base: command === 'build' ? '/PrepSnippet/' : '/',
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  }
})
