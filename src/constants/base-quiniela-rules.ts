export const BASE_QUINIELA_MATCHES_PER_ROUND = 9
export const BASE_QUINIELA_POINTS_PER_HIT = 1
export const BASE_QUINIELA_MIN_ACTIVE_ROUND = 1
/** Cuota por quiniela / jornada (MXN). */
export const BASE_ENTRY_FEE_MXN = 50

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
  summary: 'Marca L, E o V en cada partido de la jornada antes del kickoff.',
  howItWorks: [
    'Cada jornada incluye los partidos programados de Liga MX.',
    'Marca L (local), E (empate) o V (visitante) para cada partido.',
    'Puedes cambiar tus picks mientras no hayas guardado la quiniela.',
    'Al guardar la quiniela completa, tus picks quedan bloqueados.',
    'Al terminar cada partido se revisa tu pick automáticamente.',
  ],
} as const
