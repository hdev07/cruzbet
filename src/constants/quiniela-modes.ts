import type { Component } from 'vue'
import { ClipboardList, Grid3x3, History, LayoutGrid, Trophy, Zap } from '@lucide/vue'
import { BASE_ENTRY_FEE_MXN, BASE_QUINIELA_MATCHES_PER_ROUND } from '@/constants/base-quiniela-rules'
import { ENTRY_FEE_MXN } from '@/constants/quiniela-rules'

export type QuinielaMode = 'partido' | 'base'

export type QuinielaNavItem = {
  to: string
  label: string
  icon: Component
}

export const QUINIELA_MODE_PARTIDO = {
  id: 'partido' as const,
  title: 'Quiniela por partido',
  shortTitle: 'Por partido',
  tagline: 'Adivina el minuto del primer gol y quién gana el partido',
  entryFeeMxn: ENTRY_FEE_MXN,
  entryLabel: `$${ENTRY_FEE_MXN} MXN por partido`,
  accentClass: 'mundial-accent',
  borderClass: 'border-mundial-accent/40',
  bgClass: 'bg-mundial-accent/10',
  homePath: '/quiniela-partido',
  features: [
    'Elige los partidos que quieras (no es obligatorio jugar todos)',
    'Marca el minuto del primer gol o «sin goles»',
    'También marcas L, E o V (local, empate, visitante)',
  ],
} as const

export const QUINIELA_MODE_BASE = {
  id: 'base' as const,
  title: 'Quiniela base',
  shortTitle: 'Base',
  tagline: `Marca L, E o V en ${BASE_QUINIELA_MATCHES_PER_ROUND} partidos de la jornada`,
  entryFeeMxn: BASE_ENTRY_FEE_MXN,
  entryLabel: `$${BASE_ENTRY_FEE_MXN} MXN por jornada`,
  accentClass: 'mundial-green',
  borderClass: 'border-mundial-green/40',
  bgClass: 'bg-mundial-green/10',
  homePath: '/quiniela-base',
  features: [
    `$${BASE_ENTRY_FEE_MXN} pesos por jornada (${BASE_QUINIELA_MATCHES_PER_ROUND} partidos)`,
    'L = gana el de casa · E = empate · V = gana el de fuera',
    'Gana quien más acierte en la jornada',
  ],
} as const

export const PARTIDO_NAV: QuinielaNavItem[] = [
  { to: '/quiniela-partido', label: 'Partidos', icon: Zap },
  { to: '/quiniela-partido/grupos', label: 'Grupos', icon: LayoutGrid },
  { to: '/quiniela-partido/ranking', label: 'Ranking', icon: Trophy },
  { to: '/quiniela-partido/reglas', label: 'Reglas', icon: ClipboardList },
  { to: '/quiniela-partido/historial', label: 'Historial', icon: History },
]

export const BASE_NAV: QuinielaNavItem[] = [
  { to: '/quiniela-base', label: 'Jornadas', icon: Grid3x3 },
  { to: '/quiniela-base/ranking', label: 'Ranking', icon: Trophy },
  { to: '/quiniela-base/reglas', label: 'Reglas', icon: ClipboardList },
  { to: '/quiniela-base/historial', label: 'Historial', icon: History },
]

export function detectQuinielaMode(path: string): QuinielaMode | null {
  if (path.startsWith('/quiniela-partido') || path.startsWith('/match/')) return 'partido'
  if (path.startsWith('/quiniela-base')) return 'base'
  return null
}

export function modeConfig(mode: QuinielaMode) {
  return mode === 'partido' ? QUINIELA_MODE_PARTIDO : QUINIELA_MODE_BASE
}

export function modeNav(mode: QuinielaMode): QuinielaNavItem[] {
  return mode === 'partido' ? PARTIDO_NAV : BASE_NAV
}
