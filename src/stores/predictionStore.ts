import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import {
  MAX_GOAL_PREDICTIONS_PER_MATCH,
  MAX_SCORE_PREDICTIONS_PER_MATCH,
} from '@/constants/quiniela-rules'
import { totalPredictionPoints } from '@/lib/predictionDisplay'
import { isMatchOpenForPredictions } from '@/lib/matchRules'
import type { Match, Prediction, PredictionType, PredictionWithMatch } from '@/types'

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
        if (err.message?.includes('Máximo 5')) throw new Error('Máximo 5 predicciones de gol por partido')
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

  async function fetchMatchRanking(matchId: string): Promise<MatchRankingEntry[]> {
    const { data: preds, error: err } = await supabase
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)

    if (err) throw err
    if (!preds?.length) return []

    const userIds = [...new Set(preds.map((p) => p.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar')
      .in('id', userIds)

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
    const totals = new Map<string, number>()

    for (const p of preds) {
      totals.set(p.user_id, (totals.get(p.user_id) ?? 0) + totalPredictionPoints(p as Prediction))
    }

    return [...totals.entries()]
      .map(([user_id, points]) => ({
        user_id,
        points,
        profiles: profileMap.get(user_id) ?? undefined,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 20)
  }

  async function fetchUserPredictions(userId: string): Promise<PredictionWithMatch[]> {
    const { data: preds, error: err } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (err) throw err
    if (!preds?.length) return []

    const matchIds = [...new Set(preds.map((p) => p.match_id))]
    const { data: matches } = await supabase
      .from('matches')
      .select(MATCH_SELECT)
      .in('id', matchIds)

    const matchMap = new Map((matches ?? []).map((m) => [m.id, m]))
    return preds.map((p) => ({
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
    fetchUserPredictions,
  }
})
