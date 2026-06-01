import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [react()],
    
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
    } as any,

    build: {
      // Jangan generate .map files di production agar source code tidak ke-expose
      sourcemap: !isProd,
    },
  }
})
