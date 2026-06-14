/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: https://rikuto125.github.io/sample/ で公開するため base を合わせる
export default defineConfig({
  plugins: [react()],
  base: '/sample/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
