import {
  createRouter,
  createWebHistory,
  type RouteLocationGeneric,
  type RouteLocationNormalized,
} from 'vue-router'
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
      path: '/quiniela-partido',
      component: () => import('@/views/partido/PartidoHomeView.vue'),
      meta: { layout: 'mobile', title: 'Partidos', quinielaMode: 'partido' },
    },
    {
      path: '/quiniela-partido/ranking',
      component: () => import('@/views/partido/PartidoRankingView.vue'),
      meta: { layout: 'mobile', title: 'Ranking', quinielaMode: 'partido' },
    },
    {
      path: '/quiniela-partido/reglas',
      component: () => import('@/views/RulesView.vue'),
      meta: { layout: 'mobile', title: 'Reglas', quinielaMode: 'partido' },
    },
    {
      path: '/quiniela-partido/historial',
      component: () => import('@/views/partido/PartidoHistorialView.vue'),
      meta: { layout: 'mobile', title: 'Historial', requiresAuth: true, quinielaMode: 'partido' },
    },
    {
      path: '/match/:id',
      component: () => import('@/views/MatchView.vue'),
      meta: { layout: 'mobile', title: 'Partido', quinielaMode: 'partido' },
    },
    {
      path: '/quiniela-base',
      component: () => import('@/views/BaseQuinielaListView.vue'),
      meta: { layout: 'mobile', title: 'Quiniela base', quinielaMode: 'base' },
    },
    {
      path: '/quiniela-base/ranking',
      component: () => import('@/views/base/BaseRankingView.vue'),
      meta: { layout: 'mobile', title: 'Ranking', quinielaMode: 'base' },
    },
    {
      path: '/quiniela-base/reglas',
      component: () => import('@/views/base/BaseRulesView.vue'),
      meta: { layout: 'mobile', title: 'Reglas', quinielaMode: 'base' },
    },
    {
      path: '/quiniela-base/historial',
      component: () => import('@/views/base/BaseHistorialView.vue'),
      meta: { layout: 'mobile', title: 'Historial', requiresAuth: true, quinielaMode: 'base' },
    },
    {
      path: '/quiniela-base/:id',
      component: () => import('@/views/BaseQuinielaRoundView.vue'),
      meta: { layout: 'mobile', title: 'Jornada', quinielaMode: 'base' },
    },
    { path: '/ranking', redirect: '/quiniela-partido/ranking' },
    { path: '/reglas', redirect: '/quiniela-partido/reglas' },
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
      path: '/privacidad',
      component: () => import('@/views/PrivacyView.vue'),
      meta: { layout: 'mobile', title: 'Privacidad' },
    },
    {
      path: '/terminos',
      component: () => import('@/views/TermsView.vue'),
      meta: { layout: 'mobile', title: 'Términos' },
    },
    {
      path: '/admin',
      component: () => import('@/views/AdminPanel.vue'),
      meta: { layout: 'mobile', requiresAdmin: true, title: 'Admin' },
    },
    { path: '/partido/:id', redirect: (to: RouteLocationGeneric) => `/match/${to.params.id}` },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to: RouteLocationNormalized) => {
  const auth = useAuthStore()
  if (to.path === '/login' && auth.isLoggedIn) return '/'
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
  if (to.meta.requiresAdmin && !auth.isAdmin) return '/login'
})

export default router
