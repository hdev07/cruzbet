<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { ChevronRight, Crown, Trophy } from '@lucide/vue'
import { useAuthStore } from '@/stores/authStore'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'
import type { BaseRoundResultSummary } from '@/types'

const auth = useAuthStore()
const baseStore = useBaseQuinielaStore()
const loading = ref(false)
const loadError = ref<string | null>(null)
const results = ref<BaseRoundResultSummary[]>([])

onMounted(async () => {
  loading.value = true
  loadError.value = null
  try {
    results.value = await baseStore.fetchAllRoundResults(auth.user?.id)
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'No se pudieron cargar los resultados'
  } finally {
    loading.value = false
  }
})

const finishedCount = computed(
  () => results.value.filter((r) => !r.isActive && r.winner).length,
)
</script>

<template>
  <div>
    <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-mundial-accent">
      Archivo
    </p>
    <h1 class="mb-2 text-2xl font-bold lg:text-3xl">Resultados por jornada</h1>
    <p class="mb-6 text-sm text-slate-400 lg:text-base">
      Ganador y podio de cada jornada. Cada jornada tiene su ranking independiente.
    </p>

    <p v-if="loading" class="text-slate-400">Cargando resultados...</p>

    <p v-else-if="loadError" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
      {{ loadError }}
    </p>

    <div
      v-else-if="!results.length"
      class="rounded-xl border border-dashed border-white/20 p-8 text-center text-slate-400"
    >
      Aún no hay jornadas disponibles.
    </div>

    <template v-else>
      <div
        v-if="finishedCount > 0"
        class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-lg"
      >
        <div class="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p class="text-xs text-slate-400">Jornadas</p>
          <p class="text-2xl font-bold text-slate-200">{{ results.length }}</p>
        </div>
        <div class="rounded-xl border border-mundial-accent/30 bg-mundial-accent/10 px-4 py-3">
          <p class="text-xs text-slate-400">Con ganador</p>
          <p class="text-2xl font-bold text-mundial-accent">{{ finishedCount }}</p>
        </div>
      </div>

      <div class="space-y-4">
        <section
          v-for="item in results"
          :key="item.round.id"
          class="rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="font-semibold text-slate-200">{{ item.round.title }}</h2>
                <span
                  v-if="item.isActive"
                  class="rounded-full bg-mundial-green/15 px-2 py-0.5 text-xs font-semibold text-mundial-green"
                >
                  En curso
                </span>
              </div>
              <p class="mt-1 text-xs text-slate-500">
                {{ item.participantCount }} quiniela{{ item.participantCount === 1 ? '' : 's' }}
                completa{{ item.participantCount === 1 ? '' : 's' }}
              </p>
            </div>

            <RouterLink
              :to="`/jornadas/${item.round.id}`"
              class="inline-flex items-center gap-1 text-xs text-mundial-green hover:underline"
            >
              Ver jornada
              <ChevronRight class="h-3.5 w-3.5" />
            </RouterLink>
          </div>

          <div
            v-if="!item.winner"
            class="rounded-lg border border-dashed border-white/15 px-4 py-5 text-center text-sm text-slate-400"
          >
            Aún no hay quinielas completas en esta jornada.
          </div>

          <template v-else>
            <div
              class="mb-3 flex items-center gap-3 rounded-lg border border-mundial-accent/30 bg-mundial-accent/10 px-4 py-3"
            >
              <Crown class="h-5 w-5 shrink-0 text-mundial-accent" />
              <img
                v-if="item.winner.avatar"
                :src="item.winner.avatar"
                :alt="item.winner.username ?? 'Ganador'"
                class="h-10 w-10 rounded-full border border-white/20"
              />
              <span
                v-else
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold"
              >
                {{ item.winner.username?.[0]?.toUpperCase() ?? '?' }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-xs text-slate-400">Ganador</p>
                <p class="truncate font-semibold text-slate-200">
                  {{ item.winner.username ?? 'Anónimo' }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-lg font-bold tabular-nums text-mundial-accent">
                  {{ item.winner.correct_count }} aciertos
                </p>
                <p class="text-xs text-slate-500">{{ item.winner.total_points }} pts</p>
              </div>
            </div>

            <div v-if="item.topThree.length > 1" class="mb-3">
              <p class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Trophy class="h-3.5 w-3.5" />
                Podio
              </p>
              <ol class="space-y-1.5">
                <li
                  v-for="(player, index) in item.topThree.slice(1)"
                  :key="player.user_id"
                  class="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-sm"
                >
                  <span class="w-5 text-center text-xs font-bold text-slate-500">
                    {{ index + 2 }}
                  </span>
                  <span class="min-w-0 flex-1 truncate text-slate-300">
                    {{ player.username ?? 'Anónimo' }}
                  </span>
                  <span class="shrink-0 text-xs tabular-nums text-slate-400">
                    {{ player.correct_count }} · {{ player.total_points }} pts
                  </span>
                </li>
              </ol>
            </div>
          </template>

          <div
            v-if="auth.isLoggedIn && item.myEntry"
            class="rounded-lg border border-white/10 bg-black/20 px-4 py-3"
          >
            <p class="text-xs text-slate-400">Tu resultado</p>
            <p class="font-semibold text-slate-200">
              {{ item.myEntry.correct_count }} aciertos · {{ item.myEntry.total_points }} pts
            </p>
          </div>
          <p
            v-else-if="auth.isLoggedIn"
            class="text-xs text-slate-500"
          >
            No participaste con quiniela completa en esta jornada.
          </p>
        </section>
      </div>

      <RouterLink
        to="/ranking"
        class="mt-6 inline-flex items-center gap-1 text-sm text-mundial-accent hover:underline"
      >
        Ver ranking detallado por jornada
        <ChevronRight class="h-4 w-4" />
      </RouterLink>
    </template>
  </div>
</template>
