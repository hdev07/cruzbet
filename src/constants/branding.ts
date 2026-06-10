export const APP_NAME = 'CruzBet'
export const APP_TAGLINE = 'Quiniela del Mundial 2026'
export const APP_DESCRIPTION =
  'Predice goles, marcadores y compite en el ranking. Quiniela del Mundial 2026 con cuota de $10 MXN por partido.'
export const APP_URL = 'https://cruzbet.devifly.dev'
export const APP_LOCALE = 'es_MX'
export const THEME_COLOR = '#1a1a2e'
export const ACCENT_COLOR = '#e94560'

export const APP_TITLE = `${APP_NAME} — ${APP_TAGLINE}`

export function pageTitle(section?: string): string {
  return section ? `${section} | ${APP_NAME}` : APP_TITLE
}
