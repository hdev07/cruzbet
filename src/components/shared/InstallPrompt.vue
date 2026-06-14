<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Smartphone, X } from '@lucide/vue'
import { APP_NAME } from '@/constants/branding'

const INSTALL_DISMISS_KEY = 'pwa-install-dismissed'

const showPrompt = ref(false)
let deferredPrompt: Event | null = null

onMounted(() => {
  if (localStorage.getItem(INSTALL_DISMISS_KEY)) return

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    showPrompt.value = true
  })
})

function dismiss() {
  localStorage.setItem(INSTALL_DISMISS_KEY, '1')
  showPrompt.value = false
}

async function install() {
  if (!deferredPrompt) return
  const prompt = deferredPrompt as BeforeInstallPromptEvent
  await prompt.prompt()
  showPrompt.value = false
  deferredPrompt = null
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}
</script>

<template>
  <div
    v-if="showPrompt"
    class="fixed bottom-24 left-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-white/10 bg-mundial-dark p-4 shadow-xl md:hidden"
  >
    <p class="inline-flex flex-1 items-center gap-2 text-sm">
      <Smartphone class="h-4 w-4 shrink-0 text-mundial-accent" />
      Instala {{ APP_NAME }} en tu celular
    </p>
    <button class="shrink-0 rounded-lg bg-mundial-accent px-3 py-1.5 text-sm font-semibold" @click="install">
      Instalar
    </button>
    <button
      type="button"
      class="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-slate-200"
      aria-label="Cerrar"
      @click="dismiss"
    >
      <X class="h-4 w-4" />
    </button>
  </div>
</template>
