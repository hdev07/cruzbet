import type { Component } from 'vue'
import { ClipboardList, Grid3x3, History, Home, Trophy, User } from '@lucide/vue'
import { BASE_ENTRY_FEE_MXN, BASE_QUINIELA_MATCHES_PER_ROUND } from '@/constants/base-quiniela-rules'

export const GRUPOS_PATH = '/grupos'
export const JORNADAS_PATH = '/jornadas'

export type NavItem = {
  to: string
  label: string
  icon: Component
}

export const QUINIELA_NAV: NavItem[] = [
  { to: '/jornadas', label: 'Jornadas', icon: Grid3x3 },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/reglas', label: 'Reglas', icon: ClipboardList },
  { to: '/historial', label: 'Historial', icon: History },
]

export const HUB_NAV: NavItem[] = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
  { to: '/perfil', label: 'Perfil', icon: User },
]

export const QUINIELA_SUMMARY = {
  entryLabel: `$${BASE_ENTRY_FEE_MXN} MXN por jornada`,
  tagline: `Marca L, E o V en ${BASE_QUINIELA_MATCHES_PER_ROUND} partidos de la jornada`,
  features: [
    `$${BASE_ENTRY_FEE_MXN} pesos por jornada (${BASE_QUINIELA_MATCHES_PER_ROUND} partidos)`,
    'L = gana el de casa · E = empate · V = gana el de fuera',
    'Gana quien más acierte en la jornada',
  ],
} as const

const QUINIELA_ROUTES = new Set(['/jornadas', '/ranking', '/reglas', '/historial'])

export function isQuinielaRoute(path: string): boolean {
  if (QUINIELA_ROUTES.has(path)) return true
  if (path.startsWith('/jornadas/')) return true
  return false
}
