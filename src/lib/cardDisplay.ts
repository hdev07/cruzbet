import { formatGoalEventTime } from '@/lib/predictionMinutes'
import { teamDisplayName } from '@/lib/teamDisplay'
import type { Match, MatchEvent } from '@/types'

export type CardType = 'yellow' | 'red'

const CARD_TYPE_LABELS: Record<CardType, string> = {
  yellow: 'Amarilla',
  red: 'Roja',
}

export function normalizeCardType(value: unknown): CardType {
  if (value === 'red') return 'red'
  return 'yellow'
}

export function cardTypeLabel(type: unknown): string {
  return CARD_TYPE_LABELS[normalizeCardType(type)]
}

export function formatCardScorer(event: MatchEvent, match: Match): string {
  const meta = event.metadata ?? {}
  const player =
    (typeof meta.player === 'string' && meta.player) ||
    event.players?.name ||
    null

  if (player) return player

  const team =
    event.team_id === match.home_team_id
      ? teamDisplayName(match.home_team, 'Local')
      : teamDisplayName(match.away_team, 'Visitante')
  return team
}

export function formatCardLine(event: MatchEvent, match: Match): string {
  const player = formatCardScorer(event, match)
  const time = formatGoalEventTime(event.minute, event.extra_time ?? 0, event.event_second ?? 0)
  const cardLabel = cardTypeLabel(event.metadata?.card_type)
  return `${time} · ${player} · Tarjeta ${cardLabel.toLowerCase()}`
}

export function sortCardEvents(events: MatchEvent[]): MatchEvent[] {
  return [...events]
    .filter((e) => e.event_type === 'card')
    .sort(
      (a, b) =>
        a.minute - b.minute ||
        (a.extra_time ?? 0) - (b.extra_time ?? 0) ||
        (a.event_second ?? 0) - (b.event_second ?? 0),
    )
}

export function cardsForMatch(events: MatchEvent[], matchId: string): MatchEvent[] {
  return sortCardEvents(events.filter((e) => e.match_id === matchId))
}

export function sortMatchEvents(events: MatchEvent[]): MatchEvent[] {
  return [...events]
    .filter((e) => e.event_type === 'goal' || e.event_type === 'card')
    .sort(
      (a, b) =>
        a.minute - b.minute ||
        (a.extra_time ?? 0) - (b.extra_time ?? 0) ||
        (a.event_second ?? 0) - (b.event_second ?? 0),
    )
}
