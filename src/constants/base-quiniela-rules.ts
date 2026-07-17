export const BASE_QUINIELA_MATCHES_PER_ROUND = 9
export const BASE_QUINIELA_POINTS_PER_HIT = 1
export const BASE_QUINIELA_MIN_ACTIVE_ROUND = 1
/** Cuota por quiniela / jornada (MXN). */
export const BASE_ENTRY_FEE_MXN = 50

/** Datos bancarios para depósito (misma cuenta que antes). */
export const BASE_PAYMENT_INFO = {
  beneficiary: 'Hector Alejandro Cruz Solis',
  bank: 'Banco Azteca',
  accountNumber: '95461681853442',
  accountNumberDisplay: '9546 1681 8534 42',
  clabe: '127180016818534429',
  clabeDisplay: '1271 8001 6818 534429',
  amountLabel: `$${BASE_ENTRY_FEE_MXN} MXN por quiniela`,
  concept: 'Quiniela — escribe tu usuario y el número de jornada',
} as const

export const BASE_PAYMENT_NOTES = [
  `La cuota es de $${BASE_ENTRY_FEE_MXN} MXN por cada quiniela que juegues en una jornada.`,
  'Realiza el depósito o transferencia antes de guardar tu quiniela.',
  'En el concepto o referencia escribe tu nombre de usuario para identificar el pago.',
] as const

/** Hasta este # de depósitos verificados la comisión es la baja. */
export const ADMIN_FEE_SMALL_GROUP_MAX = 20
/** Comisión admin con ≤ ADMIN_FEE_SMALL_GROUP_MAX verificados (0–1). */
export const ADMIN_FEE_RATE_SMALL = 0.05
/** Comisión admin con más de ADMIN_FEE_SMALL_GROUP_MAX verificados (0–1). */
export const ADMIN_FEE_RATE_LARGE = 0.1

export type RoundPoolBreakdown = {
  verifiedCount: number
  entryFee: number
  gross: number
  feeRate: number
  feePercent: number
  adminFee: number
  /** Pozo a repartir (bruto − comisión). */
  net: number
}

/** % de comisión según # de depósitos verificados. */
export function adminFeeRateForVerifiedCount(verifiedCount: number): number {
  return verifiedCount <= ADMIN_FEE_SMALL_GROUP_MAX
    ? ADMIN_FEE_RATE_SMALL
    : ADMIN_FEE_RATE_LARGE
}

/** Pozo automático: bruto, comisión y neto a repartir. */
export function computeRoundPool(verifiedCount: number): RoundPoolBreakdown {
  const safeCount = Math.max(0, Math.floor(verifiedCount))
  const feeRate = adminFeeRateForVerifiedCount(safeCount)
  const gross = safeCount * BASE_ENTRY_FEE_MXN
  const adminFee = Math.round(gross * feeRate)
  return {
    verifiedCount: safeCount,
    entryFee: BASE_ENTRY_FEE_MXN,
    gross,
    feeRate,
    feePercent: Math.round(feeRate * 100),
    adminFee,
    net: Math.max(0, gross - adminFee),
  }
}

export type RuleAlertSection = {
  title: string
  bullets: readonly string[]
}

export function baseQuinielaMaxPoints(matchCount: number): number {
  return matchCount * BASE_QUINIELA_POINTS_PER_HIT
}

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

export function baseQuinielaSaveAlert(matchCount: number) {
  const partidos =
    matchCount === 1 ? 'el partido' : `los ${matchCount} partidos`
  return {
    title: '¿Guardamos tu quiniela?',
    subtitle: 'Lee esto antes de confirmar',
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

export const BASE_QUINIELA_LOGIC = {
  title: 'Quiniela Liga MX',
  summary:
    'Marca L, E o V en cada partido. Entrada $50 MXN: el pozo se calcula solo con depósitos verificados (5% comisión hasta 20 jugadores, 10% si hay más).',
  howItWorks: [
    'Cada jornada incluye los partidos programados de Liga MX.',
    'Marca L (local), E (empate) o V (visitante) para cada partido.',
    'Puedes cambiar tus picks mientras no hayas guardado la quiniela.',
    'Al guardar la quiniela completa, tus picks quedan bloqueados.',
    'Al terminar cada partido se revisa tu pick automáticamente.',
    'El pozo a repartir se calcula solo: no hay que capturarlo a mano.',
  ],
} as const
