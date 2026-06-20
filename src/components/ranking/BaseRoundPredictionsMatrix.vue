<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  actualMatchWinner,
  isPredictionCorrect,
  winnerCode,
} from '@/lib/baseQuinielaDisplay'
import { firstKickoffFromRoundMatches, hasRoundStarted } from '@/lib/baseQuinielaRound'
import { teamDisplayName } from '@/lib/teamDisplay'
import TeamFlag from '@/components/shared/TeamFlag.vue'
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

const roundStarted = computed(() =>
  hasRoundStarted(firstKickoffFromRoundMatches(props.roundMatches)),
)

const predictionMap = computed(() => {
  const map = new Map<string, Map<string, BasePrediction>>()
  for (const participant of participants.value) {
    const byMatch = new Map<string, BasePrediction>()
    for (const pred of participant.predictions) {
      byMatch.set(pred.match_id, pred)
    }
    map.set(`${participant.user_id}:${participant.entry_number}`, byMatch)
  }
  return map
})

const competitors = computed(() => {
  const leaderboardKeys = new Set(
    baseStore.leaderboard.map((e) => `${e.user_id}:${e.entry_number}`),
  )
  const rows = participants.value.filter(
    (p) =>
      p.complete &&
      (leaderboardKeys.size === 0 ||
        leaderboardKeys.has(`${p.user_id}:${p.entry_number}`)),
  )

  return rows.sort((a, b) => {
    if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count
    return b.total_points - a.total_points
  })
})

const myCorrectCount = computed(() => {
  if (!props.currentUserId) return null
  return (
    competitors.value.find(
      (p) =>
        p.user_id === props.currentUserId &&
        p.entry_number === baseStore.currentEntryNumber,
    )?.correct_count ?? null
  )
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

function participantKey(userId: string, entryNumber: number): string {
  return `${userId}:${entryNumber}`
}

function getPick(userId: string, entryNumber: number, matchId: string): BasePrediction | undefined {
  return predictionMap.value.get(participantKey(userId, entryNumber))?.get(matchId)
}

function canShowPlayerPicks(userId: string, entryNumber: number): boolean {
  return (
    roundStarted.value ||
    (userId === props.currentUserId && entryNumber === baseStore.currentEntryNumber)
  )
}

function cellClass(userId: string, entryNumber: number, match: BaseQuinielaRoundMatch): string {
  const pick = getPick(userId, entryNumber, match.match_id)
  const base =
    'flex h-8 w-8 items-center justify-center rounded text-xs font-bold tabular-nums'

  if (!pick) return `${base} theme-cell-idle text-slate-600`

  if (!canShowPlayerPicks(userId, entryNumber)) {
    return `${base} theme-cell-idle text-slate-500`
  }

  if (!roundStarted.value || !match.match || match.match.status !== 'finished') {
    return `${base} theme-cell-pending text-slate-300`
  }

  const correct = isPredictionCorrect(pick.predicted_winner, match.match)
  if (correct === true) return `${base} bg-mundial-green/25 text-mundial-green`
  if (correct === false) return `${base} bg-red-500/15 text-red-400`
  return `${base} theme-cell-pending text-slate-300`
}

function rivalryLabel(
  userId: string,
  entryNumber: number,
  correctCount: number,
): string | null {
  if (
    !roundStarted.value ||
    !props.currentUserId ||
    (userId === props.currentUserId && entryNumber === baseStore.currentEntryNumber) ||
    myCorrectCount.value == null
  ) {
    return null
  }
  const diff = correctCount - myCorrectCount.value
  if (diff === 0) return 'Empatado'
  if (diff > 0) return `+${diff}`
  return `${diff}`
}

function matchTooltip(match: BaseQuinielaRoundMatch): string {
  if (!match.match) return `Partido #${match.position}`
  const home = teamDisplayName(match.match.home_team, 'Local')
  const away = teamDisplayName(match.match.away_team, 'Visita')
  const score =
    roundStarted.value && match.match.status !== 'scheduled'
      ? ` (${match.match.home_score}-${match.match.away_score})`
      : ''
  const result = roundStarted.value ? actualMatchWinner(match.match) : null
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
        <template v-if="roundStarted">
          Compara tus picks L/E/V con los demás. Verde = acierto, rojo = fallo.
          <span v-if="currentUserId"> Tu fila está resaltada.</span>
        </template>
        <template v-else>
          Los pronósticos de los demás, los marcadores y los aciertos se mostrarán cuando empiece
          el primer partido de la jornada. Solo ves tus picks hasta entonces.
          <span v-if="currentUserId"> Tu fila está resaltada.</span>
        </template>
      </p>

      <div class="theme-table-wrap">
        <table class="theme-table min-w-[40rem] text-sm">
          <thead>
            <tr class="theme-table-head text-xs text-slate-400">
              <th
                class="theme-table-sticky border border-white/10 px-3 py-2 text-left md:sticky md:left-0 md:z-10 md:min-w-[8rem]"
              >
                <div class="flex min-w-0 items-center gap-2 md:block">
                  <span class="w-7 shrink-0 md:hidden" aria-hidden="true" />
                  <span class="whitespace-nowrap">Jugador</span>
                </div>
              </th>
              <th
                v-for="match in sortedMatches"
                :key="`head-${match.match_id}`"
                class="min-w-[2.75rem] border border-white/10 px-1 py-2 text-center"
                :title="matchTooltip(match)"
              >
                <span class="block font-bold tabular-nums text-slate-300">{{ match.position }}</span>
                <div
                  v-if="match.match"
                  class="mx-auto mt-1 flex items-center justify-center gap-0.5"
                >
                  <TeamFlag
                    v-if="match.match.home_team?.flag_url"
                    :src="match.match.home_team.flag_url"
                    :alt="teamDisplayName(match.match.home_team, 'Local')"
                    img-class="h-3 w-4 shrink-0 rounded-sm object-cover"
                  />
                  <span v-else class="h-3 w-4 shrink-0 rounded-sm bg-white/10" />
                  <span class="text-[0.5rem] text-slate-600">·</span>
                  <TeamFlag
                    v-if="match.match.away_team?.flag_url"
                    :src="match.match.away_team.flag_url"
                    :alt="teamDisplayName(match.match.away_team, 'Visitante')"
                    img-class="h-3 w-4 shrink-0 rounded-sm object-cover"
                  />
                  <span v-else class="h-3 w-4 shrink-0 rounded-sm bg-white/10" />
                </div>
                <span
                  v-if="roundStarted && match.match && match.match.status !== 'scheduled'"
                  class="mt-0.5 block text-[0.6rem] font-semibold tabular-nums text-mundial-accent"
                >
                  {{ match.match.home_score }}-{{ match.match.away_score }}
                </span>
                <span
                  v-if="roundStarted && match.match && actualMatchWinner(match.match)"
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
              :key="`${player.user_id}-${player.entry_number}`"
              class="theme-table-row"
              :class="{
                'ring-1 ring-inset ring-mundial-accent/40':
                  player.user_id === currentUserId &&
                  player.entry_number === baseStore.currentEntryNumber,
              }"
            >
              <td
                class="theme-table-sticky border border-white/10 px-3 py-2 md:sticky md:left-0 md:z-10 md:min-w-[8rem]"
                :class="{
                  'md:bg-mundial-accent/10':
                    player.user_id === currentUserId &&
                    player.entry_number === baseStore.currentEntryNumber,
                }"
              >
                <div class="flex min-w-0 items-start gap-2">
                  <div
                    class="theme-table-sticky sticky left-0 z-10 order-1 -ml-3 flex shrink-0 items-center py-0.5 pl-3 pr-2 md:static md:order-2 md:ml-0 md:bg-transparent md:p-0"
                    :class="{
                      'bg-mundial-accent/10 md:bg-transparent':
                        player.user_id === currentUserId &&
                        player.entry_number === baseStore.currentEntryNumber,
                    }"
                  >
                    <img
                      v-if="player.profiles?.avatar"
                      :src="player.profiles.avatar"
                      :alt="player.profiles.username ?? 'Jugador'"
                      class="h-7 w-7 shrink-0 rounded-full border border-white/20"
                    />
                    <span
                      v-else
                      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full theme-cell-pending text-xs font-semibold"
                    >
                      {{ player.profiles?.username?.[0]?.toUpperCase() ?? '?' }}
                    </span>
                  </div>
                  <span
                    class="order-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold md:order-1"
                    :class="index < 3 ? 'bg-mundial-accent text-white' : 'theme-cell-pending text-slate-400'"
                  >
                    {{ index + 1 }}
                  </span>
                  <div class="order-3 min-w-[5.5rem] shrink-0 md:min-w-0">
                    <p class="whitespace-nowrap font-medium leading-tight text-slate-200">
                      {{ player.profiles?.username ?? 'Anónimo' }}
                      <span v-if="player.entry_number > 1" class="text-slate-500">
                        Q{{ player.entry_number }}
                      </span>
                      <span
                        v-if="
                          player.user_id === currentUserId &&
                          player.entry_number === baseStore.currentEntryNumber
                        "
                        class="text-mundial-accent"
                      >
                        (tú)
                      </span>
                    </p>
                    <p
                      v-if="rivalryLabel(player.user_id, player.entry_number, player.correct_count)"
                      class="mt-0.5 whitespace-nowrap text-[0.65rem] font-medium leading-tight text-amber-400/90"
                    >
                      {{ rivalryLabel(player.user_id, player.entry_number, player.correct_count) }} contigo
                    </p>
                  </div>
                </div>
              </td>
              <td
                v-for="match in sortedMatches"
                :key="`${player.user_id}-${player.entry_number}-${match.match_id}`"
                class="border border-white/10 px-1 py-1 text-center"
              >
                <span
                  v-if="getPick(player.user_id, player.entry_number, match.match_id)"
                  :class="cellClass(player.user_id, player.entry_number, match)"
                  :title="
                    canShowPlayerPicks(player.user_id, player.entry_number)
                      ? matchTooltip(match)
                      : undefined
                  "
                >
                  <template v-if="canShowPlayerPicks(player.user_id, player.entry_number)">
                    {{
                      winnerCode(
                        getPick(player.user_id, player.entry_number, match.match_id)!
                          .predicted_winner,
                      )
                    }}
                  </template>
                  <template v-else>?</template>
                </span>
                <span v-else class="text-xs text-slate-600">—</span>
              </td>
              <td class="border border-white/10 px-2 py-2 text-center">
                <template v-if="roundStarted">
                  <span class="font-bold tabular-nums text-mundial-accent">
                    {{ player.correct_count }}
                  </span>
                  <span class="block text-[0.65rem] text-slate-500">{{ player.total_points }} pts</span>
                </template>
                <span v-else class="text-xs text-slate-600">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="roundStarted" class="mt-3 flex flex-wrap gap-3 text-[0.65rem] text-slate-500">
        <span class="inline-flex items-center gap-1">
          <span class="h-3 w-3 rounded bg-mundial-green/25" />
          Acierto
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="h-3 w-3 rounded bg-red-500/15" />
          Fallo
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="h-3 w-3 rounded theme-cell-pending" />
          Pendiente
        </span>
      </div>
    </template>
  </div>
</template>
