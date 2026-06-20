import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import { useGroupStandingsStore } from '@/stores/groupStandingsStore'
import { useMatchStore } from '@/stores/matchStore'
import { useRankingStore } from '@/stores/rankingStore'
import { supabase } from '@/lib/supabase'
import type { Match, MatchEvent, Profile } from '@/types'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

let channel: RealtimeChannel | null = null
let subscribers = 0
let standingsTimer: ReturnType<typeof setTimeout> | null = null
let leaderboardTimer: ReturnType<typeof setTimeout> | null = null
let rankingTimer: ReturnType<typeof setTimeout> | null = null

function scheduleStandingsRefresh(fn: () => void) {
  if (standingsTimer) clearTimeout(standingsTimer)
  standingsTimer = setTimeout(fn, 200)
}

function scheduleLeaderboardRefresh(fn: () => void) {
  if (leaderboardTimer) clearTimeout(leaderboardTimer)
  leaderboardTimer = setTimeout(fn, 400)
}

function scheduleRankingRefresh(fn: () => void) {
  if (rankingTimer) clearTimeout(rankingTimer)
  rankingTimer = setTimeout(fn, 400)
}

async function startAppRealtime() {
  const matchStore = useMatchStore()
  const standingsStore = useGroupStandingsStore()
  const rankingStore = useRankingStore()
  const baseStore = useBaseQuinielaStore()
  const auth = useAuthStore()

  await Promise.all([
    matchStore.fetchMatches(),
    matchStore.fetchLiveMatches(),
    standingsStore.fetchStandingsData(),
  ])
  standingsStore.refreshFromMatches(matchStore.matches)

  channel = supabase
    .channel('app-realtime')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'matches' },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        const row = payload.new as Match
        const prev = payload.old as Partial<Match> | undefined
        matchStore.applyMatchPatch(row)
        standingsStore.patchMatch(row)
        baseStore.patchRoundMatch(row)

        const scoreChanged =
          prev?.home_score !== row.home_score || prev?.away_score !== row.away_score
        if (scoreChanged || row.status === 'live' || row.status === 'finished') {
          void matchStore.fetchEvents(row.id)
        }

        if (row.status === 'finished') {
          scheduleLeaderboardRefresh(() => {
            void baseStore.refreshLeaderboardForMatch(row.id)
          })
        }
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'matches' },
      () => {
        scheduleStandingsRefresh(() => {
          void matchStore.fetchMatches().then(() => {
            standingsStore.refreshFromMatches(matchStore.matches)
          })
        })
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'match_events' },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        const event = payload.new as MatchEvent
        matchStore.addEvent(event)
        // El marcador llega con el UPDATE de matches (trigger sync_match_score_from_goals).
        scheduleRankingRefresh(() => {
          void rankingStore.fetchGlobalRanking()
        })
        scheduleLeaderboardRefresh(() => {
          void baseStore.refreshLeaderboardForMatch(event.match_id)
        })
      },
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'match_events' },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        const event = payload.old as MatchEvent
        if (!event?.id || !event?.match_id) return
        matchStore.removeEvent(event.id, event.match_id)
        scheduleRankingRefresh(() => {
          void rankingStore.fetchGlobalRanking()
        })
        scheduleLeaderboardRefresh(() => {
          void baseStore.refreshLeaderboardForMatch(event.match_id)
        })
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'predictions' },
      () => {
        scheduleRankingRefresh(() => {
          void rankingStore.fetchGlobalRanking()
          if (auth.user) void auth.fetchProfile(auth.user.id)
        })
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles' },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        const profile = payload.new as Profile
        rankingStore.patchProfile(profile)
        if (auth.user?.id === profile.id) {
          void auth.fetchProfile(profile.id)
        }
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'base_predictions' },
      (payload: RealtimePostgresChangesPayload<{ [key: string]: unknown }>) => {
        const row = payload.new as { match_id?: string; round_id?: string }
        scheduleLeaderboardRefresh(() => {
          if (row.round_id) {
            void baseStore.fetchRoundLeaderboard(row.round_id)
          } else if (row.match_id) {
            void baseStore.refreshLeaderboardForMatch(row.match_id)
          }
        })
      },
    )
    .subscribe()
}

function stopAppRealtime() {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
  if (standingsTimer) clearTimeout(standingsTimer)
  if (leaderboardTimer) clearTimeout(leaderboardTimer)
  if (rankingTimer) clearTimeout(rankingTimer)
  standingsTimer = null
  leaderboardTimer = null
  rankingTimer = null
}

/** Suscripción global: partidos, goles, tablas, rankings. */
export function useAppRealtime() {
  onMounted(() => {
    subscribers += 1
    if (subscribers === 1) {
      void startAppRealtime()
    }
  })

  onUnmounted(() => {
    subscribers = Math.max(0, subscribers - 1)
    if (subscribers === 0) {
      stopAppRealtime()
    }
  })
}
