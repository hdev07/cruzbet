<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Crown } from '@lucide/vue'
import {
  actualMatchWinner,
  isPredictionCorrect,
  isProvisionalPredictionCorrect,
  provisionalMatchWinner,
  winnerCode,
} from '@/lib/baseQuinielaDisplay'
import { isEffectivelyLive } from '@/lib/matchLifecycle'
import { firstKickoffFromRoundMatches, hasRoundStarted } from '@/lib/baseQuinielaRound'
import {
  compareBaseRoundRank,
  countLiveProvisionalHits,
} from '@/lib/baseQuinielaStats'
import { teamCrestUrl, teamDisplayName } from '@/lib/teamDisplay'
import DataSkeleton from '@/components/shared/DataSkeleton.vue'
import PaymentStatusChip from '@/components/shared/PaymentStatusChip.vue'
import TeamFlag from '@/components/shared/TeamFlag.vue'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BasePrediction, BaseQuinielaRoundMatch, BaseRoundParticipant } from '@/types'

const props = withDefaults(
  defineProps<{
    roundId: string
    roundMatches: BaseQuinielaRoundMatch[]
    currentUserId?: string
    previousWinnerUserIds?: string[]
    /** Oculta el texto introductorio (útil en admin / export). */
    hideIntro?: boolean
    /** Layout más limpio para captura de imagen (sin sticky móvil). */
    exportLayout?: boolean
  }>(),
  {
    previousWinnerUserIds: () => [],
    hideIntro: false,
    exportLayout: false,
  },
)

const baseStore = useBaseQuinielaStore()
const participants = ref<BaseRoundParticipant[]>([])
const loading = ref(false)
const error = ref('')

const previousWinnerSet = computed(() => new Set(props.previousWinnerUserIds))

function isPreviousWinner(userId: string): boolean {
  return previousWinnerSet.value.has(userId)
}

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

/** Orden: puntos → acierto en vivo → nombre. Posición 1…N (el nombre desempata el premio). */
const competitors = computed(() => {
  const rows = participants.value.filter((p) => p.complete)
  return [...rows].sort((a, b) =>
    compareBaseRoundRank(a, b, {
      liveHitsA: countLiveProvisionalHits(a.predictions, props.roundMatches),
      liveHitsB: countLiveProvisionalHits(b.predictions, props.roundMatches),
    }),
  )
})

function isMyRow(userId: string, _entryNumber?: number): boolean {
  return Boolean(props.currentUserId && userId === props.currentUserId)
}

const myCorrectCount = computed(() => {
  if (!props.currentUserId) return null
  const mine = competitors.value.filter((p) => p.user_id === props.currentUserId)
  if (!mine.length) return null
  const current =
    mine.find((p) => p.entry_number === baseStore.currentEntryNumber) ?? mine[0]
  return current?.correct_count ?? null
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

function canShowPlayerPicks(userId: string, _entryNumber?: number): boolean {
  return roundStarted.value || isMyRow(userId)
}

function cellClass(userId: string, entryNumber: number, match: BaseQuinielaRoundMatch): string {
  const pick = getPick(userId, entryNumber, match.match_id)
  const base =
    'mx-auto flex h-7 w-7 items-center justify-center rounded text-xs font-bold tabular-nums'

  if (!pick) return `${base} theme-cell-idle text-slate-600`

  if (!canShowPlayerPicks(userId, entryNumber)) {
    return `${base} theme-cell-idle text-slate-500`
  }

  const matchData = match.match
  if (!matchData || matchData.status === 'scheduled') {
    return `${base} theme-cell-pending text-slate-300`
  }

  if (matchData.status !== 'finished') {
    if (isProvisionalPredictionCorrect(pick.predicted_winner, matchData)) {
      return `${base} border border-amber-500/35 bg-amber-500/20 text-amber-300`
    }
    if (isEffectivelyLive(matchData) && provisionalMatchWinner(matchData) != null) {
      return `${base} bg-red-500/15 text-red-400`
    }
    return `${base} theme-cell-pending text-slate-300`
  }

  const correct = isPredictionCorrect(pick.predicted_winner, matchData)
  if (correct === true) return `${base} bg-mundial-green/25 text-mundial-green`
  if (correct === false) return `${base} bg-red-500/15 text-red-400`
  return `${base} theme-cell-pending text-slate-300`
}

function rivalryLabel(
  userId: string,
  _entryNumber: number,
  correctCount: number,
): string | null {
  if (
    !roundStarted.value ||
    !props.currentUserId ||
    isMyRow(userId) ||
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
    <DataSkeleton v-if="loading" variant="matrix" :rows="6" />

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
      <div class="theme-table-wrap" :class="{ 'overflow-visible border-0 bg-transparent': exportLayout }">
        <table class="theme-table text-sm" :class="exportLayout ? 'min-w-max' : 'min-w-[48rem]'">
          <thead>
            <tr class="theme-table-head text-xs text-slate-400">
              <th
                class="theme-table-sticky border border-white/10 px-3 py-2 text-left"
                :class="exportLayout ? 'min-w-[10rem]' : 'md:sticky md:left-0 md:z-10 md:min-w-[10rem]'"
              >
                <div class="flex min-w-0 items-center gap-2 md:block">
                  <span v-if="!exportLayout" class="w-7 shrink-0 md:hidden" aria-hidden="true" />
                  <span class="whitespace-nowrap">Jugador</span>
                </div>
              </th>
              <th
                v-for="match in sortedMatches"
                :key="`head-${match.match_id}`"
                class="w-11 min-w-11 border border-white/10 px-0.5 py-1.5 text-center sm:w-12 sm:min-w-12"
                :title="matchTooltip(match)"
              >
                <span class="block text-[0.65rem] font-bold tabular-nums text-slate-300">{{ match.position }}</span>
                <div
                  v-if="match.match"
                  class="mx-auto mt-0.5 flex items-center justify-center gap-0.5"
                >
                  <TeamFlag
                    :src="teamCrestUrl(match.match.home_team?.code) ?? match.match.home_team?.flag_url"
                    :code="match.match.home_team?.code"
                    :alt="teamDisplayName(match.match.home_team, 'Local')"
                    size="md"
                    eager
                    :img-class="
                      exportLayout
                        ? '!h-4 !w-4 shrink-0 rounded-sm object-contain'
                        : '!h-3 !w-3 shrink-0 rounded-sm object-contain'
                    "
                  />
                  <span class="text-[0.4rem] text-slate-600">·</span>
                  <TeamFlag
                    :src="teamCrestUrl(match.match.away_team?.code) ?? match.match.away_team?.flag_url"
                    :code="match.match.away_team?.code"
                    :alt="teamDisplayName(match.match.away_team, 'Visitante')"
                    size="md"
                    eager
                    :img-class="
                      exportLayout
                        ? '!h-4 !w-4 shrink-0 rounded-sm object-contain'
                        : '!h-3 !w-3 shrink-0 rounded-sm object-contain'
                    "
                  />
                </div>
                <span
                  v-if="roundStarted && match.match && match.match.status !== 'scheduled'"
                  class="mt-0.5 block text-[0.6rem] font-semibold tabular-nums text-mundial-accent"
                >
                  {{ match.match.home_score }}-{{ match.match.away_score }}
                </span>
                <span
                  v-if="roundStarted && match.match && actualMatchWinner(match.match)"
                  class="mt-0.5 block text-[0.6rem] font-bold text-mundial-green"
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
              :class="[
                isMyRow(player.user_id) ? 'theme-table-row-mine' : 'theme-table-row',
                !player.verified && !isMyRow(player.user_id) ? 'opacity-90' : '',
                !player.verified ? 'bg-amber-500/[0.03]' : '',
              ]"
            >
              <td
                class="border border-white/10 px-3 py-2"
                :class="{
                  'theme-table-sticky-mine md:sticky md:left-0 md:z-10 md:min-w-[8rem]':
                    !exportLayout && isMyRow(player.user_id),
                  'theme-table-sticky md:sticky md:left-0 md:z-10 md:min-w-[8rem]':
                    !exportLayout && !isMyRow(player.user_id),
                  'min-w-[10rem]': exportLayout,
                }"
              >
                <div class="flex min-w-0 items-start gap-2">
                  <div
                    class="order-1 flex shrink-0 items-center py-0.5"
                    :class="
                      exportLayout
                        ? ''
                        : [
                            'sticky left-0 z-10 -ml-3 pl-3 pr-2 md:static md:order-2 md:ml-0 md:bg-transparent md:p-0',
                            isMyRow(player.user_id)
                              ? 'theme-table-sticky-mine'
                              : 'theme-table-sticky',
                          ]
                    "
                    :title="isPreviousWinner(player.user_id) ? 'Ganador de la jornada previa' : undefined"
                  >
                    <div class="relative shrink-0">
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
                      <Crown
                        v-if="isPreviousWinner(player.user_id)"
                        class="absolute -right-1 -top-1 h-3.5 w-3.5 text-amber-400 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]"
                        fill="currentColor"
                        aria-label="Ganador de la jornada previa"
                      />
                    </div>
                  </div>
                  <span
                    class="order-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold md:order-1"
                    :class="index < 3 ? 'bg-mundial-accent text-white' : 'theme-cell-pending text-slate-400'"
                  >
                    {{ index + 1 }}
                  </span>
                  <div class="order-3 min-w-0 max-w-[7.5rem] flex-1 md:max-w-[11rem]">
                    <p
                      class="truncate font-medium leading-tight"
                      :class="isMyRow(player.user_id) ? 'text-mundial-accent' : 'text-slate-200'"
                      :title="player.profiles?.username ?? 'Anónimo'"
                    >
                      {{ player.profiles?.username ?? 'Anónimo' }}
                      <span v-if="player.entry_number > 1" class="text-slate-500">
                        Q{{ player.entry_number }}
                      </span>
                      <span v-if="isMyRow(player.user_id)" class="text-mundial-accent">
                        (tú)
                      </span>
                    </p>
                    <PaymentStatusChip class="mt-0.5" :verified="player.verified" compact />
                    <p
                      v-if="
                        !exportLayout &&
                        rivalryLabel(player.user_id, player.entry_number, player.correct_count)
                      "
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
                class="border border-white/10 px-0.5 py-1 text-center align-middle"
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
              <td class="border border-white/10 px-2 py-2 text-center align-middle">
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
          <span class="h-3 w-3 rounded border border-amber-500/35 bg-amber-500/20" />
          Provisional (en vivo)
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
