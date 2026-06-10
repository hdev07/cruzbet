import { formatEncodedMinute, isNoGoalsMinute } from '@/lib/predictionMinutes'
import { isMatchOpenForPredictions } from '@/lib/matchRules'
import type { Match, PredictedWinner, Prediction } from '@/types'

const WINNER_LABELS: Record<PredictedWinner, string> = {
  home: 'L (Local)',
  draw: 'E (Empate)',
  away: 'V (Visita)',
}

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

export function hasGoalPrediction(predictions: Prediction[]): boolean {
  return predictions.some(isGoalPrediction)
}

export function hasWinnerPrediction(predictions: Prediction[]): boolean {
  return predictions.some(isScorePrediction)
}

/** Ambas apuestas son obligatorias: minuto del primer gol y ganador L/E/V */
export function hasCompletePredictions(predictions: Prediction[]): boolean {
  return hasGoalPrediction(predictions) && hasWinnerPrediction(predictions)
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

export function winnerLabel(winner: PredictedWinner, match?: Match): string {
  if (winner === 'home') return `L — ${match?.home_team?.name ?? 'Local'}`
  if (winner === 'away') return `V — ${match?.away_team?.name ?? 'Visita'}`
  return WINNER_LABELS.draw
}

export function predictionSummary(
  prediction: Prediction,
  match?: Match,
): string {
  if (isScorePrediction(prediction)) {
    if (prediction.predicted_winner) {
      return `Ganador: ${winnerLabel(prediction.predicted_winner, match)}`
    }
    const home = prediction.predicted_home_score ?? 0
    const away = prediction.predicted_away_score ?? 0
    return `Marcador ${home}-${away}`
  }

  if (prediction.predicted_minute != null) {
    if (isNoGoalsMinute(prediction.predicted_minute)) {
      return 'No habrá goles'
    }
    return `Primer gol al ${formatEncodedMinute(prediction.predicted_minute)}`
  }

  const team = teamLabelForMatch(match, prediction.predicted_team ?? 'home')
  return `Gol ${team} al ${prediction.predicted_minute}'`
}

function scoredDetail(prediction: Prediction): string {
  if (isScorePrediction(prediction)) {
    const pts = prediction.score_points ?? 0
    return pts > 0 ? `Ganador: ${pts} pts` : 'Ganador sin puntos'
  }

  if (prediction.points > 0) return `Primer gol: ${prediction.points} pts`
  return 'Minuto del primer gol sin puntos'
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
