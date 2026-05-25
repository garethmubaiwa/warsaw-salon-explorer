import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /salons → FastAPI running on :8000
      // This avoids CORS issues during development
      '/salons': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    }
  }
})
