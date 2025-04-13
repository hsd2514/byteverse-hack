import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import tailwindcss from '@tailwindcss/vite'; // Import the tailwind vite plugin

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  plugins: [
    react(), // or other framework plugin
    tailwindcss({
      config: '../tailwind.config.js', // Path to your tailwind config relative to this file
    }),
  ],
  define: {
    'process.env': process.env,
  },
});
