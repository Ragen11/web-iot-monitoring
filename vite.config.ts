import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],

  build: {
    // Saat production build: strip semua console.* (log, debug, info, warn, error)
    // + debugger statement. Saat dev: biarkan agar bisa debug.
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },

    // Jangan generate .map files di production agar source code tidak ke-expose
    sourcemap: mode !== 'production',
  },
}))
