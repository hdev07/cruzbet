import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router/index.ts/index.ts'
import { useAuthStore } from './stores/authStore.ts.ts'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const auth = useAuthStore()
auth.init().then(() => {
  app.mount('#app')
})
