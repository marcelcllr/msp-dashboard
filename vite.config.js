import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // MSP_ = variables que se guardan como "Secret" en Vercel (Vercel no deja guardar VITE_ como Secret)
  envPrefix: ['VITE_', 'MSP_'],
})
