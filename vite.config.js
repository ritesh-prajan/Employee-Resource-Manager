import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react/')) {
              return 'react-core';
            }
            if (id.includes('motion')) {
              return 'motion';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('@radix-ui') || id.includes('radix-ui')) {
              return 'radix';
            }
            if (id.includes('@tanstack/react-table')) {
              return 'table';
            }
          }
        },
      },
    },
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react/')) {
              return 'react-core';
            }
            if (id.includes('motion')) {
              return 'motion';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('@radix-ui') || id.includes('radix-ui')) {
              return 'radix';
            }
            if (id.includes('@tanstack/react-table')) {
              return 'table';
            }
          }
        },
      },
    },
  },
})