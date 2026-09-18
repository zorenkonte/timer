import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The live app is served from https://zorenkonte.github.io/timer/ on GitHub
// Pages. Vercel builds every pull request as a preview deployment on its own
// *.vercel.app domain, where the app lives at the root. BASE_PATH overrides
// either for local builds.
const base = process.env.BASE_PATH ?? (process.env.VERCEL ? '/' : '/timer/');

export default defineConfig({
  base: base.endsWith('/') ? base : `${base}/`,
  plugins: [react(), tailwindcss()],
});
