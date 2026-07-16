export const APP_NAME = 'CruzBet'
export const APP_TAGLINE = 'Quiniela Liga MX'
export const APP_DESCRIPTION =
  'Marca L, E o V en cada jornada de Liga MX.'
export const APP_URL = 'https://cruzbet.devifly.dev'
export const ACTIVE_COMPETITION_SLUG = 'liga-mx-apertura-2026'
export const DEVIFLY_NAME = 'Devifly'
export const DEVIFLY_URL = 'https://devifly.dev'
export const APP_LOCALE = 'es_MX'
export const THEME_COLOR = '#071426'
export const ACCENT_COLOR = '#F5B942'
export const GOLD_COLOR = '#FFD76A'
export const SECONDARY_COLOR = '#16B877'
export const ERROR_COLOR = '#EF5B5B'
export const WARNING_COLOR = '#F59E42'

export const APP_TITLE = `${APP_NAME} — ${APP_TAGLINE}`

export function pageTitle(section?: string): string {
  return section ? `${section} | ${APP_NAME}` : APP_TITLE
}
