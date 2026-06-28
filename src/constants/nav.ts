import type { Component } from 'vue'
import { ClipboardList, Grid3x3, History, Home, LayoutGrid, Medal, Trophy, User } from '@lucide/vue'
import { BASE_ENTRY_FEE_MXN } from '@/constants/base-quiniela-rules'

export const MUNDIAL_PATH = '/mundial'
export const GRUPOS_PATH = '/grupos'
export const ELIMINATORIA_PATH = '/eliminatoria'
export const JORNADAS_PATH = '/jornadas'
export const RANKING_PATH = '/ranking'
export const PERFIL_PATH = '/perfil'

export type NavItem = {
  to: string
  label: string
  icon: Component
  /** Si requiere sesión, el enlace apunta a /login */
  requiresAuth?: boolean
}

/** Navegación principal — siempre visible, sin cambiar según la ruta */
export const MAIN_NAV: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: MUNDIAL_PATH, label: 'Mundial', icon: LayoutGrid },
  { to: JORNADAS_PATH, label: 'Quiniela', icon: Grid3x3 },
  { to: RANKING_PATH, label: 'Ranking', icon: Trophy },
  { to: PERFIL_PATH, label: 'Perfil', icon: User, requiresAuth: true },
]

/** Sub-navegación dentro de la sección Quiniela */
export const QUINIELA_SUB_NAV: NavItem[] = [
  { to: JORNADAS_PATH, label: 'Jugar', icon: Grid3x3 },
  { to: '/reglas', label: 'Reglas', icon: ClipboardList },
  { to: '/resultados', label: 'Resultados', icon: Medal },
  { to: '/historial', label: 'Mi historial', icon: History, requiresAuth: true },
]

export const QUINIELA_SUMMARY = {
  entryLabel: `$${BASE_ENTRY_FEE_MXN} MXN por jornada`,
  tagline: 'Marca L, E o V en cada partido de la jornada',
  features: [
    `$${BASE_ENTRY_FEE_MXN} pesos por jornada`,
    'L = gana el de casa · E = empate · V = gana el de fuera',
    'Gana quien más acierte en la jornada',
  ],
} as const

const QUINIELA_SECTION_ROUTES = new Set(['/jornadas', '/historial', '/resultados', '/reglas'])

export function isQuinielaSectionRoute(path: string): boolean {
  if (QUINIELA_SECTION_ROUTES.has(path)) return true
  if (path.startsWith('/jornadas/')) return true
  return false
}

export function isMundialSectionRoute(path: string): boolean {
  return path === MUNDIAL_PATH || path === GRUPOS_PATH || path === ELIMINATORIA_PATH || path.startsWith('/grupos/')
}

export function navItemHref(item: NavItem, isLoggedIn: boolean): string {
  if (item.requiresAuth && !isLoggedIn) return '/login'
  return item.to
}
