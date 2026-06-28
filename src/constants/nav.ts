import type { Component } from 'vue'
import { Grid3x3, User } from '@lucide/vue'

export const JORNADAS_PATH = '/jornadas'
export const PERFIL_PATH = '/perfil'

export type NavItem = {
  to: string
  label: string
  icon: Component
  requiresAuth?: boolean
}

export const MAIN_NAV: NavItem[] = [
  { to: JORNADAS_PATH, label: 'Quiniela', icon: Grid3x3 },
  { to: PERFIL_PATH, label: 'Perfil', icon: User, requiresAuth: true },
]

export const QUINIELA_SUMMARY = {
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
