import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en .env')
}

// Sin timeout, un getSession()/refresh puede colgar la app entera en
// datos móviles lentos hasta que el navegador aborte el fetch (~30s+).
const NETWORK_TIMEOUT_MS = 15_000

function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  if (init.signal) {
    return fetch(input, init)
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS)
  return fetch(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  )
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabasePublishableKey ?? '',
  {
    auth: {
      detectSessionInUrl: true,
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: fetchWithTimeout,
    },
  },
)
