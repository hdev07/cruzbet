<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Smartphone } from '@lucide/vue'
import { APP_NAME } from '@/constants/branding'

const showPrompt = ref(false)
let deferredPrompt: Event | null = null

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    showPrompt.value = true
  })
})

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
    class="fixed bottom-24 left-4 right-4 z-50 flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-mundial-dark p-4 shadow-xl lg:hidden"
  >
    <p class="inline-flex items-center gap-2 text-sm">
      <Smartphone class="h-4 w-4 shrink-0 text-mundial-accent" />
      Instala {{ APP_NAME }} en tu celular
    </p>
    <button class="shrink-0 rounded-lg bg-mundial-accent px-3 py-1.5 text-sm font-semibold" @click="install">
      Instalar
    </button>
  </div>
</template>
