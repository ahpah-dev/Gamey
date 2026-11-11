import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-lib',
    target: 'es2020',
    lib: { entry: 'src/engine/index.js', formats: ['es'], fileName: () => 'gamey.js' },
    rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime'] },
  },
})
