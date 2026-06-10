/** Minutos codificados para la grilla de predicción del primer gol */

/** Valor especial: predicción "No habrá goles" */
export const NO_GOALS_MINUTE = 0

export const FIRST_HALF_REGULAR = Array.from({ length: 45 }, (_, i) => i + 1)
export const FIRST_HALF_EXTRA = Array.from({ length: 10 }, (_, i) => 46 + i)
export const SECOND_HALF_REGULAR = Array.from({ length: 45 }, (_, i) => 56 + i)
export const SECOND_HALF_EXTRA = Array.from({ length: 10 }, (_, i) => 101 + i)

export const ALL_ENCODED_MINUTES = [
  ...FIRST_HALF_REGULAR,
  ...FIRST_HALF_EXTRA,
  ...SECOND_HALF_REGULAR,
  ...SECOND_HALF_EXTRA,
]

export function encodeMatchMinute(matchMinute: number, extraTime = 0): number {
  if (extraTime > 0) {
    if (matchMinute <= 45) return 45 + extraTime
    return 100 + extraTime
  }
  if (matchMinute <= 45) return matchMinute
  if (matchMinute <= 90) return matchMinute + 10
  return matchMinute
}

export function formatGoalEventTime(minute: number, extraTime = 0, second = 0): string {
  if (extraTime > 0) {
    const suffix = second > 0 ? `:${String(second).padStart(2, '0')}` : ''
    return `${minute}+${extraTime}${suffix}'`
  }
  if (second > 0) return `${minute}:${String(second).padStart(2, '0')}'`
  return `${minute}'`
}

export function isNoGoalsMinute(value: number): boolean {
  return value === NO_GOALS_MINUTE
}

export function formatEncodedMinute(encoded: number): string {
  if (encoded === NO_GOALS_MINUTE) return 'Sin goles'
  if (encoded <= 45) return `${encoded}'`
  if (encoded <= 55) return `45+${encoded - 45}'`
  if (encoded <= 100) return `${encoded - 10}'`
  return `90+${encoded - 100}'`
}

export function isValidEncodedMinute(value: number): boolean {
  return ALL_ENCODED_MINUTES.includes(value)
}

export function isValidGoalMinutePrediction(value: number): boolean {
  return isNoGoalsMinute(value) || isValidEncodedMinute(value)
}

/** A partir del segundo 30 del minuto, el gol cuenta para el siguiente casillero de la grilla */
export const GOAL_SECOND_ROUND_UP_THRESHOLD = 30

/** Siguiente casilla en la grilla (34 → 35, 45 → 45+1, 90' → 90+1, etc.) */
export function incrementEncodedMinute(encoded: number): number {
  if (encoded >= 1 && encoded <= 44) return encoded + 1
  if (encoded === 45) return 46
  if (encoded >= 46 && encoded <= 54) return encoded + 1
  if (encoded === 55) return 56
  if (encoded >= 56 && encoded <= 99) return encoded + 1
  if (encoded === 100) return 101
  if (encoded >= 101 && encoded <= 109) return encoded + 1
  return encoded
}

/**
 * Minuto efectivo del gol para puntuar.
 * Ej.: gol al 34:45 → cuenta como minuto 35 (más cerca del casillero 35 que del 34).
 */
export function goalEffectiveEncodedMinute(
  matchMinute: number,
  extraTime = 0,
  second = 0,
): number {
  const encoded = encodeMatchMinute(matchMinute, extraTime)
  if (second >= GOAL_SECOND_ROUND_UP_THRESHOLD) {
    return incrementEncodedMinute(encoded)
  }
  return encoded
}

export function firstGoalMinutePoints(
  predictedEncoded: number,
  goalMatchMinute: number | null,
  goalExtraTime = 0,
  goalSecond = 0,
): number {
  if (isNoGoalsMinute(predictedEncoded)) {
    return goalMatchMinute == null ? 50 : 0
  }
  if (goalMatchMinute == null) return 0
  const effective = goalEffectiveEncodedMinute(goalMatchMinute, goalExtraTime, goalSecond)
  return predictedEncoded === effective ? 50 : 0
}
