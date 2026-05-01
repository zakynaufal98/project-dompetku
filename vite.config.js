import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    // Minify dengan terser untuk lebih kecil dari esbuild default
    minify: 'esbuild',
    target: 'es2015',
    // Chunk splitting manual untuk code-splitting yang efektif
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor besar dipisah agar browser bisa cache lebih lama
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
    // Batasan chunk warning
    chunkSizeWarningLimit: 600,
  },
})

