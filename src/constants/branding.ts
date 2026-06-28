export const APP_NAME = 'CruzBet'
export const APP_TAGLINE = 'Quiniela Liga MX'
export const APP_DESCRIPTION =
  'Marca L, E o V en cada jornada de Liga MX.'
export const APP_URL = 'https://cruzbet.devifly.dev'
export const DEVIFLY_NAME = 'Devifly'
export const DEVIFLY_URL = 'https://devifly.dev'
export const APP_LOCALE = 'es_MX'
export const THEME_COLOR = '#1a1a2e'
export const ACCENT_COLOR = '#e94560'

export const APP_TITLE = `${APP_NAME} — ${APP_TAGLINE}`

export function pageTitle(section?: string): string {
  return section ? `${section} | ${APP_NAME}` : APP_TITLE
}
