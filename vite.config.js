import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

const useHttps = process.env.HTTPS === 'true' || process.argv.includes('--https')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ...(useHttps ? [basicSsl()] : [])
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  preview: {
    host: '0.0.0.0',
    port: 5173
  }
})

