/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// The original single-file game stays live beside the port (ADR 0002), served
// from original/ so there is one copy. /original is a rewrite in vercel.json;
// the dev server mirrors it so e2e can cover both URLs.
const ORIGINAL_FILE = 'showroom-shift-simulator.html';
const ORIGINAL_PATHS = new Set([`/${ORIGINAL_FILE}`, '/original', '/original/']);

function serveOriginal(): Plugin {
  const read = () => readFileSync(new URL(`./original/${ORIGINAL_FILE}`, import.meta.url), 'utf8');
  return {
    name: 'serve-original',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0] ?? '';
        if (!ORIGINAL_PATHS.has(path)) return next();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(read());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: ORIGINAL_FILE, source: read() });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveOriginal()],
  server: { port: 3000, strictPort: true },
  preview: { port: 3000, strictPort: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
