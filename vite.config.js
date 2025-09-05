import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    fs: {
      strict: false
    },
    proxy: {
      '/api/csv-proxy': {
        target: 'https://wahlen.citeq.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/csv-proxy/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Setze CORS-Headers
            proxyReq.setHeader('Origin', 'https://wahlen.citeq.de');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Füge CORS-Headers zur Antwort hinzu
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
          });
        }
      }
    }
  }
})
