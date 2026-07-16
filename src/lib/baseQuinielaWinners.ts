/** Entradas empatadas en el primer lugar (mismos aciertos y puntos). */
export function getTiedFirstPlaceEntries<
  T extends { correct_count: number; total_points: number },
>(entries: T[]): T[] {
  if (!entries.length) return []
  const top = entries[0]!
  return entries.filter(
    (entry) =>
      entry.correct_count === top.correct_count &&
      entry.total_points === top.total_points,
  )
}

/** Solo depósitos verificados cuentan para pozo / ganador oficial. */
export function getOfficialLeaderboardEntries<
  T extends { verified?: boolean; correct_count: number; total_points: number },
>(entries: T[]): T[] {
  return entries.filter((entry) => entry.verified === true)
}

export function winnerUserIdsFromEntries(
  entries: { user_id: string; correct_count: number; total_points: number; verified?: boolean }[],
): string[] {
  const official = getOfficialLeaderboardEntries(entries)
  return [...new Set(getTiedFirstPlaceEntries(official).map((entry) => entry.user_id))]
}

/** Orden público: verificados primero, luego aciertos / puntos. */
export function sortLeaderboardEntries<
  T extends { verified?: boolean; correct_count: number; total_points: number; entry_number?: number },
>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const aVerified = a.verified === true ? 1 : 0
    const bVerified = b.verified === true ? 1 : 0
    if (bVerified !== aVerified) return bVerified - aVerified
    if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    return (a.entry_number ?? 0) - (b.entry_number ?? 0)
  })
}
