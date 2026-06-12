<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  actualMatchWinner,
  isPredictionCorrect,
  winnerCode,
} from '@/lib/baseQuinielaDisplay'
import { teamDisplayName } from '@/lib/teamDisplay'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BasePrediction, BaseQuinielaRoundMatch, BaseRoundParticipant } from '@/types'

const props = defineProps<{
  roundId: string
  roundMatches: BaseQuinielaRoundMatch[]
  currentUserId?: string
}>()

const baseStore = useBaseQuinielaStore()
const participants = ref<BaseRoundParticipant[]>([])
const loading = ref(false)
const error = ref('')

const sortedMatches = computed(() =>
  [...props.roundMatches].sort((a, b) => a.position - b.position),
)

const predictionMap = computed(() => {
  const map = new Map<string, Map<string, BasePrediction>>()
  for (const participant of participants.value) {
    const byMatch = new Map<string, BasePrediction>()
    for (const pred of participant.predictions) {
      byMatch.set(pred.match_id, pred)
    }
    map.set(participant.user_id, byMatch)
  }
  return map
})

const competitors = computed(() => {
  const leaderboardIds = new Set(baseStore.leaderboard.map((e) => e.user_id))
  const rows = participants.value.filter(
    (p) => p.complete && (leaderboardIds.size === 0 || leaderboardIds.has(p.user_id)),
  )

  return rows.sort((a, b) => {
    if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count
    return b.total_points - a.total_points
  })
})

const myCorrectCount = computed(() => {
  if (!props.currentUserId) return null
  return competitors.value.find((p) => p.user_id === props.currentUserId)?.correct_count ?? null
})

async function loadParticipants() {
  loading.value = true
  error.value = ''
  try {
    participants.value = await baseStore.fetchRoundParticipants(props.roundId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudieron cargar los pronósticos'
    participants.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.roundId,
  () => loadParticipants(),
  { immediate: true },
)

function getPick(userId: string, matchId: string): BasePrediction | undefined {
  return predictionMap.value.get(userId)?.get(matchId)
}

function cellClass(userId: string, match: BaseQuinielaRoundMatch): string {
  const pick = getPick(userId, match.match_id)
  const base =
    'flex h-8 w-8 items-center justify-center rounded text-xs font-bold tabular-nums'

  if (!pick) return `${base} bg-black/20 text-slate-600`

  if (!match.match || match.match.status !== 'finished') {
    return `${base} bg-white/10 text-slate-300`
  }

  const correct = isPredictionCorrect(pick.predicted_winner, match.match)
  if (correct === true) return `${base} bg-mundial-green/25 text-mundial-green`
  if (correct === false) return `${base} bg-red-500/15 text-red-400`
  return `${base} bg-white/10 text-slate-300`
}

function rivalryLabel(userId: string, correctCount: number): string | null {
  if (!props.currentUserId || userId === props.currentUserId || myCorrectCount.value == null) {
    return null
  }
  const diff = correctCount - myCorrectCount.value
  if (diff === 0) return 'Empatado'
  if (diff === 1) return '+1'
  if (diff === -1) return '-1'
  return null
}

function matchTooltip(match: BaseQuinielaRoundMatch): string {
  if (!match.match) return `Partido #${match.position}`
  const home = teamDisplayName(match.match.home_team, 'Local')
  const away = teamDisplayName(match.match.away_team, 'Visita')
  const score =
    match.match.status !== 'scheduled'
      ? ` (${match.match.home_score}-${match.match.away_score})`
      : ''
  const result = actualMatchWinner(match.match)
  const resultText = result ? ` → ${winnerCode(result)}` : ''
  return `#${match.position}: ${home} vs ${away}${score}${resultText}`
}
</script>

<template>
  <div>
    <p v-if="loading" class="text-sm text-slate-400">Cargando pronósticos...</p>

    <p v-else-if="error" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ error }}
    </p>

    <div
      v-else-if="!competitors.length"
      class="rounded-xl border border-dashed border-white/20 p-6 text-center text-sm text-slate-400"
    >
      Aún no hay quinielas completas para comparar.
    </div>

    <template v-else>
      <p class="mb-3 text-xs text-slate-500">
        Compara tus picks L/E/V con los demás. Verde = acierto, rojo = fallo.
        <span v-if="currentUserId"> Tu fila está resaltada.</span>
      </p>

      <div class="overflow-x-auto rounded-xl border border-white/10">
        <table class="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr class="bg-black/40 text-xs text-slate-400">
              <th
                class="sticky left-0 z-10 min-w-[8rem] border border-white/10 bg-black/90 px-3 py-2 text-left"
              >
                Jugador
              </th>
              <th
                v-for="match in sortedMatches"
                :key="`head-${match.match_id}`"
                class="border border-white/10 px-1 py-2 text-center"
                :title="matchTooltip(match)"
              >
                <span class="block font-bold tabular-nums text-slate-300">{{ match.position }}</span>
                <span
                  v-if="match.match && match.match.status !== 'scheduled'"
                  class="mt-0.5 block text-[0.6rem] font-semibold tabular-nums text-mundial-accent"
                >
                  {{ match.match.home_score }}-{{ match.match.away_score }}
                </span>
                <span
                  v-if="match.match && actualMatchWinner(match.match)"
                  class="mt-0.5 block text-[0.65rem] font-bold text-mundial-green"
                >
                  {{ winnerCode(actualMatchWinner(match.match)!) }}
                </span>
              </th>
              <th class="border border-white/10 px-2 py-2 text-center">Aciertos</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(player, index) in competitors"
              :key="player.user_id"
              class="bg-white/[0.02]"
              :class="{ 'ring-1 ring-inset ring-mundial-accent/40': player.user_id === currentUserId }"
            >
              <td
                class="sticky left-0 z-10 border border-white/10 bg-mundial-dark/95 px-3 py-2"
                :class="{ 'bg-mundial-accent/10': player.user_id === currentUserId }"
              >
                <div class="flex min-w-0 items-center gap-2">
                  <span
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold"
                    :class="index < 3 ? 'bg-mundial-accent text-white' : 'bg-white/10 text-slate-400'"
                  >
                    {{ index + 1 }}
                  </span>
                  <img
                    v-if="player.profiles?.avatar"
                    :src="player.profiles.avatar"
                    :alt="player.profiles.username ?? 'Jugador'"
                    class="h-7 w-7 shrink-0 rounded-full border border-white/20"
                  />
                  <span
                    v-else
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold"
                  >
                    {{ player.profiles?.username?.[0]?.toUpperCase() ?? '?' }}
                  </span>
                  <div class="min-w-0">
                    <p class="truncate font-medium text-slate-200">
                      {{ player.profiles?.username ?? 'Anónimo' }}
                      <span
                        v-if="player.user_id === currentUserId"
                        class="text-mundial-accent"
                      >
                        (tú)
                      </span>
                    </p>
                    <p
                      v-if="rivalryLabel(player.user_id, player.correct_count)"
                      class="text-[0.65rem] font-medium text-amber-400/90"
                    >
                      {{ rivalryLabel(player.user_id, player.correct_count) }} contigo
                    </p>
                  </div>
                </div>
              </td>
              <td
                v-for="match in sortedMatches"
                :key="`${player.user_id}-${match.match_id}`"
                class="border border-white/10 px-1 py-1 text-center"
              >
                <span
                  v-if="getPick(player.user_id, match.match_id)"
                  :class="cellClass(player.user_id, match)"
                  :title="matchTooltip(match)"
                >
                  {{ winnerCode(getPick(player.user_id, match.match_id)!.predicted_winner) }}
                </span>
                <span v-else class="text-xs text-slate-600">—</span>
              </td>
              <td class="border border-white/10 px-2 py-2 text-center">
                <span class="font-bold tabular-nums text-mundial-accent">
                  {{ player.correct_count }}
                </span>
                <span class="block text-[0.65rem] text-slate-500">{{ player.total_points }} pts</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-3 flex flex-wrap gap-3 text-[0.65rem] text-slate-500">
        <span class="inline-flex items-center gap-1">
          <span class="h-3 w-3 rounded bg-mundial-green/25" />
          Acierto
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="h-3 w-3 rounded bg-red-500/15" />
          Fallo
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="h-3 w-3 rounded bg-white/10" />
          Pendiente
        </span>
      </div>
    </template>
  </div>
</template>
