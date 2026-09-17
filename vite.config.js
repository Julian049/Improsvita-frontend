import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/

// export default defineConfig({
//   plugins: [react()],
// })


export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/improsvita/api': {
        target: 'http://localhost:9010',
        changeOrigin: true,
      },
    },
  },
});