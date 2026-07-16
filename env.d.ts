/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_LIVE_SYNC_TOKEN?: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  const __APP_VERSION__: string
  const __APP_COMMIT__: string
  const __APP_BUILD_TIME__: string
}

import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    layout?: 'mobile' | 'blank'
    title?: string
    description?: string
    requiresAuth?: boolean
    requiresAdmin?: boolean
    hideBottomNav?: boolean
    wide?: boolean
  }
}
