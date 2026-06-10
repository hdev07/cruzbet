import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import {
  MAX_GOAL_PREDICTIONS_PER_MATCH,
  MAX_SCORE_PREDICTIONS_PER_MATCH,
} from '@/constants/quiniela-rules'
import { totalPredictionPoints } from '@/lib/predictionDisplay'
import { isMatchOpenForPredictions } from '@/lib/matchRules'
import type { Match, MatchParticipant, Prediction, PredictionType, PredictionWithMatch } from '@/types'

const MATCH_SELECT = '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'

export interface SaveGoalPredictionInput {
  minute: number
  team: 'home' | 'away'
}

export interface SaveScorePredictionInput {
  homeScore: number
  awayScore: number
}

export interface MatchRankingEntry {
  user_id: string
  points: number
  verified: boolean
  profiles?: { username: string | null; avatar: string | null }
}

export const usePredictionStore = defineStore('prediction', () => {
  const saving = ref(false)

  async function fetchMyPredictions(matchId: string, userId: string): Promise<Prediction[]> {
    const { data, error: err } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (err) throw err
    return (data ?? []) as Prediction[]
  }

  function assertMatchOpen(match: Match): string | null {
    if (!isMatchOpenForPredictions(match)) {
      return 'Las predicciones cerraron: el partido ya inició o terminó'
    }
    return null
  }

  function validateGoalPrediction(
    match: Match,
    input: SaveGoalPredictionInput,
    existingGoals: Prediction[],
    editingId?: number,
  ): string | null {
    const closed = assertMatchOpen(match)
    if (closed) return closed

    if (!Number.isInteger(input.minute) || input.minute < 1 || input.minute > 120) {
      return 'El minuto debe ser entre 1 y 120'
    }

    if (!editingId && existingGoals.length >= MAX_GOAL_PREDICTIONS_PER_MATCH) {
      return `Máximo ${MAX_GOAL_PREDICTIONS_PER_MATCH} predicciones de gol por partido`
    }

    const duplicate = existingGoals.some(
      (p) =>
        p.id !== editingId &&
        p.predicted_minute === input.minute &&
        p.predicted_team === input.team,
    )
    if (duplicate) return 'Ya tienes esa predicción de gol'

    return null
  }

  function validateScorePrediction(
    match: Match,
    input: SaveScorePredictionInput,
    existingScores: Prediction[],
    editingId?: number,
  ): string | null {
    const closed = assertMatchOpen(match)
    if (closed) return closed

    if (
      !Number.isInteger(input.homeScore) ||
      !Number.isInteger(input.awayScore) ||
      input.homeScore < 0 ||
      input.homeScore > 20 ||
      input.awayScore < 0 ||
      input.awayScore > 20
    ) {
      return 'Cada marcador debe ser un entero entre 0 y 20'
    }

    if (!editingId && existingScores.length >= MAX_SCORE_PREDICTIONS_PER_MATCH) {
      return `Máximo ${MAX_SCORE_PREDICTIONS_PER_MATCH} predicciones de marcador por partido`
    }

    const duplicate = existingScores.some(
      (p) =>
        p.id !== editingId &&
        p.predicted_home_score === input.homeScore &&
        p.predicted_away_score === input.awayScore,
    )
    if (duplicate) return 'Ya tienes esa predicción de marcador'

    return null
  }

  async function saveGoalPrediction(
    match: Match,
    userId: string,
    input: SaveGoalPredictionInput,
    existingGoals: Prediction[],
  ): Promise<Prediction> {
    const validationError = validateGoalPrediction(match, input, existingGoals)
    if (validationError) throw new Error(validationError)

    saving.value = true
    try {
      const { data, error: err } = await supabase
        .from('predictions')
        .insert({
          user_id: userId,
          match_id: match.id,
          prediction_type: 'goal' satisfies PredictionType,
          predicted_minute: input.minute,
          predicted_team: input.team,
        })
        .select()
        .single()

      if (err) {
        if (err.code === '23505') throw new Error('Ya tienes esa predicción de gol')
        if (err.message?.includes('Máximo')) {
          throw new Error(`Máximo ${MAX_GOAL_PREDICTIONS_PER_MATCH} predicciones de gol por partido`)
        }
        throw err
      }

      return data as Prediction
    } finally {
      saving.value = false
    }
  }

  async function saveScorePrediction(
    match: Match,
    userId: string,
    input: SaveScorePredictionInput,
    existingScores: Prediction[],
  ): Promise<Prediction> {
    const validationError = validateScorePrediction(match, input, existingScores)
    if (validationError) throw new Error(validationError)

    saving.value = true
    try {
      const { data, error: err } = await supabase
        .from('predictions')
        .insert({
          user_id: userId,
          match_id: match.id,
          prediction_type: 'score' satisfies PredictionType,
          predicted_home_score: input.homeScore,
          predicted_away_score: input.awayScore,
        })
        .select()
        .single()

      if (err) {
        if (err.code === '23505') throw new Error('Ya tienes esa predicción de marcador')
        if (err.message?.includes('Máximo 2')) {
          throw new Error('Máximo 2 predicciones de marcador por partido')
        }
        throw err
      }

      return data as Prediction
    } finally {
      saving.value = false
    }
  }

  async function updateGoalPrediction(
    match: Match,
    predictionId: number,
    input: SaveGoalPredictionInput,
    existingGoals: Prediction[],
  ): Promise<Prediction> {
    const validationError = validateGoalPrediction(match, input, existingGoals, predictionId)
    if (validationError) throw new Error(validationError)

    saving.value = true
    try {
      const { data, error: err } = await supabase
        .from('predictions')
        .update({
          predicted_minute: input.minute,
          predicted_team: input.team,
        })
        .eq('id', predictionId)
        .select()
        .single()

      if (err) {
        if (err.code === '23505') throw new Error('Ya tienes esa predicción de gol')
        throw err
      }

      return data as Prediction
    } finally {
      saving.value = false
    }
  }

  async function updateScorePrediction(
    match: Match,
    predictionId: number,
    input: SaveScorePredictionInput,
    existingScores: Prediction[],
  ): Promise<Prediction> {
    const validationError = validateScorePrediction(match, input, existingScores, predictionId)
    if (validationError) throw new Error(validationError)

    saving.value = true
    try {
      const { data, error: err } = await supabase
        .from('predictions')
        .update({
          predicted_home_score: input.homeScore,
          predicted_away_score: input.awayScore,
        })
        .eq('id', predictionId)
        .select()
        .single()

      if (err) {
        if (err.code === '23505') throw new Error('Ya tienes esa predicción de marcador')
        throw err
      }

      return data as Prediction
    } finally {
      saving.value = false
    }
  }

  async function deletePrediction(match: Match, predictionId: number): Promise<void> {
    const closed = assertMatchOpen(match)
    if (closed) throw new Error(closed)

    saving.value = true
    try {
      const { error: err } = await supabase.from('predictions').delete().eq('id', predictionId)
      if (err) throw err
    } finally {
      saving.value = false
    }
  }

  async function fetchMatchRanking(
    matchId: string,
    options?: { verifiedOnly?: boolean },
  ): Promise<MatchRankingEntry[]> {
    const verifiedOnly = options?.verifiedOnly ?? true

    const [{ data: preds, error: err }, { data: payments }] = await Promise.all([
      supabase.from('predictions').select('*').eq('match_id', matchId),
      supabase.from('match_payments').select('user_id, verified').eq('match_id', matchId),
    ])

    if (err) throw err
    if (!preds?.length) return []

    const typedPreds = preds as Prediction[]
    const verifiedMap = new Map(
      (payments ?? []).map((p: { user_id: string; verified: boolean }) => [p.user_id, p.verified]),
    )
    const userIds = [...new Set(typedPreds.map((p) => p.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar')
      .in('id', userIds)

    type RankingProfile = { id: string; username: string | null; avatar: string | null }
    const profileMap = new Map<string, RankingProfile>(
      ((profiles ?? []) as RankingProfile[]).map((p) => [p.id, p]),
    )
    const totals = new Map<string, number>()

    for (const p of typedPreds) {
      totals.set(p.user_id, (totals.get(p.user_id) ?? 0) + totalPredictionPoints(p))
    }

    return [...totals.entries()]
      .map(([user_id, points]) => {
        const profile = profileMap.get(user_id)
        const verified = verifiedMap.get(user_id) ?? false
        return {
          user_id,
          points,
          verified,
          profiles: profile
            ? { username: profile.username, avatar: profile.avatar }
            : undefined,
        }
      })
      .filter((entry) => !verifiedOnly || entry.verified)
      .sort((a, b) => b.points - a.points)
      .slice(0, 20)
  }

  async function fetchParticipantCountsByMatch(): Promise<Record<string, number>> {
    const { data, error } = await supabase.from('predictions').select('match_id, user_id')
    if (error) throw error

    const byMatch = new Map<string, Set<string>>()
    for (const row of data ?? []) {
      const matchId = row.match_id as string
      const userId = row.user_id as string
      if (!byMatch.has(matchId)) byMatch.set(matchId, new Set())
      byMatch.get(matchId)!.add(userId)
    }

    return Object.fromEntries(
      [...byMatch.entries()].map(([matchId, users]) => [matchId, users.size]),
    )
  }

  async function fetchMatchParticipants(matchId: string): Promise<MatchParticipant[]> {
    const [{ data: preds, error: err }, { data: payments }] = await Promise.all([
      supabase.from('predictions').select('*').eq('match_id', matchId).order('created_at'),
      supabase.from('match_payments').select('user_id, verified').eq('match_id', matchId),
    ])

    if (err) throw err
    if (!preds?.length) return []

    const typedPreds = preds as Prediction[]
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
    const grouped = new Map<string, Prediction[]>()

    for (const pred of typedPreds) {
      const list = grouped.get(pred.user_id) ?? []
      list.push(pred)
      grouped.set(pred.user_id, list)
    }

    return [...grouped.entries()]
      .map(([user_id, predictions]) => {
        const profile = profileMap.get(user_id)
        const total_points = predictions.reduce((sum, p) => sum + totalPredictionPoints(p), 0)
        return {
          user_id,
          verified: verifiedMap.get(user_id) ?? false,
          profiles: profile
            ? { username: profile.username, avatar: profile.avatar }
            : undefined,
          predictions,
          total_points,
        }
      })
      .sort((a, b) => b.total_points - a.total_points)
  }

  async function setPaymentVerified(
    userId: string,
    matchId: string,
    verified: boolean,
  ): Promise<void> {
    const { error: err } = await supabase.rpc('admin_set_payment_verified', {
      p_user_id: userId,
      p_match_id: matchId,
      p_verified: verified,
    })
    if (err) throw err
  }

  async function fetchUserPredictions(userId: string): Promise<PredictionWithMatch[]> {
    const { data: preds, error: err } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (err) throw err
    if (!preds?.length) return []

    const typedPreds = preds as Prediction[]
    const matchIds = [...new Set(typedPreds.map((p) => p.match_id))]
    const { data: matches } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .in('id', matchIds)

    const matchMap = new Map(((matches ?? []) as Match[]).map((m) => [m.id, m]))
    return typedPreds.map((p) => ({
      ...p,
      match: matchMap.get(p.match_id) as Match | undefined,
    })) as PredictionWithMatch[]
  }

  return {
    saving,
    fetchMyPredictions,
    saveGoalPrediction,
    saveScorePrediction,
    updateGoalPrediction,
    updateScorePrediction,
    deletePrediction,
    fetchMatchRanking,
    fetchParticipantCountsByMatch,
    fetchMatchParticipants,
    setPaymentVerified,
    fetchUserPredictions,
  }
})
