import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { BASE_QUINIELA_MATCHES_PER_ROUND } from '@/constants/base-quiniela-rules'
import {
  buildFirstKickoffByRoundId,
  resolveActiveBaseRound,
} from '@/lib/baseQuinielaRound'
import { isMatchOpenForPredictions } from '@/lib/matchRules'
import { supabase } from '@/lib/supabase'
import type {
  BasePrediction,
  BaseQuinielaRound,
  BaseQuinielaRoundMatch,
  BaseRoundLeaderboardEntry,
  BaseRoundParticipant,
  BaseRoundPayment,
  Match,
  PredictedWinner,
} from '@/types'

const MATCH_SELECT = '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'

export const useBaseQuinielaStore = defineStore('baseQuiniela', () => {
  const rounds = ref<BaseQuinielaRound[]>([])
  const roundFirstKickoff = ref<Record<string, number | null>>({})
  const currentRound = ref<BaseQuinielaRound | null>(null)

  const activeRound = computed(() =>
    resolveActiveBaseRound(rounds.value, roundFirstKickoff.value),
  )
  const roundMatches = ref<BaseQuinielaRoundMatch[]>([])
  const myPredictions = ref<BasePrediction[]>([])
  const mySubmission = ref<BaseRoundPayment | null>(null)
  const leaderboard = ref<BaseRoundLeaderboardEntry[]>([])
  const loading = ref(false)
  const saving = ref(false)

  async function fetchRounds() {
    loading.value = true
    const [roundsResult, kickoffsResult] = await Promise.all([
      supabase
        .from('base_quiniela_rounds')
        .select('*')
        .order('round_number', { ascending: true }),
      supabase
        .from('base_quiniela_round_matches')
        .select('round_id, match:matches(match_date)'),
    ])

    if (!roundsResult.error && roundsResult.data) {
      rounds.value = roundsResult.data as BaseQuinielaRound[]
    }

    if (!kickoffsResult.error && kickoffsResult.data) {
      roundFirstKickoff.value = buildFirstKickoffByRoundId(
        kickoffsResult.data as unknown as {
          round_id: string
          match: { match_date: string | null } | null
        }[],
      )
    }

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
    const [{ data, error }, { data: payment, error: paymentErr }] = await Promise.all([
      supabase
        .from('base_predictions')
        .select('*')
        .eq('round_id', roundId)
        .eq('user_id', userId),
      supabase
        .from('base_round_payments')
        .select('*')
        .eq('round_id', roundId)
        .eq('user_id', userId)
        .maybeSingle(),
    ])

    if (error) throw error
    if (paymentErr) throw paymentErr
    myPredictions.value = (data ?? []) as BasePrediction[]
    mySubmission.value = (payment ?? null) as BaseRoundPayment | null
  }

  function isQuinielaSubmitted(): boolean {
    return mySubmission.value?.submitted_at != null
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
    if (isQuinielaSubmitted()) {
      throw new Error('Tu quiniela ya está guardada. No puedes cambiar tus picks.')
    }

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

  async function submitQuiniela(roundId: string, userId: string): Promise<void> {
    if (isQuinielaSubmitted()) {
      throw new Error('Tu quiniela ya está guardada')
    }

    const { filled, total } = myProgress()
    if (filled < total) {
      throw new Error('Debes marcar todos los partidos antes de guardar')
    }

    saving.value = true
    try {
      const { error } = await supabase.rpc('submit_base_quiniela', {
        p_round_id: roundId,
      })
      if (error) throw error

      const { data: payment, error: paymentErr } = await supabase
        .from('base_round_payments')
        .select('*')
        .eq('round_id', roundId)
        .eq('user_id', userId)
        .maybeSingle()

      if (paymentErr) throw paymentErr
      mySubmission.value = (payment ?? null) as BaseRoundPayment | null
    } finally {
      saving.value = false
    }
  }

  async function fetchParticipantCountsByRound(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('base_predictions')
      .select('round_id, user_id')

    if (error) throw error

    const byRound = new Map<string, Set<string>>()
    for (const row of data ?? []) {
      const roundId = row.round_id as string
      const userId = row.user_id as string
      if (!byRound.has(roundId)) byRound.set(roundId, new Set())
      byRound.get(roundId)!.add(userId)
    }

    return Object.fromEntries(
      [...byRound.entries()].map(([roundId, users]) => [roundId, users.size]),
    )
  }

  async function fetchRoundParticipants(roundId: string): Promise<BaseRoundParticipant[]> {
    const matchCount =
      currentRound.value?.id === roundId
        ? (currentRound.value.match_count ?? BASE_QUINIELA_MATCHES_PER_ROUND)
        : BASE_QUINIELA_MATCHES_PER_ROUND

    const [{ data: preds, error: predsErr }, { data: payments }] = await Promise.all([
      supabase.from('base_predictions').select('*').eq('round_id', roundId).order('created_at'),
      supabase.from('base_round_payments').select('user_id, verified').eq('round_id', roundId),
    ])

    if (predsErr) throw predsErr
    if (!preds?.length) return []

    const typedPreds = preds as BasePrediction[]
    const verifiedMap = new Map(
      (payments ?? []).map((p: { user_id: string; verified: boolean }) => [p.user_id, p.verified]),
    )
    const userIds = [...new Set(typedPreds.map((p) => p.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar')
      .in('id', userIds)

    type ParticipantProfile = { id: string; username: string | null; avatar: string | null }
    const profileMap = new Map<string, ParticipantProfile>(
      ((profiles ?? []) as ParticipantProfile[]).map((p) => [p.id, p]),
    )
    const grouped = new Map<string, BasePrediction[]>()

    for (const pred of typedPreds) {
      const list = grouped.get(pred.user_id) ?? []
      list.push(pred)
      grouped.set(pred.user_id, list)
    }

    return [...grouped.entries()]
      .map(([user_id, predictions]) => {
        const profile = profileMap.get(user_id)
        const complete = predictions.length >= matchCount
        const total_points = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0)
        const correct_count = predictions.filter((p) => p.points > 0).length
        return {
          user_id,
          verified: verifiedMap.get(user_id) ?? false,
          profiles: profile
            ? { username: profile.username, avatar: profile.avatar }
            : undefined,
          predictions,
          total_points,
          correct_count,
          complete,
        }
      })
      .sort((a, b) => b.total_points - a.total_points)
  }

  async function setPaymentVerified(
    userId: string,
    roundId: string,
    verified: boolean,
  ): Promise<void> {
    const { error } = await supabase.rpc('admin_set_base_payment_verified', {
      p_user_id: userId,
      p_round_id: roundId,
      p_verified: verified,
    })
    if (error) throw error
  }

  async function resetPlayerQuiniela(userId: string, roundId: string): Promise<void> {
    const { error } = await supabase.rpc('admin_reset_base_quiniela', {
      p_user_id: userId,
      p_round_id: roundId,
    })
    if (error) throw error
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
    roundFirstKickoff,
    activeRound,
    currentRound,
    roundMatches,
    myPredictions,
    mySubmission,
    leaderboard,
    loading,
    saving,
    fetchRounds,
    fetchRound,
    fetchMyPredictions,
    fetchRoundLeaderboard,
    fetchUserHistory,
    fetchParticipantCountsByRound,
    fetchRoundParticipants,
    setPaymentVerified,
    resetPlayerQuiniela,
    getPredictionForMatch,
    isQuinielaSubmitted,
    isRoundOpenForPredictions,
    myProgress,
    savePrediction,
    submitQuiniela,
  }
})
