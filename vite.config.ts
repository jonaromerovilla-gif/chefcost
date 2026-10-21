import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas para que funcione en GitHub Pages (/chefcost/)
  base: './',
  plugins: [react()],
})
