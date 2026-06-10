import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'
import { syncMatchStatuses } from './server/match-lifecycle'
import { processNewGoals } from './server/scoring'
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TITLE,
  THEME_COLOR,
} from './src/constants/branding'

function applyDevEnv(env: Record<string, string>) {
  process.env.FOOTBALL_API_KEY = env.FOOTBALL_API_KEY
  process.env.SUPABASE_URL = env.VITE_SUPABASE_URL
  process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
}

function scoreGoalsApiDev(): Plugin {
  return {
    name: 'score-goals-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')

        if (url.pathname !== '/api/cron/score-goals') return next()

        const env = loadEnv(server.config.mode, server.config.envDir, '')
        applyDevEnv(env)
        try {
          const lifecycle = await syncMatchStatuses()
          const scoring = await processNewGoals()
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ lifecycle, scoring }))
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Error desconocido'
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    scoreGoalsApiDev(),
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
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
})
