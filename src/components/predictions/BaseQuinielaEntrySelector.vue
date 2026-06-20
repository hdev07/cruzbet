<script setup lang="ts">
import { computed } from 'vue'
import { Plus } from '@lucide/vue'
import { BASE_ENTRY_FEE_MXN } from '@/constants/base-quiniela-rules'
import { formatEntryLabel } from '@/lib/baseQuinielaStats'
import { useBaseQuinielaStore } from '@/stores/baseQuinielaStore'

const props = defineProps<{
  roundId: string
  userId?: string
}>()

const emit = defineEmits<{
  changed: []
}>()

const baseStore = useBaseQuinielaStore()
const formError = defineModel<string | null>('error', { default: null })

const entries = computed(() => baseStore.myEntries)
const currentEntry = computed(() => baseStore.currentEntryNumber)

async function selectEntry(entryNumber: number) {
  if (!props.userId || entryNumber === currentEntry.value) return
  formError.value = null
  try {
    await baseStore.switchEntry(props.roundId, props.userId, entryNumber)
    emit('changed')
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'No se pudo cambiar de quiniela'
  }
}

function createNewEntry() {
  formError.value = null
  try {
    baseStore.startNewEntry()
    emit('changed')
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'No se pudo crear otra quiniela'
  }
}
</script>

<template>
  <div class="mb-4">
    <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Tus quinielas en esta jornada
      </p>
      <p class="text-xs text-slate-500">
        ${{ BASE_ENTRY_FEE_MXN }} MXN por quiniela
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="entry in entries"
        :key="entry.entry_number"
        type="button"
        class="rounded-lg border px-3 py-2 text-sm font-medium transition"
        :class="
          entry.entry_number === currentEntry
            ? 'border-mundial-accent bg-mundial-accent/15 text-mundial-accent'
            : 'border-white/10 bg-white/5 text-slate-300 hover:border-mundial-accent/40'
        "
        @click="selectEntry(entry.entry_number)"
      >
        {{ formatEntryLabel(entry.entry_number) }}
        <span
          v-if="entry.is_submitted"
          class="ml-1 text-[0.65rem] font-normal text-mundial-green"
        >
          · guardada
        </span>
        <span
          v-else-if="entry.prediction_count > 0"
          class="ml-1 text-[0.65rem] font-normal text-slate-500"
        >
          · borrador
        </span>
      </button>

      <button
        v-if="baseStore.canCreateNewEntry"
        type="button"
        class="inline-flex items-center gap-1 rounded-lg border border-dashed border-mundial-accent/40 px-3 py-2 text-sm font-medium text-mundial-accent transition hover:bg-mundial-accent/10"
        @click="createNewEntry"
      >
        <Plus class="h-4 w-4" />
        Nueva quiniela
      </button>
    </div>
  </div>
</template>
