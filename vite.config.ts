import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The live app is served from https://zorenkonte.github.io/timer/ on GitHub
// Pages. Cloudflare Pages builds every branch and pull request as a preview
// deployment on its own *.pages.dev subdomain (and serves any custom domain)
// with the app at the root. BASE_PATH overrides either for local builds.
const onCloudflare = Boolean(process.env.CF_PAGES || process.env.WORKERS_CI);
const base = process.env.BASE_PATH ?? (onCloudflare ? '/' : '/timer/');

export default defineConfig({
  base: base.endsWith('/') ? base : `${base}/`,
  plugins: [react(), tailwindcss()],
});
