const RELOAD_FLAG = 'chunk-load-reload'

export function isStaleChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module')
  )
}

/** Recarga una vez si hay chunks viejos; no hace nada si ya se intentó o no hay red. */
export function reloadForStaleChunks(): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false
  if (sessionStorage.getItem(RELOAD_FLAG)) return false
  sessionStorage.setItem(RELOAD_FLAG, '1')
  window.location.reload()
  return true
}

export function clearStaleChunkReloadFlag(): void {
  sessionStorage.removeItem(RELOAD_FLAG)
}
