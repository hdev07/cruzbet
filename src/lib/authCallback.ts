/** Detecta si la URL actual trae tokens de OAuth (implicit o PKCE). */
export function hasOAuthCallbackInUrl(): boolean {
  const hash = window.location.hash
  const search = window.location.search

  return (
    hash.includes('access_token=') ||
    hash.includes('error=') ||
    hash.includes('error_description=') ||
    search.includes('code=') ||
    search.includes('error=') ||
    search.includes('error_description=')
  )
}

/** Quita tokens sensibles de la barra de direcciones tras procesar el login. */
export function cleanupOAuthUrl(): void {
  if (!hasOAuthCallbackInUrl()) return

  const cleanPath = window.location.pathname || '/'
  window.history.replaceState({}, document.title, cleanPath)
}
