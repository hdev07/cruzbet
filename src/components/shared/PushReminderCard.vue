<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Bell, BellOff, BellRing, Loader2 } from '@lucide/vue'
import {
  getExistingPushSubscription,
  isPushSupported,
  pushPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/pushNotifications'

const props = defineProps<{
  userId: string
}>()

const supported = ref(false)
const enabled = ref(false)
const working = ref(false)
const checked = ref(false)
const error = ref<string | null>(null)

const permissionDenied = computed(() => pushPermissionState() === 'denied')

onMounted(async () => {
  supported.value = isPushSupported()
  if (supported.value) {
    try {
      enabled.value = !!(await getExistingPushSubscription())
    } catch {
      enabled.value = false
    }
  }
  checked.value = true
})

async function toggle() {
  if (working.value) return
  error.value = null
  working.value = true
  try {
    if (enabled.value) {
      await unsubscribeFromPush()
      enabled.value = false
    } else {
      await subscribeToPush(props.userId)
      enabled.value = true
    }
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'No se pudo cambiar la configuración'
  } finally {
    working.value = false
  }
}
</script>

<template>
  <section
    v-if="checked && supported"
    class="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
    aria-label="Recordatorios"
  >
    <div class="flex items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2.5">
        <BellRing v-if="enabled" class="h-4 w-4 shrink-0 text-mundial-green" />
        <Bell v-else class="h-4 w-4 shrink-0 text-slate-400" />
        <div class="min-w-0">
          <p class="text-sm font-medium text-slate-200">Recordatorios de quiniela</p>
          <p class="text-xs text-slate-500">
            <template v-if="enabled">
              Te avisamos si no has guardado tu quiniela o falta tu pago.
            </template>
            <template v-else-if="permissionDenied">
              Bloqueados por el navegador. Actívalos en la configuración del sitio.
            </template>
            <template v-else>
              Recibe un aviso antes de cada jornada si aún no guardas tus picks.
            </template>
          </p>
        </div>
      </div>

      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-50"
        :class="
          enabled
            ? 'border border-white/15 text-slate-300 hover:bg-white/5'
            : 'bg-mundial-green text-mundial-dark hover:bg-mundial-green/90'
        "
        :disabled="working || permissionDenied"
        @click="toggle"
      >
        <Loader2 v-if="working" class="h-3.5 w-3.5 animate-spin" />
        <BellOff v-else-if="enabled" class="h-3.5 w-3.5" />
        <BellRing v-else class="h-3.5 w-3.5" />
        {{ working ? '...' : enabled ? 'Desactivar' : 'Activar' }}
      </button>
    </div>

    <p v-if="error" class="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
      {{ error }}
    </p>
  </section>
</template>
