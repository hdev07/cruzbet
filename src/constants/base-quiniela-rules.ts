import { PAYMENT_INFO } from '@/constants/quiniela-rules'

export const BASE_ENTRY_FEE_MXN = 50
/** Tamaño típico en fase de grupos; la eliminatoria usa menos partidos por jornada. */
export const BASE_QUINIELA_MATCHES_PER_ROUND = 16
export const BASE_QUINIELA_POINTS_PER_HIT = 50
/** Cuotas adicionales por jornada (cada quiniela extra cuesta lo mismo). Sin tope duro en app. */
export const BASE_QUINIELA_ENTRIES_PER_ROUND_HINT =
  'Puedes jugar más de una quiniela en la misma jornada. Cada quiniela extra requiere otro depósito.'
/** Jornada activa por defecto al entrar a la quiniela (mínimo). */
export const BASE_QUINIELA_MIN_ACTIVE_ROUND = 2

export function baseQuinielaMaxPoints(matchCount: number): number {
  return matchCount * BASE_QUINIELA_POINTS_PER_HIT
}

export const BASE_QUINIELA_MAX_POINTS = baseQuinielaMaxPoints(BASE_QUINIELA_MATCHES_PER_ROUND)

export const BASE_PAYMENT_INFO = {
  ...PAYMENT_INFO,
  amountLabel: `$${BASE_ENTRY_FEE_MXN} MXN por jornada`,
  concept: 'Quiniela — incluye concepto y número de jornada',
} as const

export function baseQuinielaFillTip(matchCount: number) {
  const n = matchCount > 1 ? `${matchCount} partidos` : 'el partido'
  return {
    draft: `Puedes cambiar tus picks libremente. Cuando marques ${matchCount > 1 ? `los ${n}` : n}, podrás guardar tu quiniela.`,
    readyToSubmit:
      matchCount > 1
        ? `Marcaste los ${matchCount} partidos. Guarda tu quiniela para confirmarla — después no podrás cambiar ningún pick.`
        : 'Marcaste el partido. Guarda tu quiniela para confirmarla — después no podrás cambiar tu pick.',
    submitted: 'Tu quiniela está guardada. Ya no puedes modificar tus picks.',
  } as const
}

/** @deprecated Usar baseQuinielaFillTip(matchCount) */
export const BASE_QUINIELA_FILL_TIP = baseQuinielaFillTip(BASE_QUINIELA_MATCHES_PER_ROUND)

export function baseQuinielaSaveAlert(matchCount: number) {
  const partidos =
    matchCount === 1 ? 'el partido' : `los ${matchCount} partidos`
  return {
    title: '¿Guardamos tu quiniela?',
    subtitle: 'Lee esto antes de confirmar 👇',
    sections: [
      {
        title: 'Lo importante',
        bullets: [
          'Una vez guardada, no podrás cambiar ningún partido.',
          'Revisa bien tus picks de L, E o V antes de confirmar.',
          `Solo puedes guardar cuando hayas marcado ${partidos}.`,
        ],
      },
    ],
    confirm: 'Sí, guardar quiniela',
  } as const
}

/** @deprecated Usar baseQuinielaSaveAlert(matchCount) */
export const BASE_QUINIELA_SAVE_ALERT = baseQuinielaSaveAlert(BASE_QUINIELA_MATCHES_PER_ROUND)

export const BASE_QUINIELA_LOGIC = {
  title: 'Quiniela',
  summary: `Deposita $${BASE_ENTRY_FEE_MXN} MXN por cada quiniela que juegues en una jornada. Marca L, E o V en cada partido de la jornada. Cada acierto suma ${BASE_QUINIELA_POINTS_PER_HIT} puntos. Ranking independiente por quiniela.`,
  howItWorks: [
    `Transfiere $${BASE_ENTRY_FEE_MXN} MXN por cada quiniela que quieras jugar en una jornada.`,
    BASE_QUINIELA_ENTRIES_PER_ROUND_HINT,
    'Fase de grupos: jornadas de 16 partidos (del más temprano al más tarde).',
    'Eliminatoria: una jornada por ronda — dieciseisavos (16), octavos (8), cuartos (4), semifinal (2) y tercer lugar (1).',
    'Marca L, E o V para cada partido antes de que empiece y cuando los equipos estén confirmados.',
    'Puedes cambiar tus picks mientras no hayas guardado la quiniela.',
    'Al guardar la quiniela completa, tus picks quedan bloqueados definitivamente.',
    'Al terminar cada partido se revisa tu pick automáticamente.',
    `Cada acierto vale ${BASE_QUINIELA_POINTS_PER_HIT} puntos (el máximo depende de cuántos partidos tenga la jornada).`,
    'El ranking de la jornada ordena por aciertos; en empate, por puntos.',
  ],
  scoring: [
    { label: 'Acierto L/E/V', points: BASE_QUINIELA_POINTS_PER_HIT },
    { label: 'Fallo', points: 0 },
  ],
} as const
