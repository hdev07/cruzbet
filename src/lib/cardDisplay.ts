import { formatGoalEventTime } from '@/lib/eventTime'
import { teamDisplayName } from '@/lib/teamDisplay'
import type { Match, MatchEvent } from '@/types'

export type CardType = 'yellow' | 'second_yellow' | 'red'

const CARD_TYPE_LABELS: Record<CardType, string> = {
  yellow: 'Amarilla',
  second_yellow: 'Segunda amarilla',
  red: 'Roja',
}

/** Formato de referencia (Tabla Fair Play): amarilla/segunda amarilla → mundial-warning, roja → mundial-error. */
const CARD_SWATCH_CLASSES: Record<CardType, string> = {
  yellow: 'bg-mundial-warning',
  second_yellow: 'bg-mundial-error',
  red: 'bg-mundial-error',
}

const CARD_TEXT_CLASSES: Record<CardType, string> = {
  yellow: 'text-mundial-warning',
  second_yellow: 'text-mundial-error',
  red: 'text-mundial-error',
}

const CARD_BADGE_CLASSES: Record<CardType, string> = {
  yellow: 'bg-mundial-warning/20 text-mundial-warning',
  second_yellow: 'bg-mundial-error/20 text-mundial-warning',
  red: 'bg-mundial-error/20 text-mundial-error',
}

export function normalizeCardType(value: unknown): CardType {
  if (value === 'red') return 'red'
  if (value === 'second_yellow') return 'second_yellow'
  return 'yellow'
}

export function cardTypeLabel(type: unknown): string {
  return CARD_TYPE_LABELS[normalizeCardType(type)]
}

/** Clase de fondo para el indicador rectangular de tarjeta (mismo formato que la Tabla Fair Play). */
export function cardSwatchClass(type: unknown): string {
  return CARD_SWATCH_CLASSES[normalizeCardType(type)]
}

/** Clase de color de texto para tarjeta (mismo formato que la Tabla Fair Play). */
export function cardTextClass(type: unknown): string {
  return CARD_TEXT_CLASSES[normalizeCardType(type)]
}

/** Clase de fondo + texto para badges/pills de tarjeta. */
export function cardBadgeClass(type: unknown): string {
  return CARD_BADGE_CLASSES[normalizeCardType(type)]
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
