import { PAYMENT_INFO } from '@/constants/quiniela-rules'

export const BASE_ENTRY_FEE_MXN = 50
export const BASE_QUINIELA_MATCHES_PER_ROUND = 16
export const BASE_QUINIELA_POINTS_PER_HIT = 50
export const BASE_QUINIELA_MAX_POINTS =
  BASE_QUINIELA_MATCHES_PER_ROUND * BASE_QUINIELA_POINTS_PER_HIT

export const BASE_PAYMENT_INFO = {
  ...PAYMENT_INFO,
  amountLabel: `$${BASE_ENTRY_FEE_MXN} MXN por jornada`,
  concept: 'Quiniela base — incluye concepto y número de jornada',
} as const

export const BASE_QUINIELA_LOGIC = {
  title: 'Quiniela base',
  summary: `Deposita $${BASE_ENTRY_FEE_MXN} MXN por jornada. Marca L, E o V en ${BASE_QUINIELA_MATCHES_PER_ROUND} partidos. Cada acierto suma ${BASE_QUINIELA_POINTS_PER_HIT} puntos. Ranking independiente por jornada.`,
  howItWorks: [
    `Transfiere $${BASE_ENTRY_FEE_MXN} MXN por cada jornada en la que participes.`,
    `Los partidos se agrupan en jornadas de ${BASE_QUINIELA_MATCHES_PER_ROUND}, en orden de calendario.`,
    'Marca L, E o V para cada partido antes de que empiece.',
    'Al terminar cada partido se revisa tu pick automáticamente.',
    `Cada acierto vale ${BASE_QUINIELA_POINTS_PER_HIT} puntos (máximo ${BASE_QUINIELA_MAX_POINTS} por jornada).`,
    'El ranking de la jornada ordena por aciertos; en empate, por puntos.',
  ],
  scoring: [
    { label: 'Acierto L/E/V', points: BASE_QUINIELA_POINTS_PER_HIT },
    { label: 'Fallo', points: 0 },
  ],
} as const
