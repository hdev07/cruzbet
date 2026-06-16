import './assets/main.css'

import { initTheme } from './lib/theme'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'

import App from './App.vue'
import {
  clearStaleChunkReloadFlag,
  reloadForStaleChunks,
} from './lib/chunkLoadRecovery'
import { pwaNeedRefresh, setApplyPwaUpdate } from './lib/pwaUpdate'
import router from './router'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'

initTheme()
clearStaleChunkReloadFlag()

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  reloadForStaleChunks()
})

setApplyPwaUpdate(
  registerSW({
    immediate: true,
    onNeedRefresh() {
      pwaNeedRefresh.value = true
    },
  }),
)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

useThemeStore()

const auth = useAuthStore()
await auth.init()

app.mount('#app')
