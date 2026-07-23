import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { HIDDEN_COMPETITION_SLUGS } from '@/constants/branding'
import {
  CARD_MINUTE_BUCKETS,
  LIGA_MX_CLUBS,
  TOTAL_JORNADAS,
} from '@/constants/tablas'
import { teamNameFromCode } from '@/lib/teamDisplay'
import { supabase } from '@/lib/supabase'
import { buildStandings, type StandingsMatchSource, type StandingsTeamInfo } from '@/lib/standings'
import type {
  CardJornadaBucket,
  CardMinuteBucket,
  CardTotals,
  CompetitionOption,
  FairPlayClubRow,
  MenoresStandingRow,
  ScorerRow,
  StandingRow,
} from '@/types/tablas'

type CardEventRow = {
  teamCode: string
  cardType: string
  minute: number
  extraTime: number
  jornada: number | null
}

type GoalEventRow = {
  teamCode: string
  teamName: string
  playerName: string
}

type MatchStandingSource = {
  id: string
  status: string
  current_minute: number | null
  home_score: number
  away_score: number
  home_team_id: string
  away_team_id: string
}

function minuteBucketLabel(minute: number, extraTime: number): string {
  if (minute > 90 || (minute === 90 && extraTime > 0)) return '>90'
  const index = Math.min(Math.ceil(Math.max(minute, 1) / 15), 6)
  return CARD_MINUTE_BUCKETS[index - 1] ?? '>90'
}

function clubName(code: string, fallback?: string): string {
  return teamNameFromCode(code) ?? fallback ?? code
}

function emptyStandings(): StandingRow[] {
  return LIGA_MX_CLUBS.map((club, index) => ({
    position: index + 1,
    teamCode: club.code,
    teamName: club.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  }))
}

function emptyMinuteBuckets(): CardMinuteBucket[] {
  return CARD_MINUTE_BUCKETS.map((label) => ({
    label,
    yellow: 0,
    red: 0,
  }))
}

function emptyJornadaBuckets(): CardJornadaBucket[] {
  return Array.from({ length: TOTAL_JORNADAS }, (_, index) => ({
    jornada: index + 1,
    yellow: 0,
    red: 0,
    fouls: 0,
  }))
}

const LIGA_MX_PARTICIPANTS = LIGA_MX_CLUBS.map((club) => ({ code: club.code, name: club.name }))

export const useTablasStore = defineStore('tablas', () => {
  const loading = ref(false)
  const selectedJornada = ref<number | 'torneo'>('torneo')
  const selectedClubCode = ref<string | 'all'>('all')

  const standings = ref<StandingRow[]>(emptyStandings())
  const menoresStandings = ref<MenoresStandingRow[]>([])
  const menoresRequiredMinutes = ref<number | null>(1170)
  const menoresSyncedAt = ref<string | null>(null)

  const competitions = ref<CompetitionOption[]>([])
  const activeCompetitionId = ref<string | null>(null)
  const selectedCompetitionId = ref<string | null>(null)

  const rawCardEvents = ref<CardEventRow[]>([])
  const rawGoalEvents = ref<GoalEventRow[]>([])
  const rawMatchesMeta = ref<{ jornada: number | null; minutesPlayed: number }[]>([])
  const foulsByJornada = ref<Map<number, number>>(new Map())

  const fairPlayTable = computed<FairPlayClubRow[]>(() => {
    const byTeam = new Map<string, { yellow: number; red: number }>()
    for (const club of LIGA_MX_CLUBS) byTeam.set(club.code, { yellow: 0, red: 0 })

    for (const event of rawCardEvents.value) {
      const bucket = byTeam.get(event.teamCode)
      if (!bucket) continue
      if (event.cardType === 'yellow' || event.cardType === 'second_yellow') bucket.yellow += 1
      if (event.cardType === 'red' || event.cardType === 'second_yellow') bucket.red += 1
    }

    return LIGA_MX_CLUBS.map((club) => {
      const { yellow, red } = byTeam.get(club.code) ?? { yellow: 0, red: 0 }
      return {
        teamCode: club.code,
        teamName: club.name,
        yellow,
        red,
        points: yellow + red * 3,
      }
    })
      .sort((a, b) => a.points - b.points || a.teamName.localeCompare(b.teamName))
      .map((row, index) => ({ ...row, position: index + 1 }))
  })

  const scorers = computed<ScorerRow[]>(() => {
    const byPlayer = new Map<string, { teamCode: string; teamName: string; goals: number }>()
    for (const goal of rawGoalEvents.value) {
      const key = `${goal.playerName}__${goal.teamCode}`
      const entry = byPlayer.get(key)
      if (entry) entry.goals += 1
      else byPlayer.set(key, { teamCode: goal.teamCode, teamName: goal.teamName, goals: 1 })
    }

    return Array.from(byPlayer.entries())
      .map(([key, entry]) => ({ playerName: key.split('__')[0]!, ...entry }))
      .sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName))
      .slice(0, 10)
      .map((row, index) => ({ ...row, position: index + 1 }))
  })

  const filteredCardEvents = computed(() =>
    selectedJornada.value === 'torneo'
      ? rawCardEvents.value
      : rawCardEvents.value.filter((event) => event.jornada === selectedJornada.value),
  )

  const relevantMatchesMeta = computed(() =>
    selectedJornada.value === 'torneo'
      ? rawMatchesMeta.value
      : rawMatchesMeta.value.filter((match) => match.jornada === selectedJornada.value),
  )

  const cardTotals = computed<CardTotals>(() => {
    let yellow = 0
    let red = 0
    for (const event of filteredCardEvents.value) {
      if (event.cardType === 'yellow' || event.cardType === 'second_yellow') yellow += 1
      if (event.cardType === 'red' || event.cardType === 'second_yellow') red += 1
    }
    const fouls =
      selectedJornada.value === 'torneo'
        ? Array.from(foulsByJornada.value.values()).reduce((sum, n) => sum + n, 0)
        : (foulsByJornada.value.get(selectedJornada.value) ?? 0)
    return { yellow, red, fouls }
  })

  const minuteBuckets = computed<CardMinuteBucket[]>(() => {
    const buckets = emptyMinuteBuckets()
    const byLabel = new Map(buckets.map((bucket) => [bucket.label, bucket]))
    for (const event of filteredCardEvents.value) {
      const label = minuteBucketLabel(event.minute, event.extraTime)
      const bucket = byLabel.get(label)
      if (!bucket) continue
      if (event.cardType === 'yellow' || event.cardType === 'second_yellow') bucket.yellow += 1
      if (event.cardType === 'red' || event.cardType === 'second_yellow') bucket.red += 1
    }
    return buckets
  })

  const jornadaBuckets = computed<CardJornadaBucket[]>(() => {
    const buckets = emptyJornadaBuckets()
    const byJornada = new Map(buckets.map((bucket) => [bucket.jornada, bucket]))
    for (const event of rawCardEvents.value) {
      if (event.jornada === null) continue
      const bucket = byJornada.get(event.jornada)
      if (!bucket) continue
      if (event.cardType === 'yellow' || event.cardType === 'second_yellow') bucket.yellow += 1
      if (event.cardType === 'red' || event.cardType === 'second_yellow') bucket.red += 1
    }
    for (const bucket of buckets) {
      bucket.fouls = foulsByJornada.value.get(bucket.jornada) ?? 0
    }
    return buckets
  })

  const playerCards = computed(() => {
    let yellow = 0
    let red = 0
    for (const event of rawCardEvents.value) {
      if (event.cardType === 'yellow' || event.cardType === 'second_yellow') yellow += 1
      if (event.cardType === 'red' || event.cardType === 'second_yellow') red += 1
    }
    return { yellow, red }
  })

  const staffCards = ref({ yellow: 0, red: 0 })

  const jornadaOptions = computed(() => [
    { value: 'torneo' as const, label: 'Torneo' },
    ...Array.from({ length: TOTAL_JORNADAS }, (_, i) => ({
      value: (i + 1) as number,
      label: `J-${i + 1}`,
    })),
  ])

  const clubOptions = computed(() => [
    { value: 'all' as const, label: 'Todos los Clubes' },
    ...LIGA_MX_CLUBS.map((club) => ({
      value: club.code,
      label: club.name,
    })),
  ])

  const selectedJornadaLabel = computed(() => {
    if (selectedJornada.value === 'torneo') return 'Torneo'
    return `Jornada ${selectedJornada.value}`
  })

  const cardsPerMatch = computed(() => {
    const played = relevantMatchesMeta.value.length
    return {
      yellow: played ? Number((cardTotals.value.yellow / played).toFixed(1)) : 0,
      red: played ? Number((cardTotals.value.red / played).toFixed(1)) : 0,
    }
  })

  const cardFrequencyMinutes = computed(() => {
    const totalMinutes = relevantMatchesMeta.value.reduce((sum, m) => sum + m.minutesPlayed, 0)
    return {
      yellow: cardTotals.value.yellow ? Math.round(totalMinutes / cardTotals.value.yellow) : 0,
      red: cardTotals.value.red ? Math.round(totalMinutes / cardTotals.value.red) : 0,
    }
  })

  let teamMapPromise: Promise<Map<string, StandingsTeamInfo>> | null = null

  function ensureTeamMap(): Promise<Map<string, StandingsTeamInfo>> {
    if (!teamMapPromise) {
      teamMapPromise = (async () => {
        const { data } = await supabase.from('teams').select('id, code, name')
        return new Map(
          (data ?? []).map((t) => [t.id, { code: t.code, name: clubName(t.code, t.name) }]),
        )
      })()
    }
    return teamMapPromise
  }

  /** Tabla general de cualquier competencia (pasada o activa), no sólo la que está en curso. */
  async function loadStandingsForCompetition(
    competitionId: string,
    teamMapOverride?: Map<string, StandingsTeamInfo>,
  ): Promise<StandingRow[]> {
    const teamMap = teamMapOverride ?? (await ensureTeamMap())
    const { data: matches } = await supabase
      .from('matches')
      .select('id, status, home_score, away_score, home_team_id, away_team_id')
      .eq('competition_id', competitionId)
    const matchList = (matches ?? []) as StandingsMatchSource[]
    const participants = competitionId === activeCompetitionId.value ? LIGA_MX_PARTICIPANTS : undefined
    return buildStandings(matchList, teamMap, participants)
  }

  /** Carga todas las competencias (no sólo la activa) para el selector de torneo. */
  async function fetchAllCompetitions(): Promise<void> {
    const { data } = await supabase
      .from('competitions')
      .select(
        'id, slug, name, season, is_active, menores_required_minutes, menores_synced_at, menores_footnote',
      )
      .order('created_at', { ascending: true })

    const rows = (data ?? []).filter((row) => !HIDDEN_COMPETITION_SLUGS.includes(row.slug))
    competitions.value = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      season: row.season,
      isActive: row.is_active,
    }))

    const active = rows.find((row) => row.is_active) ?? null
    activeCompetitionId.value = active?.id ?? null
    if (active) {
      menoresRequiredMinutes.value = active.menores_required_minutes ?? 1170
      menoresSyncedAt.value = active.menores_synced_at ?? null
    }
    if (!selectedCompetitionId.value) selectedCompetitionId.value = activeCompetitionId.value
  }

  /** Cambia la competencia mostrada en Tabla General sin tocar goleo/menores/fair play. */
  async function selectCompetition(competitionId: string): Promise<void> {
    if (selectedCompetitionId.value === competitionId) return
    selectedCompetitionId.value = competitionId
    loading.value = true
    try {
      standings.value = await loadStandingsForCompetition(competitionId)
    } finally {
      loading.value = false
    }
  }

  async function fetchTablas() {
    loading.value = true
    try {
      await fetchAllCompetitions()
      const competitionId = activeCompetitionId.value

      if (!competitionId) {
        standings.value = emptyStandings()
        menoresStandings.value = []
        foulsByJornada.value = new Map()
        return
      }

      const [teamMap, { data: matches }, { data: menoresRows }, { data: faltasRows }] =
        await Promise.all([
          ensureTeamMap(),
          supabase
            .from('matches')
            .select(
              'id, status, current_minute, home_score, away_score, home_team_id, away_team_id',
            )
            .eq('competition_id', competitionId),
          supabase
            .from('menores_standings')
            .select('*')
            .eq('competition_id', competitionId)
            .order('position', { ascending: true }),
          supabase
            .from('faltas_jornada')
            .select('jornada, fouls')
            .eq('competition_id', competitionId),
        ])

      foulsByJornada.value = new Map(
        (faltasRows ?? []).map((row) => [row.jornada, row.fouls]),
      )

      const matchList = (matches ?? []) as MatchStandingSource[]
      const matchIds = matchList.map((m) => m.id)

      standings.value =
        selectedCompetitionId.value === competitionId
          ? buildStandings(matchList, teamMap, LIGA_MX_PARTICIPANTS)
          : await loadStandingsForCompetition(selectedCompetitionId.value ?? competitionId, teamMap)
      menoresStandings.value = (menoresRows ?? []).map((row) => ({
        position: row.position,
        teamCode: row.team_code,
        teamName: row.team_name,
        playersAccumulated: row.players_accumulated,
        minutesAccumulated: row.minutes_accumulated,
        minutesToRegulation: row.minutes_to_regulation,
        minutesRemaining: row.minutes_remaining,
        fulfilled: row.fulfilled,
        minutes2003: row.minutes_2003,
        minutes2004: row.minutes_2004,
        minutes2005: row.minutes_2005,
        minutes2006Plus: row.minutes_2006_plus,
      }))

      const jornadaByMatch = new Map<string, number>()
      if (matchIds.length) {
        const { data: roundMatches } = await supabase
          .from('base_quiniela_round_matches')
          .select('match_id, base_quiniela_rounds!inner(round_number, competition_id)')
          .eq('base_quiniela_rounds.competition_id', competitionId)

        for (const row of roundMatches ?? []) {
          const round = row.base_quiniela_rounds as unknown as { round_number: number } | null
          if (round) jornadaByMatch.set(row.match_id, round.round_number)
        }
      }

      rawMatchesMeta.value = matchList
        .filter((m) => m.status === 'finished' || m.status === 'live')
        .map((m) => ({
          jornada: jornadaByMatch.get(m.id) ?? null,
          minutesPlayed: m.status === 'finished' ? 90 : (m.current_minute ?? 0),
        }))

      if (!matchIds.length) {
        rawCardEvents.value = []
        rawGoalEvents.value = []
        return
      }

      // Paginar eventos: PostgREST limita por defecto a 1000 filas.
      const cardEvents: CardEventRow[] = []
      const goalEvents: GoalEventRow[] = []
      const pageSize = 1000
      for (let from = 0; ; from += pageSize) {
        const { data: events, error: eventsError } = await supabase
          .from('match_events')
          .select('match_id, team_id, event_type, minute, extra_time, metadata')
          .in('match_id', matchIds)
          .in('event_type', ['goal', 'card'])
          .range(from, from + pageSize - 1)

        if (eventsError) break
        const page = events ?? []
        for (const event of page) {
          const team = event.team_id ? teamMap.get(event.team_id) : undefined
          if (!team) continue
          const metadata = (event.metadata ?? {}) as Record<string, unknown>

          if (event.event_type === 'card') {
            cardEvents.push({
              teamCode: team.code,
              cardType: typeof metadata.card_type === 'string' ? metadata.card_type : 'yellow',
              minute: event.minute,
              extraTime: event.extra_time ?? 0,
              jornada: jornadaByMatch.get(event.match_id) ?? null,
            })
          } else if (event.event_type === 'goal') {
            goalEvents.push({
              teamCode: team.code,
              teamName: team.name,
              playerName:
                typeof metadata.player === 'string' && metadata.player
                  ? metadata.player
                  : 'Autogol',
            })
          }
        }
        if (page.length < pageSize) break
      }

      rawCardEvents.value = cardEvents
      rawGoalEvents.value = goalEvents
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    selectedJornada,
    selectedClubCode,
    standings,
    scorers,
    menoresStandings,
    menoresRequiredMinutes,
    menoresSyncedAt,
    competitions,
    activeCompetitionId,
    selectedCompetitionId,
    fairPlayTable,
    minuteBuckets,
    jornadaBuckets,
    cardTotals,
    playerCards,
    staffCards,
    jornadaOptions,
    clubOptions,
    selectedJornadaLabel,
    cardsPerMatch,
    cardFrequencyMinutes,
    fetchTablas,
    selectCompetition,
  }
})
