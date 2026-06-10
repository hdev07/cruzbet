import { createClient, type SupabaseClient } from '@supabase/supabase-js/dist/common.js/dist/common.js'

let admin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (admin) return admin

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridos para scoring')
  }

  admin = createClient(url, key)
  return admin
}
