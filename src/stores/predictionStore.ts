import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import {
  MAX_GOAL_PREDICTIONS_PER_MATCH,
  MAX_SCORE_PREDICTIONS_PER_MATCH,
} from '@/constants/quiniela-rules'
import { isValidGoalMinutePrediction } from '@/lib/predictionMinutes'
import { hasCompletePredictions, totalPredictionPoints } from '@/lib/predictionDisplay'
import { isMatchOpenForPredictions, teamsPendingReason } from '@/lib/matchRules'
import type {
  Match,
  MatchParticipant,
  PredictedWinner,
  Prediction,
  PredictionType,
  PredictionWithMatch,
} from '@/types'

const MATCH_SELECT = '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'

export interface SaveGoalPredictionInput {
  minute: number
}

export interface SaveWinnerPredictionInput {
  winner: PredictedWinner
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
    const pending = teamsPendingReason(match)
    if (pending) return pending
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

    if (!Number.isInteger(input.minute) || !isValidGoalMinutePrediction(input.minute)) {
      return 'Elige un minuto en la grilla o marca "No habrá goles"'
    }

    if (!editingId && existingGoals.length >= MAX_GOAL_PREDICTIONS_PER_MATCH) {
      return `Máximo ${MAX_GOAL_PREDICTIONS_PER_MATCH} predicción de minuto del primer gol por partido`
    }

    const duplicate = existingGoals.some(
      (p) => p.id !== editingId && p.predicted_minute === input.minute,
    )
    if (duplicate) return 'Ya tienes esa predicción de minuto'

    return null
  }

  function validateWinnerPrediction(
    match: Match,
    input: SaveWinnerPredictionInput,
    existingScores: Prediction[],
    editingId?: number,
  ): string | null {
    const closed = assertMatchOpen(match)
    if (closed) return closed

    if (!['home', 'draw', 'away'].includes(input.winner)) {
      return 'Elige L (local), E (empate) o V (visita)'
    }

    if (!editingId && existingScores.length >= MAX_SCORE_PREDICTIONS_PER_MATCH) {
      return `Máximo ${MAX_SCORE_PREDICTIONS_PER_MATCH} predicción de ganador por partido`
    }

    const duplicate = existingScores.some(
      (p) => p.id !== editingId && p.predicted_winner === input.winner,
    )
    if (duplicate) return 'Ya tienes esa predicción de ganador'

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
        })
        .select()
        .single()

      if (err) {
        if (err.code === '23505') throw new Error('Ya tienes una predicción de minuto para este partido')
        if (err.message?.includes('Máximo')) {
          throw new Error('Máximo 1 predicción de minuto del primer gol por partido')
        }
        throw err
      }

      return data as Prediction
    } finally {
      saving.value = false
    }
  }

  async function saveWinnerPrediction(
    match: Match,
    userId: string,
    input: SaveWinnerPredictionInput,
    existingScores: Prediction[],
  ): Promise<Prediction> {
    const validationError = validateWinnerPrediction(match, input, existingScores)
    if (validationError) throw new Error(validationError)

    saving.value = true
    try {
      const { data, error: err } = await supabase
        .from('predictions')
        .insert({
          user_id: userId,
          match_id: match.id,
          prediction_type: 'score' satisfies PredictionType,
          predicted_winner: input.winner,
        })
        .select()
        .single()

      if (err) {
        if (err.code === '23505') throw new Error('Ya tienes una predicción de ganador para este partido')
        if (err.message?.includes('Máximo')) {
          throw new Error('Máximo 1 predicción de ganador por partido')
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
        })
        .eq('id', predictionId)
        .select()
        .single()

      if (err) {
        if (err.code === '23505') throw new Error('Ya tienes esa predicción de minuto')
        throw err
      }

      return data as Prediction
    } finally {
      saving.value = false
    }
  }

  async function updateWinnerPrediction(
    match: Match,
    predictionId: number,
    input: SaveWinnerPredictionInput,
    existingScores: Prediction[],
  ): Promise<Prediction> {
    const validationError = validateWinnerPrediction(match, input, existingScores, predictionId)
    if (validationError) throw new Error(validationError)

    saving.value = true
    try {
      const { data, error: err } = await supabase
        .from('predictions')
        .update({
          predicted_winner: input.winner,
        })
        .eq('id', predictionId)
        .select()
        .single()

      if (err) {
        if (err.code === '23505') throw new Error('Ya tienes esa predicción de ganador')
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
    const grouped = new Map<string, Prediction[]>()
    for (const p of typedPreds) {
      const list = grouped.get(p.user_id) ?? []
      list.push(p)
      grouped.set(p.user_id, list)
    }

    const totals = new Map<string, number>()
    for (const [user_id, userPreds] of grouped) {
      if (!hasCompletePredictions(userPreds)) continue
      totals.set(
        user_id,
        userPreds.reduce((sum, p) => sum + totalPredictionPoints(p), 0),
      )
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
    const { data, error } = await supabase
      .from('predictions')
      .select('match_id, user_id, prediction_type')
    if (error) throw error

    const byMatch = new Map<string, Map<string, { goal: boolean; score: boolean }>>()
    for (const row of data ?? []) {
      const matchId = row.match_id as string
      const userId = row.user_id as string
      const type = row.prediction_type as string | null
      if (!byMatch.has(matchId)) byMatch.set(matchId, new Map())
      const users = byMatch.get(matchId)!
      if (!users.has(userId)) users.set(userId, { goal: false, score: false })
      const flags = users.get(userId)!
      if (type === 'goal' || type == null) flags.goal = true
      if (type === 'score') flags.score = true
    }

    return Object.fromEntries(
      [...byMatch.entries()].map(([matchId, users]) => [
        matchId,
        [...users.values()].filter((flags) => flags.goal && flags.score).length,
      ]),
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
        const complete = hasCompletePredictions(predictions)
        const total_points = complete
          ? predictions.reduce((sum, p) => sum + totalPredictionPoints(p), 0)
          : 0
        return {
          user_id,
          verified: verifiedMap.get(user_id) ?? false,
          profiles: profile
            ? { username: profile.username, avatar: profile.avatar }
            : undefined,
          predictions,
          total_points,
          complete,
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
    saveWinnerPrediction,
    updateGoalPrediction,
    updateWinnerPrediction,
    deletePrediction,
    fetchMatchRanking,
    fetchParticipantCountsByMatch,
    fetchMatchParticipants,
    setPaymentVerified,
    fetchUserPredictions,
    // Alias para compatibilidad si algo aún los usa
    saveScorePrediction: saveWinnerPrediction,
    updateScorePrediction: updateWinnerPrediction,
  }
})
