<script setup lang="ts">
import { WifiOff } from '@lucide/vue'
import { useOnlineStatus } from '@/composables/useOnlineStatus'

const { online } = useOnlineStatus()
</script>

<template>
  <div
    v-if="!online"
    class="fixed inset-x-0 top-[env(safe-area-inset-top,0px)] z-50 flex justify-center px-3 pt-2"
    role="status"
  >
    <div
      class="flex max-w-md items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/95 px-3 py-2 text-sm text-amber-100 shadow-lg"
    >
      <WifiOff class="h-4 w-4 shrink-0" />
      <p>
        Sin conexión. Se muestran datos guardados si los hay; para actualizar activa WiFi o datos.
      </p>
    </div>
  </div>
</template>
