import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served from https://zorenkonte.github.io/timer/ on GitHub Pages.
export default defineConfig({
  base: '/timer/',
  plugins: [react(), tailwindcss()],
});
