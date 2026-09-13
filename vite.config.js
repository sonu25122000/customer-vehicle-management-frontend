import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Dev-server proxy target, derived from VITE_API_BASE_URL (strip a trailing /api).
  const apiOrigin = (env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // Allows the temporary cloudflared tunnel domain (trycloudflare.com) to reach this dev server.
      allowedHosts: ['.trycloudflare.com'],
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
        },
      },
    },
  }
})
