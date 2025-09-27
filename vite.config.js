import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "https://RafaelC26.github.io/Ventilacion-Aula-Universitaria"
})
