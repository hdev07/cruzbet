const AUTH_EMAIL_DOMAIN = 'play.quiniela.app'
const STORAGE_PREFIX = 'quiniela_auth:'

export function validateUsernameFormat(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'El nombre no puede estar vacío'
  if (trimmed.length < 2) return 'Mínimo 2 caracteres'
  if (trimmed.length > 30) return 'Máximo 30 caracteres'
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

export function storeAuthPassword(username: string, password: string): void {
  localStorage.setItem(storageKey(usernameToAuthEmail(username)), password)
}

export function clearStoredAuthPassword(username: string): void {
  try {
    localStorage.removeItem(storageKey(usernameToAuthEmail(username)))
  } catch {
    // localStorage puede estar bloqueado en modo privado estricto
  }
}

export function generateAuthPassword(): string {
  return crypto.randomUUID()
}
