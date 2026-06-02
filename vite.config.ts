import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [react()],

    build: {
      // Pakai terser di production untuk drop console.* + debugger
      // Dev tetap pakai esbuild (cepat, tidak ada overhead)
      minify: isProd ? 'terser' : 'esbuild',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
        },
      },
      // Jangan generate .map files di production
      sourcemap: !isProd,
    },
  }
})
