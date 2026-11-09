import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'path';
import { defineConfig, type Connect } from 'vite';
import { createApiApp } from './server/app';

import { VitePWA } from 'vite-plugin-pwa';

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
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'مدرسة سانت بولس للكتاب المقدس',
          short_name: 'سانت بولس',
          description: 'المنصة التعليمية الشاملة لمدرسة سانت بولس للكتاب المقدس - كنيسة رئيس الملائكة ميخائيل والأمير تادرس الشطبي',
          theme_color: '#78350f',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          lang: 'ar',
          dir: 'rtl',
          icons: [
            {
              src: '/assets/aistudio/IMG-20261019-WA0054_c30c6539.jpg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'any',
            },
            {
              src: '/assets/aistudio/IMG-20261019-WA0054_c30c6539.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,jpg,jpeg}'],
          navigateFallback: '/index.html',
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
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
