/// <reference types="node" />
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { deriveAuthPassword } from './_lib/username-auth.js'

// Restablecer el PIN de un jugador (cuentas usuario+PIN).
// Solo lo puede invocar un admin autenticado; usa service_role para cambiar
// la contraseña derivada en Supabase Auth. El navegador nunca ve la llave.

const AUTH_EMAIL_DOMAIN = 'play.quiniela.app'

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function isValidPin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin.trim())
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader('Cache-Control', 'no-store')

  if (request.method !== 'POST') {
    return response.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) {
    return response.status(401).json({ ok: false, error: 'unauthorized' })
  }

  try {
    const supabase = getSupabaseAdmin()

    // ¿Quién llama? Debe ser el admin.
    const { data: caller, error: callerErr } = await supabase.auth.getUser(token)
    const adminEmail = (process.env.ADMIN_EMAIL ?? '').toLowerCase()
    const isAdmin =
      !callerErr &&
      !!caller?.user &&
      (caller.user.app_metadata?.role === 'admin' ||
        (adminEmail && caller.user.email?.toLowerCase() === adminEmail))

    if (!isAdmin) {
      return response.status(403).json({ ok: false, error: 'forbidden' })
    }

    const { username, newPin } = (request.body ?? {}) as {
      username?: string
      newPin?: string
    }

    if (!username?.trim()) {
      return response.status(400).json({ ok: false, error: 'username_required' })
    }
    if (!newPin || !isValidPin(newPin)) {
      return response
        .status(400)
        .json({ ok: false, error: 'invalid_pin', message: 'El PIN debe tener de 4 a 8 dígitos' })
    }

    // Buscar el perfil por nombre de usuario (como se muestra en la app).
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', username.trim())
      .maybeSingle()

    if (profileErr) throw profileErr
    if (!profile) {
      return response
        .status(404)
        .json({ ok: false, error: 'user_not_found', message: 'No existe un jugador con ese nombre' })
    }

    // Solo cuentas usuario+PIN (no cuentas de Google).
    const { data: authUser, error: authErr } =
      await supabase.auth.admin.getUserById(profile.id)
    if (authErr || !authUser?.user) {
      throw authErr ?? new Error('No se encontró la cuenta de auth')
    }
    if (!authUser.user.email?.endsWith(`@${AUTH_EMAIL_DOMAIN}`)) {
      return response.status(400).json({
        ok: false,
        error: 'not_pin_account',
        message: 'Esta cuenta entra con Google; no usa PIN',
      })
    }

    const password = deriveAuthPassword(profile.username ?? username, newPin)
    const { error: updateErr } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password },
    )
    if (updateErr) throw updateErr

    return response.status(200).json({ ok: true, username: profile.username })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown_error'
    return response.status(500).json({ ok: false, error: message })
  }
}
