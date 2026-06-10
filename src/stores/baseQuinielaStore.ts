import { defineStore } from 'pinia'
import { ref } from 'vue'
import { BASE_QUINIELA_MATCHES_PER_ROUND } from '@/constants/base-quiniela-rules'
import { isMatchOpenForPredictions } from '@/lib/matchRules'
import { supabase } from '@/lib/supabase'
import type {
  BasePrediction,
  BaseQuinielaRound,
  BaseQuinielaRoundMatch,
  BaseRoundLeaderboardEntry,
  Match,
  PredictedWinner,
} from '@/types'

const MATCH_SELECT = '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'

export const useBaseQuinielaStore = defineStore('baseQuiniela', () => {
  const rounds = ref<BaseQuinielaRound[]>([])
  const currentRound = ref<BaseQuinielaRound | null>(null)
  const roundMatches = ref<BaseQuinielaRoundMatch[]>([])
  const myPredictions = ref<BasePrediction[]>([])
  const leaderboard = ref<BaseRoundLeaderboardEntry[]>([])
  const loading = ref(false)
  const saving = ref(false)

  async function fetchRounds() {
    loading.value = true
    const { data, error } = await supabase
      .from('base_quiniela_rounds')
      .select('*')
      .order('round_number', { ascending: true })

    if (!error && data) rounds.value = data as BaseQuinielaRound[]
    loading.value = false
  }

  async function fetchRound(roundId: string) {
    loading.value = true
    const { data: round, error: roundErr } = await supabase
      .from('base_quiniela_rounds')
      .select('*')
      .eq('id', roundId)
      .single()

    if (roundErr || !round) {
      loading.value = false
      throw roundErr ?? new Error('Jornada no encontrada')
    }

    currentRound.value = round as BaseQuinielaRound

    const { data: links, error: linksErr } = await supabase
      .from('base_quiniela_round_matches')
      .select(`id, round_id, match_id, position, match:matches(${MATCH_SELECT})`)
      .eq('round_id', roundId)
      .order('position', { ascending: true })

    if (linksErr) {
      loading.value = false
      throw linksErr
    }

    roundMatches.value = (links ?? []).map((row) => ({
      id: row.id,
      round_id: row.round_id,
      match_id: row.match_id,
      position: row.position,
      match: row.match as unknown as Match,
    }))
    loading.value = false
  }

  async function fetchMyPredictions(roundId: string, userId: string) {
    const { data, error } = await supabase
      .from('base_predictions')
      .select('*')
      .eq('round_id', roundId)
      .eq('user_id', userId)

    if (error) throw error
    myPredictions.value = (data ?? []) as BasePrediction[]
  }

  async function fetchRoundLeaderboard(roundId: string) {
    const { data, error } = await supabase
      .from('base_round_leaderboard')
      .select('*')
      .eq('round_id', roundId)
      .eq('is_complete', true)
      .order('correct_count', { ascending: false })
      .order('total_points', { ascending: false })
      .limit(50)

    if (error) throw error
    leaderboard.value = (data ?? []) as BaseRoundLeaderboardEntry[]
  }

  function getPredictionForMatch(matchId: string): BasePrediction | undefined {
    return myPredictions.value.find((p) => p.match_id === matchId)
  }

  function isRoundOpenForPredictions(): boolean {
    return roundMatches.value.some(
      (rm) => rm.match && isMatchOpenForPredictions(rm.match),
    )
  }

  function myProgress(): { filled: number; total: number } {
    const total = currentRound.value?.match_count ?? BASE_QUINIELA_MATCHES_PER_ROUND
    return { filled: myPredictions.value.length, total }
  }

  async function savePrediction(
    roundId: string,
    match: Match,
    userId: string,
    winner: PredictedWinner,
  ): Promise<BasePrediction> {
    if (!isMatchOpenForPredictions(match)) {
      throw new Error('Las predicciones cerraron: el partido ya inició o terminó')
    }

    if (!['home', 'draw', 'away'].includes(winner)) {
      throw new Error('Elige L (local), E (empate) o V (visita)')
    }

    saving.value = true
    try {
      const existing = getPredictionForMatch(match.id)

      if (existing) {
        const { data, error } = await supabase
          .from('base_predictions')
          .update({ predicted_winner: winner, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        const updated = data as BasePrediction
        const idx = myPredictions.value.findIndex((p) => p.id === updated.id)
        if (idx >= 0) myPredictions.value[idx] = updated
        return updated
      }

      const { data, error } = await supabase
        .from('base_predictions')
        .insert({
          user_id: userId,
          round_id: roundId,
          match_id: match.id,
          predicted_winner: winner,
        })
        .select()
        .single()

      if (error) throw error
      const created = data as BasePrediction
      myPredictions.value.push(created)
      return created
    } finally {
      saving.value = false
    }
  }

  async function fetchUserHistory(userId: string) {
    const { data, error } = await supabase
      .from('base_predictions')
      .select(
        `*, round:base_quiniela_rounds(id, title, round_number), match:matches(${MATCH_SELECT})`,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as (BasePrediction & {
      round?: BaseQuinielaRound
      match?: Match
    })[]
  }

  return {
    rounds,
    currentRound,
    roundMatches,
    myPredictions,
    leaderboard,
    loading,
    saving,
    fetchRounds,
    fetchRound,
    fetchMyPredictions,
    fetchRoundLeaderboard,
    fetchUserHistory,
    getPredictionForMatch,
    isRoundOpenForPredictions,
    myProgress,
    savePrediction,
  }
})
