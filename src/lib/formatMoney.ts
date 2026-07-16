/** Formato corto MXN sin decimales (p. ej. $1,000). */
export function formatMxn(amount: number): string {
  return `$${amount.toLocaleString('es-MX')} MXN`
}
