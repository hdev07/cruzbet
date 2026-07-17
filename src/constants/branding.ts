export const APP_NAME = 'CruzBet'
export const APP_TAGLINE = 'Quiniela Liga MX'
export const APP_DESCRIPTION =
  'Marca L, E o V en cada jornada de Liga MX.'
export const APP_URL = 'https://cruzbet.devifly.dev'
export const ACTIVE_COMPETITION_SLUG = 'liga-mx-apertura-2026'
export const DEVIFLY_NAME = 'Devifly'
export const DEVIFLY_URL = 'https://devifly.dev'
export const APP_LOCALE = 'es_MX'
export const THEME_COLOR = '#151515'
export const ACCENT_COLOR = '#00C3B4'
export const GOLD_COLOR = '#4327AB'
export const SECONDARY_COLOR = '#765CE0'
export const ERROR_COLOR = '#E05268'
export const WARNING_COLOR = '#F4B740'

export const APP_TITLE = `${APP_NAME} — ${APP_TAGLINE}`

export function pageTitle(section?: string): string {
  return section ? `${section} | ${APP_NAME}` : APP_TITLE
}
