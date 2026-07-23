import { execSync } from 'node:child_process'
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

// Version scheme: 1.2.<commits since the liga-mx -> main merge>.
// Requires full git history at build time (Vercel: enable VERCEL_DEEP_CLONE=true),
// otherwise falls back to 1.2.000 instead of failing the build.
const VERSION_MAJOR_MINOR = '1.2'
const VERSION_BASE_COMMIT = '00a992fbd73e7e2e12abaafb28cbccfcbc9e238b'

function commitsSinceBase(): number {
  try {
    return parseInt(
      execSync(`git rev-list --count --first-parent ${VERSION_BASE_COMMIT}..HEAD`).toString().trim(),
      10,
    )
  } catch {
    return 0
  }
}

function appVersion(): string {
  return `${VERSION_MAJOR_MINOR}.${String(commitsSinceBase()).padStart(3, '0')}`
}

function shortCommitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'dev'
  }
}

export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion()),
    __APP_COMMIT__: JSON.stringify(shortCommitHash()),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
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
        // Handler de Web Push (recordatorios de quiniela)
        importScripts: ['push-sw.js'],
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
          // Auth: NUNCA cachear. Tokens y sesiones deben ir siempre a la red.
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: 'NetworkOnly',
          },
          // Realtime (websockets): NetworkOnly, workbox no debe interferir.
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/realtime\/.*/i,
            handler: 'NetworkOnly',
          },
          // Storage: los objetos son grandes y pueden cachearse.
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-public',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // REST y RPC de solo lectura: NetworkFirst con timeout corto,
          // así en datos móviles lentos servimos cache mientras la red responde,
          // pero seguimos priorizando datos frescos cuando la red es rápida.
          {
            urlPattern: ({ url, request }) =>
              /^https:\/\/.*\.supabase\.co\/(rest|graphql)\/.*/i.test(url.href) &&
              request.method === 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Mutaciones (POST/PUT/PATCH/DELETE) siempre a la red.
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
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
