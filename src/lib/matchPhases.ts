export const PHASE_LABELS: Record<string, string> = {
  group: 'Grupos',
  r32: 'Dieciseisavos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinal',
  third: 'Tercer lugar',
  final: 'Final',
}

export const KNOCKOUT_PHASES = ['r32', 'r16', 'qf', 'sf', 'third', 'final'] as const

export type KnockoutPhase = (typeof KNOCKOUT_PHASES)[number]

export function phaseLabel(phase: string | null | undefined): string {
  if (!phase) return 'Partido'
  return PHASE_LABELS[phase] ?? phase
}
