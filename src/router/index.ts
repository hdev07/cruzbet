import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeView.vue'),
      meta: { layout: 'mobile' },
    },
    {
      path: '/match/:id',
      component: () => import('@/views/MatchView.vue'),
      meta: { layout: 'mobile', title: 'Partido' },
    },
    {
      path: '/ranking',
      component: () => import('@/views/RankingView.vue'),
      meta: { layout: 'mobile', title: 'Ranking' },
    },
    {
      path: '/reglas',
      component: () => import('@/views/RulesView.vue'),
      meta: { layout: 'mobile', title: 'Reglas' },
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
    {
      path: '/admin',
      component: () => import('@/views/AdminPanel.vue'),
      meta: { layout: 'mobile', requiresAdmin: true, title: 'Admin' },
    },
    { path: '/partido/:id', redirect: (to) => `/match/${to.params.id}` },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path === '/login' && auth.isLoggedIn) return '/'
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
  if (to.meta.requiresAdmin && !auth.isAdmin) return '/login'
})

export default router
