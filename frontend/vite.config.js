import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // or other framework plugin
import tailwindcss from '@tailwindcss/vite' // Import the tailwind vite plugin

export default defineConfig({
  plugins: [
    react(), // or other framework plugin
    tailwindcss({
      config: '../tailwind.config.js', // Path to your tailwind config relative to this file
    }),
  ],
})
