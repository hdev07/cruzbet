<script setup lang="ts">
import { RefreshCw } from '@lucide/vue'
import { APP_NAME } from '@/constants/branding'
import { applyPwaUpdate, pwaNeedRefresh } from '@/lib/pwaUpdate'

async function update() {
  if (!applyPwaUpdate) return
  await applyPwaUpdate()
}
</script>

<template>
  <div
    v-if="pwaNeedRefresh"
    class="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-mundial-dark p-4 shadow-xl md:bottom-4"
  >
    <p class="inline-flex flex-1 items-center gap-2 text-sm">
      <RefreshCw class="h-4 w-4 shrink-0 text-mundial-accent" />
      Hay una nueva versión de {{ APP_NAME }}
    </p>
    <button
      class="shrink-0 rounded-lg bg-mundial-accent px-3 py-1.5 text-sm font-semibold"
      @click="update"
    >
      Actualizar
    </button>
  </div>
</template>
