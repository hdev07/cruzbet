<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarDays, Radio, RefreshCw, Zap, ZapOff } from '@lucide/vue'
import { hasMatchesInSyncWindow, triggerLiveSync } from '@/lib/liveSync'
import { supabase } from '@/lib/supabase'
import { useMatchStore } from '@/stores/matchStore'

const matchStore = useMatchStore()
const saving = ref(false)
const message = ref('')
const error = ref('')

const autoSyncCount = computed(
  () => matchStore.matches.filter((m) => m.auto_sync_enabled !== false).length,
)
const inWindowCount = computed(() =>
  matchStore.matches.filter(
    (m) => m.auto_sync_enabled !== false && hasMatchesInSyncWindow([m]),
  ).length,
)
const liveCount = computed(() => matchStore.matches.filter((m) => m.status === 'live').length)

const latestSync = computed(() => {
  let latest: string | null = null
  for (const m of matchStore.matches) {
    if (!m.live_sync_at) continue
    if (!latest || m.live_sync_at > latest) latest = m.live_sync_at
  }
  return latest
})

function formatSyncTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatSyncResult(result: {
  processed?: number
  updated?: number
  skipped?: number
  scoreboard_events?: number
}) {
  const processed = result.processed ?? 0
  const updated = result.updated ?? 0
  const skipped = result.skipped ?? 0
  const espn = result.scoreboard_events
  return `${updated} actualizados de ${processed} procesados` +
    (skipped ? ` (${skipped} sin cambios)` : '') +
    (espn != null ? `. ESPN: ${espn} eventos` : '')
}

async function runSync(
  options?: Parameters<typeof triggerLiveSync>[0],
  emptyMessage = 'No había partidos para sincronizar',
) {
  saving.value = true
  message.value = ''
  error.value = ''
  const result = await triggerLiveSync(options)
  saving.value = false
  if (!result.ok) {
    error.value = result.error ?? 'No se pudo sincronizar'
    if ((result.updated ?? 0) > 0) {
      await matchStore.fetchMatches({ force: true })
    }
    return
  }
  message.value =
    (result.processed ?? 0) === 0 ? emptyMessage : formatSyncResult(result)
  await matchStore.fetchMatches({ force: true })
}

async function syncAllNow() {
  await runSync(undefined, 'No había partidos en ventana ni pendientes de catch-up')
}

async function recoverLastWeek() {
  await runSync(
    { days: 8 },
    'No había partidos en los últimos 8 días',
  )
}

async function setAutoSyncForAll(enabled: boolean) {
  saving.value = true
  message.value = ''
  error.value = ''
  const { error: err } = await supabase
    .from('matches')
    .update({ auto_sync_enabled: enabled })
    .neq('status', 'finished')
  saving.value = false
  if (err) {
    error.value = err.message
    return
  }
  message.value = enabled
    ? 'Sync automático activado en todos los partidos pendientes'
    : 'Sync automático pausado en todos los partidos pendientes'
  await matchStore.fetchMatches({ force: true })
}
</script>

<template>
  <section class="admin-shell">
    <header class="admin-panel-header">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="flex items-center gap-2 text-sm font-semibold text-mundial-green">
            <Radio class="h-4 w-4" />
            Sync en vivo — todos los partidos
          </h2>
          <p class="mt-1 max-w-xl text-xs text-slate-400">
            cron-job.org llama cada minuto al mismo endpoint. Si una jornada ya salió de la
            ventana en vivo, usa recuperar para traer marcadores y eventos desde ESPN.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-200 disabled:opacity-50"
            :disabled="saving"
            @click="recoverLastWeek"
          >
            <CalendarDays class="h-3.5 w-3.5" />
            Recuperar últimos 8 días
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-mundial-green px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
            :disabled="saving"
            @click="syncAllNow"
          >
            <RefreshCw class="h-3.5 w-3.5" :class="saving ? 'animate-spin' : ''" />
            Sync todos ahora
          </button>
        </div>
      </div>
    </header>

    <div class="admin-panel-body space-y-4">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="theme-card px-3 py-3">
          <p class="text-[10px] uppercase tracking-wide text-slate-500">Auto sync ON</p>
          <p class="text-lg font-bold tabular-nums text-app-text">{{ autoSyncCount }}</p>
        </div>
        <div class="theme-card px-3 py-3">
          <p class="text-[10px] uppercase tracking-wide text-slate-500">En ventana</p>
          <p class="text-lg font-bold tabular-nums text-app-text">{{ inWindowCount }}</p>
        </div>
        <div class="theme-card px-3 py-3">
          <p class="text-[10px] uppercase tracking-wide text-slate-500">En vivo ahora</p>
          <p class="text-lg font-bold tabular-nums text-mundial-green">{{ liveCount }}</p>
        </div>
        <div class="theme-card px-3 py-3">
          <p class="text-[10px] uppercase tracking-wide text-slate-500">Última sync</p>
          <p class="text-xs font-medium text-app-text">{{ formatSyncTime(latestSync) }}</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="theme-card inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 disabled:opacity-50"
          :disabled="saving"
          @click="setAutoSyncForAll(true)"
        >
          <Zap class="h-3.5 w-3.5" />
          Activar auto en todos
        </button>
        <button
          type="button"
          class="theme-card inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 disabled:opacity-50"
          :disabled="saving"
          @click="setAutoSyncForAll(false)"
        >
          <ZapOff class="h-3.5 w-3.5" />
          Pausar auto en todos
        </button>
      </div>

      <p v-if="message" class="text-xs text-mundial-green">{{ message }}</p>
      <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
    </div>
  </section>
</template>
