const AUTH_EMAIL_DOMAIN = 'play.quiniela.app'
const STORAGE_PREFIX = 'quiniela_auth:'

export function validateUsernameFormat(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'El nombre no puede estar vacío'
  if (trimmed.length < 2) return 'Mínimo 2 caracteres'
  if (trimmed.length > 30) return 'Máximo 30 caracteres'
  return null
}

export function validatePinFormat(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'El PIN no puede estar vacío'
  if (!/^\d+$/.test(trimmed)) return 'El PIN solo puede contener números'
  if (trimmed.length < 4) return 'Mínimo 4 dígitos'
  if (trimmed.length > 8) return 'Máximo 8 dígitos'
  return null
}

function slugifyUsername(username: string): string {
  const slug = username
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'jugador'
}

export function usernameToAuthEmail(username: string): string {
  return `${slugifyUsername(username)}@${AUTH_EMAIL_DOMAIN}`
}

function storageKey(email: string): string {
  return `${STORAGE_PREFIX}${email}`
}

export function getStoredAuthPassword(username: string): string | null {
  try {
    return localStorage.getItem(storageKey(usernameToAuthEmail(username)))
  } catch {
    return null
  }
}

export function clearStoredAuthPassword(username: string): void {
  try {
    localStorage.removeItem(storageKey(usernameToAuthEmail(username)))
  } catch {
    // localStorage puede estar bloqueado en modo privado estricto
  }
}

/** Contraseña determinista para Supabase Auth a partir de nombre + PIN. */
export async function deriveAuthPassword(username: string, pin: string): Promise<string> {
  const normalized = username.trim().toLowerCase()
  const payload = `quiniela:v1:${normalized}:${pin.trim()}`
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
  const bytes = new Uint8Array(hash)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
