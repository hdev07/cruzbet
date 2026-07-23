import { createHash } from 'node:crypto'

/**
 * Contraseña determinista para Supabase Auth a partir de nombre + PIN.
 * DEBE producir exactamente lo mismo que deriveAuthPassword en
 * src/lib/usernameAuth.ts (SHA-256 → base64url sin padding).
 */
export function deriveAuthPassword(username: string, pin: string): string {
  const normalized = username.trim().toLowerCase()
  const payload = `quiniela:v1:${normalized}:${pin.trim()}`
  return createHash('sha256').update(payload, 'utf8').digest('base64url')
}
