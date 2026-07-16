import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TITLE,
  THEME_COLOR,
} from './src/constants/branding'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    ...(mode === 'development' ? [vueDevTools()] : []),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.svg', 'icon-512.svg', 'og-image.svg'],
      manifest: {
        name: APP_TITLE,
        short_name: APP_NAME,
        description: APP_DESCRIPTION,
        theme_color: THEME_COLOR,
        background_color: THEME_COLOR,
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        id: '/',
        lang: 'es-MX',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallbackDenylist: [/^\/assets\//, /^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/flagcdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'flagcdn-cache',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
