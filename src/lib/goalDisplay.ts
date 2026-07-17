import { formatGoalEventTime } from '@/lib/eventTime'
import { teamDisplayName } from '@/lib/teamDisplay'
import type { Match, MatchEvent } from '@/types'

export type GoalType = 'foot' | 'penalty' | 'own_goal' | 'header' | 'free_kick'

const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  foot: 'Gol',
  penalty: 'Penal',
  own_goal: 'Autogol',
  header: 'De cabeza',
  free_kick: 'Tiro libre',
}

export function normalizeGoalType(value: unknown): GoalType {
  if (typeof value !== 'string') return 'foot'
  if (value in GOAL_TYPE_LABELS) return value as GoalType
  return 'foot'
}

export function goalTypeLabel(type: unknown): string {
  return GOAL_TYPE_LABELS[normalizeGoalType(type)] ?? 'Gol'
}

export function goalTypeShortLabel(type: unknown): string | null {
  const normalized = normalizeGoalType(type)
  if (normalized === 'foot') return null
  return GOAL_TYPE_LABELS[normalized]
}

export function formatGoalScorer(event: MatchEvent, match: Match): string {
  const meta = event.metadata ?? {}
  const player =
    (typeof meta.player === 'string' && meta.player) ||
    event.players?.name ||
    null

  const team =
    event.team_id === match.home_team_id
      ? teamDisplayName(match.home_team, 'Local')
      : teamDisplayName(match.away_team, 'Visitante')

  if (player) return player
  return team
}

export function formatGoalLine(event: MatchEvent, match: Match): string {
  const scorer = formatGoalScorer(event, match)
  const time = formatGoalEventTime(event.minute, event.extra_time ?? 0, event.event_second ?? 0)
  const typeTag = goalTypeShortLabel(event.metadata?.type)
  const parts = [time, scorer]
  if (typeTag) parts.push(`(${typeTag})`)
  return parts.join(' · ')
}

export function sortGoalEvents(events: MatchEvent[]): MatchEvent[] {
  return [...events]
    .filter((e) => e.event_type === 'goal')
    .sort(
      (a, b) =>
        a.minute - b.minute ||
        (a.extra_time ?? 0) - (b.extra_time ?? 0) ||
        (a.event_second ?? 0) - (b.event_second ?? 0),
    )
}

export function goalsForMatch(events: MatchEvent[], matchId: string): MatchEvent[] {
  return sortGoalEvents(events.filter((e) => e.match_id === matchId))
}
