import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { BASE_QUINIELA_MATCHES_PER_ROUND } from '@/constants/base-quiniela-rules'
import {
  buildFirstKickoffByRoundId,
  resolveActiveBaseRound,
} from '@/lib/baseQuinielaRound'
import { compareBaseRoundRank } from '@/lib/baseQuinielaStats'
import { isMatchOpenForPredictions, teamsPendingReason } from '@/lib/matchRules'
import { supabase } from '@/lib/supabase'
import type {
  BasePrediction,
  BaseQuinielaEntrySummary,
  BaseQuinielaRound,
  BaseQuinielaRoundMatch,
  BaseRoundLeaderboardEntry,
  BaseRoundParticipant,
  BaseRoundPayment,
  BaseRoundResultSummary,
  Match,
  PredictedWinner,
} from '@/types'

const MATCH_SELECT = '*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)'

function buildEntrySummaries(
  predictions: BasePrediction[],
  payments: BaseRoundPayment[],
  matchCount: number,
): BaseQuinielaEntrySummary[] {
  const paymentByEntry = new Map(payments.map((p) => [p.entry_number, p]))
  const countByEntry = new Map<number, number>()

  for (const pred of predictions) {
    countByEntry.set(pred.entry_number, (countByEntry.get(pred.entry_number) ?? 0) + 1)
  }

  const entryNumbers = new Set<number>([
    ...paymentByEntry.keys(),
    ...countByEntry.keys(),
  ])

  if (!entryNumbers.size) {
    return [{ entry_number: 1, prediction_count: 0, is_submitted: false, verified: false }]
  }

  return [...entryNumbers]
    .sort((a, b) => a - b)
    .map((entry_number) => {
      const payment = paymentByEntry.get(entry_number)
      const prediction_count = countByEntry.get(entry_number) ?? 0
      return {
        entry_number,
        entry_name: payment?.entry_name ?? null,
        prediction_count,
        is_submitted: payment?.submitted_at != null,
        verified: payment?.verified ?? false,
      }
    })
}

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
  const myEntries = ref<BaseQuinielaEntrySummary[]>([{ entry_number: 1, prediction_count: 0, is_submitted: false, verified: false }])
  const currentEntryNumber = ref(1)
  const leaderboard = ref<BaseRoundLeaderboardEntry[]>([])
  const leaderboardRoundId = ref<string | null>(null)
  const loading = ref(false)
  const saving = ref(false)

  const canCreateNewEntry = computed(() => {
    const current = myEntries.value.find((e) => e.entry_number === currentEntryNumber.value)
    return current?.is_submitted === true
  })

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

  async function fetchMyPredictions(roundId: string, userId: string, entryNumber = currentEntryNumber.value) {
    const matchCount =
      currentRound.value?.id === roundId
        ? (currentRound.value.match_count ?? BASE_QUINIELA_MATCHES_PER_ROUND)
        : BASE_QUINIELA_MATCHES_PER_ROUND

    const [{ data: allPreds, error }, { data: payments, error: paymentErr }] = await Promise.all([
      supabase
        .from('base_predictions')
        .select('*')
        .eq('round_id', roundId)
        .eq('user_id', userId)
        .order('entry_number', { ascending: true }),
      supabase
        .from('base_round_payments')
        .select('*')
        .eq('round_id', roundId)
        .eq('user_id', userId)
        .order('entry_number', { ascending: true }),
    ])

    if (error) throw error
    if (paymentErr) throw paymentErr

    const typedPreds = (allPreds ?? []) as BasePrediction[]
    const typedPayments = (payments ?? []) as BaseRoundPayment[]

    myEntries.value = buildEntrySummaries(typedPreds, typedPayments, matchCount)
    currentEntryNumber.value = entryNumber

    myPredictions.value = typedPreds.filter((p) => p.entry_number === entryNumber)
    mySubmission.value =
      typedPayments.find((p) => p.entry_number === entryNumber) ?? null
  }

  function selectEntry(entryNumber: number) {
    currentEntryNumber.value = entryNumber
  }

  async function switchEntry(roundId: string, userId: string, entryNumber: number) {
    await fetchMyPredictions(roundId, userId, entryNumber)
  }

  function startNewEntry() {
    if (!canCreateNewEntry.value) {
      throw new Error('Guarda tu quiniela actual antes de crear otra')
    }

    const nextEntry =
      myEntries.value.reduce((max, entry) => Math.max(max, entry.entry_number), 0) + 1

    currentEntryNumber.value = nextEntry
    myPredictions.value = []
    mySubmission.value = null
    myEntries.value = [
      ...myEntries.value,
      {
        entry_number: nextEntry,
        entry_name: null,
        prediction_count: 0,
        is_submitted: false,
        verified: false,
      },
    ]
  }

  function isQuinielaSubmitted(): boolean {
    return mySubmission.value?.submitted_at != null
  }

  async function queryRoundLeaderboard(
    roundId: string,
    limit = 50,
  ): Promise<BaseRoundLeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('base_round_leaderboard')
      .select('*')
      .eq('round_id', roundId)
      .eq('is_complete', true)
      .order('correct_count', { ascending: false })
      .order('total_points', { ascending: false })
      .order('username', { ascending: true })
      .order('entry_number', { ascending: true })
      .limit(limit)

    if (error) throw error
    const rows = (data ?? []) as BaseRoundLeaderboardEntry[]
    return rows.sort(compareBaseRoundRank)
  }

  async function fetchRoundLeaderboard(roundId: string) {
    if (leaderboardRoundId.value !== roundId) {
      leaderboard.value = []
      leaderboardRoundId.value = roundId
    }
    leaderboard.value = await queryRoundLeaderboard(roundId)
  }

  async function fetchMyLeaderboardEntry(
    roundId: string,
    userId: string,
    entryNumber = currentEntryNumber.value,
  ): Promise<BaseRoundLeaderboardEntry | null> {
    const { data, error } = await supabase
      .from('base_round_leaderboard')
      .select('*')
      .eq('round_id', roundId)
      .eq('user_id', userId)
      .eq('entry_number', entryNumber)
      .maybeSingle()

    if (error) throw error
    return (data ?? null) as BaseRoundLeaderboardEntry | null
  }

  async function fetchAllRoundResults(userId?: string): Promise<BaseRoundResultSummary[]> {
    if (!rounds.value.length) {
      await fetchRounds()
    }

    const summaries = await Promise.all(
      rounds.value.map(async (round) => {
        const [topThree, myEntry, participantCount] = await Promise.all([
          queryRoundLeaderboard(round.id, 3),
          userId ? fetchMyLeaderboardEntry(round.id, userId) : Promise.resolve(null),
          fetchRoundParticipantCount(round.id),
        ])

        return {
          round,
          winner: topThree[0] ?? null,
          topThree,
          myEntry,
          isActive: activeRound.value?.id === round.id,
          participantCount,
        }
      }),
    )

    return summaries.sort((a, b) => b.round.round_number - a.round.round_number)
  }

  async function fetchRoundParticipantCount(roundId: string): Promise<number> {
    const { count, error } = await supabase
      .from('base_round_leaderboard')
      .select('*', { count: 'exact', head: true })
      .eq('round_id', roundId)
      .eq('is_complete', true)

    if (error) throw error
    return count ?? 0
  }

  async function refreshLeaderboardForMatch(matchId: string) {
    const { data, error } = await supabase
      .from('base_quiniela_round_matches')
      .select('round_id')
      .eq('match_id', matchId)

    if (error || !data?.length) return

    const roundIds = [...new Set(data.map((row) => row.round_id as string))]
    for (const roundId of roundIds) {
      if (currentRound.value?.id === roundId || activeRound.value?.id === roundId) {
        await fetchRoundLeaderboard(roundId)
      }
    }
  }

  function patchRoundMatch(match: Match) {
    const idx = roundMatches.value.findIndex((rm) => rm.match_id === match.id)
    if (idx < 0 || !roundMatches.value[idx]?.match) return

    roundMatches.value[idx] = {
      ...roundMatches.value[idx],
      match: { ...roundMatches.value[idx].match!, ...match },
    }
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
    entryNumber = currentEntryNumber.value,
  ): Promise<BasePrediction> {
    if (isQuinielaSubmitted()) {
      throw new Error('Tu quiniela ya está guardada. No puedes cambiar tus picks.')
    }

    if (!isMatchOpenForPredictions(match)) {
      const pending = teamsPendingReason(match)
      throw new Error(
        pending ?? 'Las predicciones cerraron: el partido ya inició o terminó',
      )
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
          entry_number: entryNumber,
          match_id: match.id,
          predicted_winner: winner,
        })
        .select()
        .single()

      if (error) throw error
      const created = data as BasePrediction
      myPredictions.value.push(created)

      const entryIdx = myEntries.value.findIndex((e) => e.entry_number === entryNumber)
      if (entryIdx >= 0) {
        myEntries.value[entryIdx] = {
          ...myEntries.value[entryIdx]!,
          prediction_count: myPredictions.value.length,
        }
      }

      return created
    } finally {
      saving.value = false
    }
  }

  async function updateEntryName(
    roundId: string,
    entryNumber: number,
    name: string,
  ): Promise<void> {
    saving.value = true
    try {
      const { error } = await supabase.rpc('update_base_entry_name', {
        p_round_id: roundId,
        p_entry_number: entryNumber,
        p_entry_name: name,
      })
      if (error) throw error

      const trimmed = name.trim()
      const entryIdx = myEntries.value.findIndex((e) => e.entry_number === entryNumber)
      if (entryIdx >= 0) {
        myEntries.value[entryIdx] = {
          ...myEntries.value[entryIdx]!,
          entry_name: trimmed || null,
        }
      }
      if (mySubmission.value?.entry_number === entryNumber) {
        mySubmission.value = {
          ...mySubmission.value,
          entry_name: trimmed || null,
        }
      }
    } finally {
      saving.value = false
    }
  }

  async function submitQuiniela(
    roundId: string,
    userId: string,
    entryNumber = currentEntryNumber.value,
  ): Promise<void> {
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
        p_entry_number: entryNumber,
      })
      if (error) throw error

      const { data: payment, error: paymentErr } = await supabase
        .from('base_round_payments')
        .select('*')
        .eq('round_id', roundId)
        .eq('user_id', userId)
        .eq('entry_number', entryNumber)
        .maybeSingle()

      if (paymentErr) throw paymentErr
      mySubmission.value = (payment ?? null) as BaseRoundPayment | null

      const entryIdx = myEntries.value.findIndex((e) => e.entry_number === entryNumber)
      if (entryIdx >= 0) {
        myEntries.value[entryIdx] = {
          ...myEntries.value[entryIdx]!,
          is_submitted: true,
          prediction_count: filled,
        }
      }
    } finally {
      saving.value = false
    }
  }

  async function fetchParticipantCountsByRound(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('base_predictions')
      .select('round_id, user_id, entry_number')

    if (error) throw error

    const byRound = new Map<string, Set<string>>()
    for (const row of data ?? []) {
      const roundId = row.round_id as string
      const key = `${row.user_id}:${row.entry_number}`
      if (!byRound.has(roundId)) byRound.set(roundId, new Set())
      byRound.get(roundId)!.add(key)
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
      supabase.from('base_round_payments').select('user_id, entry_number, verified, entry_name').eq('round_id', roundId),
    ])

    if (predsErr) throw predsErr
    if (!preds?.length) return []

    const typedPreds = preds as BasePrediction[]
    const verifiedMap = new Map<
      string,
      { verified: boolean; entry_name: string | null }
    >(
      (payments ?? []).map(
        (p: {
          user_id: string
          entry_number: number
          verified: boolean
          entry_name?: string | null
        }) => [
          `${p.user_id}:${p.entry_number}`,
          { verified: p.verified, entry_name: p.entry_name ?? null },
        ],
      ),
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
      const key = `${pred.user_id}:${pred.entry_number}`
      const list = grouped.get(key) ?? []
      list.push(pred)
      grouped.set(key, list)
    }

    return [...grouped.entries()]
      .map(([key, predictions]) => {
        const [user_id, entryNumberRaw] = key.split(':')
        const entry_number = Number(entryNumberRaw)
        const profile = profileMap.get(user_id!)
        const complete = predictions.length >= matchCount
        const total_points = predictions.reduce((sum, p) => sum + (p.points ?? 0), 0)
        const correct_count = predictions.filter((p) => p.points > 0).length
        const paymentMeta = verifiedMap.get(key)
        return {
          user_id: user_id!,
          entry_number,
          entry_name: paymentMeta?.entry_name ?? null,
          verified: paymentMeta?.verified ?? false,
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
    entryNumber: number,
  ): Promise<void> {
    const { error } = await supabase.rpc('admin_set_base_payment_verified', {
      p_user_id: userId,
      p_round_id: roundId,
      p_verified: verified,
      p_entry_number: entryNumber,
    })
    if (error) throw error
  }

  async function resetPlayerQuiniela(
    userId: string,
    roundId: string,
    entryNumber: number,
  ): Promise<void> {
    const { error } = await supabase.rpc('admin_reset_base_quiniela', {
      p_user_id: userId,
      p_round_id: roundId,
      p_entry_number: entryNumber,
    })
    if (error) throw error
  }

  async function fetchRoundParticipationStatus(
    roundId: string,
    userId: string,
    entryNumber = currentEntryNumber.value,
  ): Promise<{ predictionCount: number; isSubmitted: boolean }> {
    const [{ count, error: countErr }, { data: payment, error: paymentErr }] =
      await Promise.all([
        supabase
          .from('base_predictions')
          .select('*', { count: 'exact', head: true })
          .eq('round_id', roundId)
          .eq('user_id', userId)
          .eq('entry_number', entryNumber),
        supabase
          .from('base_round_payments')
          .select('submitted_at')
          .eq('round_id', roundId)
          .eq('user_id', userId)
          .eq('entry_number', entryNumber)
          .maybeSingle(),
      ])

    if (countErr) throw countErr
    if (paymentErr) throw paymentErr

    return {
      predictionCount: count ?? 0,
      isSubmitted: payment?.submitted_at != null,
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
    roundFirstKickoff,
    activeRound,
    currentRound,
    roundMatches,
    myPredictions,
    mySubmission,
    myEntries,
    currentEntryNumber,
    canCreateNewEntry,
    leaderboard,
    leaderboardRoundId,
    loading,
    saving,
    fetchRounds,
    fetchRound,
    fetchMyPredictions,
    selectEntry,
    switchEntry,
    startNewEntry,
    updateEntryName,
    fetchRoundLeaderboard,
    queryRoundLeaderboard,
    fetchAllRoundResults,
    fetchMyLeaderboardEntry,
    fetchRoundParticipantCount,
    refreshLeaderboardForMatch,
    patchRoundMatch,
    fetchUserHistory,
    fetchRoundParticipationStatus,
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
