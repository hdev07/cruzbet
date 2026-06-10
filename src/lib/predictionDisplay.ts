import { isMatchOpenForPredictions } from '@/lib/matchRules'
import type { Match, Prediction } from '@/types'

export type PredictionStatusKind =
  | 'editable'
  | 'saved'
  | 'live'
  | 'scored'
  | 'no_points'
  | 'closed'

export interface PredictionStatusInfo {
  kind: PredictionStatusKind
  label: string
  detail: string
}

export function isGoalPrediction(prediction: Prediction): boolean {
  return prediction.prediction_type === 'goal' || prediction.prediction_type == null
}

export function isScorePrediction(prediction: Prediction): boolean {
  return prediction.prediction_type === 'score'
}

export function totalPredictionPoints(prediction: Prediction): number {
  if (isScorePrediction(prediction)) {
    return prediction.score_points ?? 0
  }
  return prediction.points
}

export function teamLabelForMatch(match: Match | undefined, team: 'home' | 'away'): string {
  if (!match) return team === 'home' ? 'Local' : 'Visitante'
  return team === 'home'
    ? (match.home_team?.name ?? 'Local')
    : (match.away_team?.name ?? 'Visitante')
}

export function predictionSummary(
  prediction: Prediction,
  match?: Match,
): string {
  if (isScorePrediction(prediction)) {
    const home = prediction.predicted_home_score ?? 0
    const away = prediction.predicted_away_score ?? 0
    return `Marcador ${home}-${away}`
  }

  const team = teamLabelForMatch(match, prediction.predicted_team ?? 'home')
  return `Gol ${team} al ${prediction.predicted_minute}'`
}

function scoredDetail(prediction: Prediction): string {
  if (isScorePrediction(prediction)) {
    const pts = prediction.score_points ?? 0
    return pts > 0 ? `Marcador: ${pts} pts` : 'Marcador sin puntos'
  }

  if (prediction.points > 0) return `Gol: ${prediction.points} pts`
  return 'Gol sin puntos'
}

export function getPredictionStatus(
  prediction: Prediction,
  match?: Match,
): PredictionStatusInfo {
  if (!match) {
    return {
      kind: 'saved',
      label: 'Registrada',
      detail: 'Esperando datos del partido',
    }
  }

  if (match.status === 'finished') {
    if (prediction.scored_at) {
      const total = totalPredictionPoints(prediction)
      if (total > 0) {
        return {
          kind: 'scored',
          label: `${total} pts`,
          detail: scoredDetail(prediction),
        }
      }
      return {
        kind: 'no_points',
        label: '0 pts',
        detail: scoredDetail(prediction),
      }
    }
    return {
      kind: 'closed',
      label: 'Finalizado',
      detail: 'Puntos pendientes de cálculo',
    }
  }

  if (isMatchOpenForPredictions(match)) {
    return {
      kind: 'editable',
      label: 'Editable',
      detail: 'Puedes eliminarla hasta el inicio del partido',
    }
  }

  if (match.status === 'live') {
    return {
      kind: 'live',
      label: 'En vivo',
      detail: 'Predicciones cerradas al iniciar el partido',
    }
  }

  return {
    kind: 'closed',
    label: 'Cerrada',
    detail: 'Las predicciones cerraron al iniciar el partido',
  }
}

export const statusBadgeClass: Record<PredictionStatusKind, string> = {
  editable: 'bg-mundial-accent/20 text-mundial-accent',
  saved: 'bg-blue-500/20 text-blue-300',
  live: 'bg-mundial-green/20 text-mundial-green',
  scored: 'bg-mundial-green/20 text-mundial-green',
  no_points: 'bg-slate-500/20 text-slate-400',
  closed: 'bg-slate-500/20 text-slate-400',
}
