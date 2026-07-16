<script setup lang="ts">
import { ref } from 'vue'
import { RefreshCw, X } from '@lucide/vue'
import { usePwaStore } from '@/stores/pwaStore'

const pwa = usePwaStore()
const applying = ref(false)
const dismissed = ref(false)

async function applyUpdate() {
  applying.value = true
  try {
    await pwa.applyUpdate()
  } finally {
    applying.value = false
  }
}
</script>

<template>
  <div
    v-if="pwa.needRefresh && !dismissed"
    class="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-40 flex justify-center px-4 md:bottom-4"
  >
    <div
      class="flex w-full max-w-md items-center gap-3 rounded-xl border border-mundial-accent/40 bg-mundial-dark px-4 py-3 shadow-lg shadow-black/40"
    >
      <RefreshCw class="h-4 w-4 shrink-0 text-mundial-accent" />
      <p class="flex-1 text-sm text-slate-200">Hay una nueva versión de CruzBet disponible.</p>
      <button
        type="button"
        class="shrink-0 rounded-lg bg-mundial-accent px-3 py-1.5 text-xs font-semibold text-mundial-dark disabled:opacity-50"
        :disabled="applying"
        @click="applyUpdate"
      >
        {{ applying ? 'Actualizando...' : 'Actualizar' }}
      </button>
      <button
        type="button"
        class="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
        title="Cerrar"
        @click="dismissed = true"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
