import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  CARD_MINUTE_BUCKETS,
  LIGA_MX_CLUBS,
  TOTAL_JORNADAS,
} from '@/constants/tablas'
import type {
  CardJornadaBucket,
  CardMinuteBucket,
  CardTotals,
  FairPlayClubRow,
  ScorerRow,
  StandingRow,
  TournamentHighlight,
} from '@/types/tablas'

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

function emptyScorers(): ScorerRow[] {
  return Array.from({ length: 10 }, (_, index) => {
    const club = LIGA_MX_CLUBS[index % LIGA_MX_CLUBS.length]!
    return {
      position: index + 1,
      playerName: '—',
      teamCode: club.code,
      teamName: club.name,
      goals: 0,
    }
  })
}

function emptyFairPlay(): FairPlayClubRow[] {
  return LIGA_MX_CLUBS.map((club, index) => ({
    position: index + 1,
    teamCode: club.code,
    teamName: club.name,
    yellow: 0,
    red: 0,
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
  const scorers = ref<ScorerRow[]>(emptyScorers())
  const menoresStandings = ref<StandingRow[]>(emptyStandings())
  const fairPlayTable = ref<FairPlayClubRow[]>(emptyFairPlay())
  const minuteBuckets = ref<CardMinuteBucket[]>(emptyMinuteBuckets())
  const jornadaBuckets = ref<CardJornadaBucket[]>(emptyJornadaBuckets())

  const cardTotals = ref<CardTotals>({
    yellow: 0,
    red: 0,
    fouls: 0,
  })

  const playerCards = ref({ yellow: 0, red: 0 })
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

  const cardsPerMatch = computed(() => ({
    yellow: 0,
    red: 0,
  }))

  const cardFrequencyMinutes = computed(() => ({
    yellow: 0,
    red: 0,
  }))

  async function fetchTablas() {
    loading.value = true
    try {
      // Placeholder: se conectará a match_events / standings cuando haya datos.
      standings.value = emptyStandings()
      scorers.value = emptyScorers()
      menoresStandings.value = emptyStandings()
      fairPlayTable.value = emptyFairPlay()
      minuteBuckets.value = emptyMinuteBuckets()
      jornadaBuckets.value = emptyJornadaBuckets()
      cardTotals.value = { yellow: 0, red: 0, fouls: 0 }
      playerCards.value = { yellow: 0, red: 0 }
      staffCards.value = { yellow: 0, red: 0 }
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
