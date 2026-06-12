<script setup lang="ts">
import { computed, ref } from 'vue'
import { RefreshCw, Radio, Zap, ZapOff } from '@lucide/vue'
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

async function syncAllNow() {
  saving.value = true
  message.value = ''
  error.value = ''
  const result = await triggerLiveSync()
  saving.value = false
  if (!result.ok) {
    error.value = result.error ?? 'No se pudo sincronizar'
    return
  }
  message.value = 'Todos los partidos en ventana sincronizados'
  await matchStore.fetchMatches()
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
  await matchStore.fetchMatches()
}
</script>

<template>
  <section class="rounded-xl border border-mundial-green/30 bg-mundial-green/5 p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="flex items-center gap-2 text-sm font-semibold text-mundial-green">
          <Radio class="h-4 w-4" />
          Sync en vivo — todos los partidos
        </h2>
        <p class="mt-1 max-w-xl text-xs text-slate-400">
          cron-job.org actualiza cada minuto. Aquí puedes forzar sync global o activar/pausar
          automático en lote.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg bg-mundial-green px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        :disabled="saving"
        @click="syncAllNow"
      >
        <RefreshCw class="h-3.5 w-3.5" :class="saving ? 'animate-spin' : ''" />
        Sync todos ahora
      </button>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div class="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
        <p class="text-[10px] uppercase tracking-wide text-slate-500">Auto sync ON</p>
        <p class="text-lg font-bold tabular-nums text-slate-100">{{ autoSyncCount }}</p>
      </div>
      <div class="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
        <p class="text-[10px] uppercase tracking-wide text-slate-500">En ventana</p>
        <p class="text-lg font-bold tabular-nums text-slate-100">{{ inWindowCount }}</p>
      </div>
      <div class="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
        <p class="text-[10px] uppercase tracking-wide text-slate-500">En vivo ahora</p>
        <p class="text-lg font-bold tabular-nums text-mundial-green">{{ liveCount }}</p>
      </div>
      <div class="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
        <p class="text-[10px] uppercase tracking-wide text-slate-500">Última sync</p>
        <p class="text-xs font-medium text-slate-200">{{ formatSyncTime(latestSync) }}</p>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-300 disabled:opacity-50"
        :disabled="saving"
        @click="setAutoSyncForAll(true)"
      >
        <Zap class="h-3.5 w-3.5" />
        Activar auto en todos
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-400 disabled:opacity-50"
        :disabled="saving"
        @click="setAutoSyncForAll(false)"
      >
        <ZapOff class="h-3.5 w-3.5" />
        Pausar auto en todos
      </button>
    </div>

    <p v-if="message" class="mt-3 text-xs text-mundial-green">{{ message }}</p>
    <p v-if="error" class="mt-3 text-xs text-red-400">{{ error }}</p>
  </section>
</template>
