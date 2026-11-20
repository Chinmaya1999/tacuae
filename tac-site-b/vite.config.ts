import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://localhost:8787' } },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('framer-motion') || id.includes('motion-dom')) return 'motion'
          if (id.includes('gsap') || id.includes('lenis')) return 'gsap'
        },
      },
    },
  },
})
