import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ACTIVE_COMPETITION_SLUG } from '@/constants/branding'
import {
  CARD_MINUTE_BUCKETS,
  LIGA_MX_CLUBS,
  TOTAL_JORNADAS,
} from '@/constants/tablas'
import { supabase } from '@/lib/supabase'
import type {
  CardJornadaBucket,
  CardMinuteBucket,
  CardTotals,
  FairPlayClubRow,
  ScorerRow,
  StandingRow,
  TournamentHighlight,
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

function minuteBucketLabel(minute: number, extraTime: number): string {
  if (minute > 90 || (minute === 90 && extraTime > 0)) return '>90'
  const index = Math.min(Math.ceil(Math.max(minute, 1) / 15), 6)
  return CARD_MINUTE_BUCKETS[index - 1] ?? '>90'
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

export const useTablasStore = defineStore('tablas', () => {
  const loading = ref(false)
  const selectedJornada = ref<number | 'torneo'>('torneo')
  const selectedClubCode = ref<string | 'all'>('all')

  const standings = ref<StandingRow[]>(emptyStandings())
  const menoresStandings = ref<StandingRow[]>(emptyStandings())

  const rawCardEvents = ref<CardEventRow[]>([])
  const rawGoalEvents = ref<GoalEventRow[]>([])
  const rawMatchesMeta = ref<{ jornada: number | null; minutesPlayed: number }[]>([])

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
    return { yellow, red, fouls: 0 }
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

  const highlights = computed<TournamentHighlight[]>(() => [
    {
      title: 'Lo Mejor del Torneo',
      subtitle: 'Goleador',
      value: 0,
      unit: 'Goles',
      secondaryLabel: 'Anota Cada',
      secondaryValue: 0,
      secondaryUnit: 'Minutos',
      entityName: 'Por definir',
      entityKind: 'player',
      teamCode: null,
    },
    {
      title: 'Ofensiva',
      subtitle: 'Goles a Favor',
      value: 0,
      unit: 'Goles',
      entityName: 'Por definir',
      entityKind: 'club',
      teamCode: null,
    },
    {
      title: 'Defensiva',
      subtitle: 'Goles en Contra',
      value: 0,
      unit: 'Goles',
      entityName: 'Por definir',
      entityKind: 'club',
      teamCode: null,
    },
    {
      title: 'Fair play',
      subtitle: 'Disciplina',
      value: 0,
      unit: 'Amarillas',
      secondaryLabel: 'Rojas',
      secondaryValue: 0,
      secondaryUnit: 'Tarjetas',
      entityName: 'Torneo',
      entityKind: 'generic',
      teamCode: null,
    },
  ])

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

  async function fetchTablas() {
    loading.value = true
    try {
      const { data: competition, error: competitionError } = await supabase
        .from('competitions')
        .select('id')
        .eq('slug', ACTIVE_COMPETITION_SLUG)
        .eq('is_active', true)
        .single()

      if (competitionError || !competition) return
      const competitionId = competition.id

      const [{ data: teams }, { data: matches }] = await Promise.all([
        supabase.from('teams').select('id, code, name'),
        supabase
          .from('matches')
          .select('id, status, current_minute')
          .eq('competition_id', competitionId),
      ])

      const teamMap = new Map((teams ?? []).map((t) => [t.id, { code: t.code, name: t.name }]))
      const matchList = matches ?? []
      const matchIds = matchList.map((m) => m.id)

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

      const { data: events } = await supabase
        .from('match_events')
        .select('match_id, team_id, event_type, minute, extra_time, metadata')
        .in('match_id', matchIds)
        .in('event_type', ['goal', 'card'])

      const cardEvents: CardEventRow[] = []
      const goalEvents: GoalEventRow[] = []

      for (const event of events ?? []) {
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
            playerName: typeof metadata.player === 'string' && metadata.player ? metadata.player : 'Autogol',
          })
        }
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
    fairPlayTable,
    minuteBuckets,
    jornadaBuckets,
    cardTotals,
    playerCards,
    staffCards,
    highlights,
    jornadaOptions,
    clubOptions,
    selectedJornadaLabel,
    cardsPerMatch,
    cardFrequencyMinutes,
    fetchTablas,
  }
})
