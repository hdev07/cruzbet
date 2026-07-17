import { BASE_ENTRY_FEE_MXN } from '@/constants/base-quiniela-rules'
import type { Component } from 'vue'
import { CalendarDays, Grid3x3, Medal, Table2, User } from '@lucide/vue'

export const INICIO_PATH = '/'
export const JORNADAS_PATH = '/jornadas'
export const RESULTADOS_PATH = '/resultados'
export const TABLAS_PATH = '/tablas'
export const PERFIL_PATH = '/perfil'

export type NavItem = {
  to: string
  label: string
  icon: Component
  requiresAuth?: boolean
}

export const MAIN_NAV: NavItem[] = [
  { to: INICIO_PATH, label: 'Inicio', icon: CalendarDays },
  { to: JORNADAS_PATH, label: 'Quiniela', icon: Grid3x3 },
  { to: RESULTADOS_PATH, label: 'Resultados', icon: Medal },
  { to: TABLAS_PATH, label: 'Tablas', icon: Table2 },
  { to: PERFIL_PATH, label: 'Perfil', icon: User, requiresAuth: true },
]

export const QUINIELA_SUMMARY = {
  entryLabel: `$${BASE_ENTRY_FEE_MXN} MXN por quiniela`,
  tagline: 'Marca L, E o V en cada partido de la jornada',
  features: [
    'L = gana el local · E = empate · V = gana el visitante',
    'Marca todos los partidos antes de que empiecen',
    'Guarda tu quiniela cuando esté completa',
  ],
} as const

export function navItemHref(item: NavItem, isLoggedIn: boolean): string {
  if (item.requiresAuth && !isLoggedIn) return '/login'
  return item.to
}
