import './assets/main.css'

import { registerSW } from 'virtual:pwa-register'
import { initTheme } from './lib/theme'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import {
  clearStaleChunkReloadFlag,
  reloadForStaleChunks,
} from './lib/chunkLoadRecovery'
import router from './router'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'

initTheme()
clearStaleChunkReloadFlag()

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadForStaleChunks()
})

registerSW({ immediate: true })

const app = createApp(App)
const pinia = createPinia()

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
