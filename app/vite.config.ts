import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages project page base path. Change to '/' if you use a custom domain.
const BASE = process.env.VITE_BASE_PATH || '/stel_control/'

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
})
