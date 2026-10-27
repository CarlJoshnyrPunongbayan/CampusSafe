import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The main chunk is mostly the Firebase SDK (~900 kB, ~290 kB gzipped).
  build: { chunkSizeWarningLimit: 1100 },
})
