import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served from https://zorenkonte.github.io/timer/ on GitHub Pages.
// Pull request previews are built with `vite build --base /timer/pr-<number>/`
// and deployed next to the live app (see .github/workflows/deploy.yml).
// BASE_PATH does the same for local builds.
const base = process.env.BASE_PATH ?? '/timer/';

export default defineConfig({
  base: base.endsWith('/') ? base : `${base}/`,
  plugins: [react(), tailwindcss()],
});
