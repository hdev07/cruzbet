/** Formato de minuto de gol/tarjeta para mostrar en vivo (ej. 45+2' o 67:30'). */
export function formatGoalEventTime(minute: number, extraTime = 0, second = 0): string {
  if (extraTime > 0) {
    const suffix = second > 0 ? `:${String(second).padStart(2, '0')}` : ''
    return `${minute}+${extraTime}${suffix}'`
  }
  if (second > 0) return `${minute}:${String(second).padStart(2, '0')}'`
  return `${minute}'`
}
