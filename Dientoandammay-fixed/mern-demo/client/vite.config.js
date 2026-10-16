import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: true, // Hoặc ['mern-frontend-235191.onrender.com']
    host: true,
    port: 5173,
  },
  server: {
    allowedHosts: true,
    host: true,
    port: 5173,
  },
})
