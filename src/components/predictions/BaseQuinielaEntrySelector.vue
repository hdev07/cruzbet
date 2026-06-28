<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, Pencil, Plus, X } from '@lucide/vue'
import { BASE_ENTRY_FEE_MXN } from '@/constants/base-quiniela-rules'
import { formatEntryLabel, validateEntryName } from '@/lib/baseQuinielaStats'
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
const currentEntryData = computed(() =>
  entries.value.find((entry) => entry.entry_number === currentEntry.value),
)

const editingName = ref(false)
const nameDraft = ref('')
const nameError = ref<string | null>(null)
const savingName = ref(false)

watch(
  () => currentEntryData.value?.entry_name,
  (entryName) => {
    if (!editingName.value) {
      nameDraft.value = entryName?.trim() ?? ''
    }
  },
  { immediate: true },
)

async function selectEntry(entryNumber: number) {
  if (!props.userId || entryNumber === currentEntry.value) return
  formError.value = null
  cancelEditingName()
  try {
    await baseStore.switchEntry(props.roundId, props.userId, entryNumber)
    emit('changed')
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'No se pudo cambiar de quiniela'
  }
}

function createNewEntry() {
  formError.value = null
  cancelEditingName()
  try {
    baseStore.startNewEntry()
    emit('changed')
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'No se pudo crear otra quiniela'
  }
}

function startEditingName() {
  if (!props.userId || !currentEntryData.value) return
  nameDraft.value = currentEntryData.value.entry_name?.trim() ?? ''
  nameError.value = null
  editingName.value = true
}

function cancelEditingName() {
  nameDraft.value = currentEntryData.value?.entry_name?.trim() ?? ''
  nameError.value = null
  editingName.value = false
}

async function saveEntryName() {
  if (!props.userId || !currentEntryData.value) return

  const validationError = validateEntryName(nameDraft.value)
  if (validationError) {
    nameError.value = validationError
    return
  }

  nameError.value = null
  savingName.value = true
  try {
    await baseStore.updateEntryName(
      props.roundId,
      currentEntryData.value.entry_number,
      nameDraft.value,
    )
    editingName.value = false
    emit('changed')
  } catch (err) {
    nameError.value = err instanceof Error ? err.message : 'No se pudo guardar el nombre'
  } finally {
    savingName.value = false
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
        {{ formatEntryLabel(entry.entry_number, entry.entry_name) }}
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

    <div
      v-if="currentEntryData && userId"
      class="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5"
    >
      <div v-if="editingName" class="space-y-2">
        <label class="text-xs font-medium text-slate-400" :for="`entry-name-${currentEntry}`">
          Nombre de esta quiniela
        </label>
        <input
          :id="`entry-name-${currentEntry}`"
          v-model="nameDraft"
          type="text"
          maxlength="30"
          autocomplete="off"
          class="w-full rounded-lg border border-white/10 bg-mundial-dark px-3 py-2 text-sm"
          :disabled="savingName"
          placeholder="Ej. Familia, Oficina, Suerte..."
          @keyup.enter="saveEntryName"
          @keyup.escape="cancelEditingName"
        />
        <p v-if="nameError" class="text-xs text-red-400">{{ nameError }}</p>
        <div class="flex gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg bg-mundial-accent px-3 py-1.5 text-xs font-semibold text-mundial-dark disabled:opacity-50"
            :disabled="savingName"
            @click="saveEntryName"
          >
            <Check class="h-3.5 w-3.5" />
            {{ savingName ? 'Guardando...' : 'Guardar' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
            :disabled="savingName"
            @click="cancelEditingName"
          >
            <X class="h-3.5 w-3.5" />
            Cancelar
          </button>
        </div>
      </div>

      <div v-else class="flex items-center justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs text-slate-500">Nombre de esta quiniela</p>
          <p class="truncate text-sm font-medium text-slate-200">
            {{ formatEntryLabel(currentEntryData.entry_number, currentEntryData.entry_name) }}
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
          title="Cambiar nombre"
          @click="startEditingName"
        >
          <Pencil class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
