const PREFIX = 'cruzbet-cache:'

type CacheEnvelope<T> = {
  savedAt: number
  data: T
}

export function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEnvelope<T>
    return parsed?.data ?? null
  } catch {
    return null
  }
}

export function writeCache<T>(key: string, data: T): void {
  try {
    const envelope: CacheEnvelope<T> = { savedAt: Date.now(), data }
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(envelope))
  } catch {
    // quota / modo privado
  }
}

export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  if (error instanceof TypeError) return true
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error ?? '')
  return /failed to fetch|networkerror|network request failed|load failed|fetch/i.test(
    message,
  )
}

export function friendlyLoadError(error: unknown, fallback: string): string {
  if (isNetworkError(error)) {
    return 'Sin conexión. Activa WiFi o datos móviles e intenta de nuevo.'
  }
  return error instanceof Error ? error.message : fallback
}
