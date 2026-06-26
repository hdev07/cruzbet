import { FIFA_ANNEX_C_LOOKUP } from '@/data/fifaAnnexCLookup.generated'

export type AnnexCAssignments = Record<string, string>

/** Clave ordenada de las 8 letras de grupo cuyos terceros clasifican. */
export function thirdPlaceCombinationKey(qualifyingGroupLetters: string[]): string {
  return [...qualifyingGroupLetters].sort().join('')
}

/** Asignación Anexo C: ganador de grupo → grupo del tercero rival. */
export function getAnnexCAssignments(qualifyingGroupLetters: string[]): AnnexCAssignments | null {
  return FIFA_ANNEX_C_LOOKUP[thirdPlaceCombinationKey(qualifyingGroupLetters)] ?? null
}
