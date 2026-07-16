import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
} from 'vue-router'
import {
  isStaleChunkLoadError,
  reloadForStaleChunks,
} from '@/lib/chunkLoadRecovery'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeView.vue'),
      meta: { layout: 'mobile', title: 'Inicio' },
    },
    {
      path: '/jornadas',
      component: () => import('@/views/BaseQuinielaListView.vue'),
      meta: { layout: 'mobile', title: 'Quiniela' },
    },
    {
      path: '/jornadas/todas',
      component: () => import('@/views/BaseQuinielaAllRoundsView.vue'),
      meta: { layout: 'mobile', title: 'Todas las jornadas' },
    },
    {
      path: '/jornadas/:id',
      component: () => import('@/views/BaseQuinielaRoundView.vue'),
      meta: { layout: 'mobile', title: 'Jornada' },
    },
    {
      path: '/resultados',
      component: () => import('@/views/base/BaseRankingView.vue'),
      meta: { layout: 'mobile', title: 'Resultados', wide: true },
    },
    {
      path: '/ranking',
      redirect: '/resultados',
    },
    {
      path: '/tablas',
      component: () => import('@/views/TablasView.vue'),
      meta: { layout: 'mobile', title: 'Tablas', wide: true },
    },
    {
      path: '/perfil',
      component: () => import('@/views/ProfileView.vue'),
      meta: { layout: 'mobile', requiresAuth: true, title: 'Mi perfil' },
    },
    {
      path: '/login',
      component: () => import('@/views/LoginView.vue'),
      meta: { layout: 'blank', title: 'Entrar' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to: RouteLocationNormalized) => {
  const auth = useAuthStore()
  if (!auth.authReady) await auth.init()
  if (to.path === '/login' && auth.isLoggedIn) return '/'
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
})

router.onError((error) => {
  if (isStaleChunkLoadError(error)) reloadForStaleChunks()
})

export default router
