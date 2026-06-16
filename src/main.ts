import './assets/main.css'

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

const auth = useAuthStore()
await auth.init()

app.mount('#app')
