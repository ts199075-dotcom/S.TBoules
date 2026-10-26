import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'path';
import { defineConfig, type Connect } from 'vite';
import { createApiApp } from './server/app';

function apiMiddleware(): Connect.NextHandleFunction {
  const api = createApiApp();
  return (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
    if (req.url?.startsWith('/api')) {
      api(req as never, res as never, next);
      return;
    }
    next();
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'st-paul-api',
        configureServer(server) {
          server.middlewares.use(apiMiddleware());
        },
        configurePreviewServer(server) {
          server.middlewares.use(apiMiddleware());
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
