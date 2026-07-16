import './assets/main.css'

import { registerSW } from 'virtual:pwa-register'
import { initTheme } from './lib/theme'
import { createApp } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import App from './App.vue'
import {
  clearStaleChunkReloadFlag,
  reloadForStaleChunks,
} from './lib/chunkLoadRecovery'
import router from './router'
import { useAuthStore } from './stores/authStore'
import { usePwaStore } from './stores/pwaStore'
import { useThemeStore } from './stores/themeStore'

initTheme()
clearStaleChunkReloadFlag()

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadForStaleChunks()
})

const app = createApp(App)
const pinia = createPinia()
setActivePinia(pinia)

const pwa = usePwaStore()
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW() {
    pwa.markRegistered()
  },
  onNeedRefresh() {
    pwa.markNeedRefresh()
  },
  onOfflineReady() {
    pwa.markOfflineReady()
  },
})
pwa.setUpdateHandler(updateSW)

app.use(pinia)
app.use(router)

useThemeStore()

const auth = useAuthStore()
await auth.init()

app.mount('#app')

const splash = document.getElementById('app-splash')
if (splash) {
  splash.classList.add('app-splash--out')
  window.setTimeout(() => splash.remove(), 400)
}
