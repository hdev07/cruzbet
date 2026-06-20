import { PAYMENT_INFO } from '@/constants/quiniela-rules'

export const BASE_ENTRY_FEE_MXN = 50
export const BASE_QUINIELA_MATCHES_PER_ROUND = 16
export const BASE_QUINIELA_POINTS_PER_HIT = 50
/** Cuotas adicionales por jornada (cada quiniela extra cuesta lo mismo). Sin tope duro en app. */
export const BASE_QUINIELA_ENTRIES_PER_ROUND_HINT =
  'Puedes jugar más de una quiniela en la misma jornada. Cada quiniela extra requiere otro depósito.'
/** Jornada activa por defecto al entrar a la quiniela (mínimo). */
export const BASE_QUINIELA_MIN_ACTIVE_ROUND = 2
export const BASE_QUINIELA_MAX_POINTS =
  BASE_QUINIELA_MATCHES_PER_ROUND * BASE_QUINIELA_POINTS_PER_HIT

export const BASE_PAYMENT_INFO = {
  ...PAYMENT_INFO,
  amountLabel: `$${BASE_ENTRY_FEE_MXN} MXN por jornada`,
  concept: 'Quiniela — incluye concepto y número de jornada',
} as const

export const BASE_QUINIELA_FILL_TIP = {
  draft:
    'Puedes cambiar tus picks libremente. Cuando marques los 16 partidos, podrás guardar tu quiniela.',
  readyToSubmit:
    'Marcaste los 16 partidos. Guarda tu quiniela para confirmarla — después no podrás cambiar ningún pick.',
  submitted:
    'Tu quiniela está guardada. Ya no puedes modificar tus picks.',
} as const

export const BASE_QUINIELA_SAVE_ALERT = {
  title: '¿Guardamos tu quiniela?',
  subtitle: 'Lee esto antes de confirmar 👇',
  sections: [
    {
      title: 'Lo importante',
      bullets: [
        'Una vez guardada, no podrás cambiar ningún partido.',
        'Revisa bien tus picks de L, E o V antes de confirmar.',
        'Solo puedes guardar cuando hayas marcado los 16 partidos.',
      ],
    },
  ],
  confirm: 'Sí, guardar quiniela',
} as const

export const BASE_QUINIELA_LOGIC = {
  title: 'Quiniela',
  summary: `Deposita $${BASE_ENTRY_FEE_MXN} MXN por cada quiniela que juegues en una jornada. Marca L, E o V en ${BASE_QUINIELA_MATCHES_PER_ROUND} partidos. Cada acierto suma ${BASE_QUINIELA_POINTS_PER_HIT} puntos. Ranking independiente por quiniela.`,
  howItWorks: [
    `Transfiere $${BASE_ENTRY_FEE_MXN} MXN por cada quiniela que quieras jugar en una jornada.`,
    BASE_QUINIELA_ENTRIES_PER_ROUND_HINT,
    `Los partidos se agrupan en jornadas de ${BASE_QUINIELA_MATCHES_PER_ROUND}, del más temprano al más tarde.`,
    'Marca L, E o V para cada partido antes de que empiece.',
    'Puedes cambiar tus picks mientras no hayas guardado la quiniela.',
    'Al guardar la quiniela (16 partidos marcados), tus picks quedan bloqueados definitivamente.',
    'Al terminar cada partido se revisa tu pick automáticamente.',
    `Cada acierto vale ${BASE_QUINIELA_POINTS_PER_HIT} puntos (máximo ${BASE_QUINIELA_MAX_POINTS} por jornada).`,
    'El ranking de la jornada ordena por aciertos; en empate, por puntos.',
  ],
  scoring: [
    { label: 'Acierto L/E/V', points: BASE_QUINIELA_POINTS_PER_HIT },
    { label: 'Fallo', points: 0 },
  ],
} as const
