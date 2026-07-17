import { compareBaseRoundRank, rankDisplayName } from '@/lib/baseQuinielaStats'

/**
 * Primer lugar oficial tras el orden (puntos → nombre).
 * Si empatan en puntos, el nombre ya desempató: solo comparte pozo quien
 * quedó igual también en nombre (caso extremo); si no, hay un solo 1º.
 */
export function getTiedFirstPlaceEntries<
  T extends {
    correct_count: number
    total_points: number
    user_id?: string
    entry_number?: number
    username?: string | null
    profiles?: { username?: string | null }
  },
>(entries: T[]): T[] {
  if (!entries.length) return []
  const top = entries[0]!
  const topName = rankDisplayName({
    ...top,
    user_id: top.user_id ?? '',
    entry_number: top.entry_number ?? 0,
  })
  return entries.filter((entry) => {
    const name = rankDisplayName({
      ...entry,
      user_id: entry.user_id ?? '',
      entry_number: entry.entry_number ?? 0,
    })
    return (
      entry.correct_count === top.correct_count &&
      entry.total_points === top.total_points &&
      name.localeCompare(topName, 'es', { sensitivity: 'base' }) === 0
    )
  })
}

/** Solo depósitos verificados cuentan para pozo / ganador oficial. */
export function getOfficialLeaderboardEntries<
  T extends { verified?: boolean; correct_count: number; total_points: number },
>(entries: T[]): T[] {
  return entries.filter((entry) => entry.verified === true)
}

export function winnerUserIdsFromEntries(
  entries: {
    user_id: string
    correct_count: number
    total_points: number
    verified?: boolean
    username?: string | null
    profiles?: { username?: string | null }
    entry_number?: number
  }[],
): string[] {
  const official = getOfficialLeaderboardEntries(entries)
  return [...new Set(getTiedFirstPlaceEntries(official).map((entry) => entry.user_id))]
}

/**
 * Orden público: verificados primero (pozo), luego puntos → nombre.
 * El desempate por partido en vivo solo aplica en la tabla comparativa (tiene picks).
 */
export function sortLeaderboardEntries<
  T extends {
    verified?: boolean
    correct_count: number
    total_points: number
    user_id: string
    entry_number?: number
    username?: string | null
    profiles?: { username?: string | null }
  },
>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const aVerified = a.verified === true ? 1 : 0
    const bVerified = b.verified === true ? 1 : 0
    if (bVerified !== aVerified) return bVerified - aVerified
    return compareBaseRoundRank(
      { ...a, entry_number: a.entry_number ?? 0 },
      { ...b, entry_number: b.entry_number ?? 0 },
    )
  })
}
