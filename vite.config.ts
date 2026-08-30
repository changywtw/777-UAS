import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = now.getUTCFullYear();
  const month = pad(now.getUTCMonth() + 1);
  const day = pad(now.getUTCDate());
  const hours = pad(now.getUTCHours());
  const minutes = pad(now.getUTCMinutes());
  const appVersion = `v${year}.${month}.${day}.${hours}${minutes}Z`;

  // Ensure public/version.json is updated during build / dev
  try {
    const publicDir = path.resolve(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(
      path.resolve(publicDir, 'version.json'),
      JSON.stringify({ version: appVersion, buildTime: now.toISOString() }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.warn('Failed to write public/version.json:', err);
  }

  return {
    base: '/',
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: null,
        includeAssets: ['favicon.svg', 'icon.svg'],
        devOptions: {
          enabled: false,
        },
        manifest: {
          name: 'B777 Unreliable Airspeed Calculator',
          short_name: 'B777 UAS',
          description: 'Offline calculator for Boeing 777 Unreliable Airspeed',
          theme_color: '#141414',
          background_color: '#141414',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/favicon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: '/favicon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          globIgnores: ['**/version.json'],
          navigateFallback: '/index.html',
          navigateFallbackAllowlist: [/^\//],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages-cache',
                networkTimeoutSeconds: 3,
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\/version\.json/,
              handler: 'NetworkOnly'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__APP_VERSION__': JSON.stringify(appVersion),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
