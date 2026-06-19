<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { CalendarClock, ChevronRight, Target } from '@lucide/vue'
import { BASE_QUINIELA_MATCHES_PER_ROUND } from '@/constants/base-quiniela-rules'
import {
  countRoundMatchesStarted,
  isActiveRoundPastHalfwayByKickoff,
  isRoundPastHalfway,
  resolveNextBaseRound,
} from '@/lib/baseQuinielaRound'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()

const loading = ref(false)
const nextRoundFilled = ref(false)
let loadSeq = 0

const activeRound = computed(() => baseStore.activeRound)
const nextRound = computed(() =>
  resolveNextBaseRound(baseStore.rounds, activeRound.value),
)

const activeRoundMatchesLoaded = computed(
  () =>
    !!activeRound.value &&
    baseStore.currentRound?.id === activeRound.value.id &&
    baseStore.roundMatches.length > 0,
)

const isPastHalfway = computed(() => {
  const active = activeRound.value
  const next = nextRound.value
  if (!active || !next) return false

  const matchCount = active.match_count ?? BASE_QUINIELA_MATCHES_PER_ROUND

  if (activeRoundMatchesLoaded.value) {
    const started = countRoundMatchesStarted(baseStore.roundMatches)
    return isRoundPastHalfway(matchCount, started)
  }

  return isActiveRoundPastHalfwayByKickoff(
    active.id,
    next.id,
    baseStore.roundFirstKickoff,
  )
})

const nextRoundHref = computed(() =>
  nextRound.value ? `/jornadas/${nextRound.value.id}` : null,
)

const showPrompt = computed(
  () =>
    !!nextRound.value &&
    !!nextRoundHref.value &&
    isPastHalfway.value &&
    (!auth.isLoggedIn || !nextRoundFilled.value) &&
    !loading.value,
)

async function loadPromptState() {
  const active = activeRound.value
  const next = nextRound.value
  if (!active || !next) return

  const seq = ++loadSeq
  loading.value = true

  try {
    if (!baseStore.rounds.length) {
      await baseStore.fetchRounds()
    }
    if (seq !== loadSeq) return

    if (!activeRoundMatchesLoaded.value) {
      await baseStore.fetchRound(active.id)
    }
    if (seq !== loadSeq) return

    if (auth.isLoggedIn && auth.user) {
      const status = await baseStore.fetchRoundParticipationStatus(next.id, auth.user.id)
      if (seq !== loadSeq) return

      const matchCount = next.match_count ?? BASE_QUINIELA_MATCHES_PER_ROUND
      nextRoundFilled.value =
        status.isSubmitted || status.predictionCount >= matchCount
    } else {
      nextRoundFilled.value = false
    }
  } catch {
    if (seq !== loadSeq) return
    nextRoundFilled.value = false
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

onMounted(() => {
  void loadPromptState()
})

watch(
  [activeRound, nextRound, () => auth.user?.id],
  () => {
    void loadPromptState()
  },
)
</script>

<template>
  <section
    v-if="showPrompt"
    class="mb-6 overflow-hidden rounded-2xl border border-mundial-accent/30 bg-mundial-accent/10"
    aria-label="Jornada siguiente"
  >
    <div class="p-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-5">
      <div class="mb-3 flex gap-3 sm:mb-0">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mundial-accent/20 text-mundial-accent"
        >
          <CalendarClock class="h-5 w-5" />
        </span>
        <div class="min-w-0">
          <p class="text-sm font-semibold text-slate-100">
            Ya va la mitad de {{ activeRound?.title }}
          </p>
          <p class="mt-0.5 text-xs text-slate-400 sm:text-sm">
            Es buen momento para marcar
            <span class="font-medium text-slate-300">{{ nextRound?.title }}</span>
            si quieres participar en ella.
          </p>
        </div>
      </div>

      <RouterLink
        v-if="nextRoundHref"
        :to="nextRoundHref"
        class="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-mundial-accent px-4 py-2.5 text-sm font-semibold text-mundial-dark transition hover:bg-mundial-accent/90 sm:w-auto"
      >
        <Target class="h-4 w-4" />
        Ir a la jornada siguiente
        <ChevronRight class="h-4 w-4 opacity-70" />
      </RouterLink>
    </div>
  </section>
</template>
