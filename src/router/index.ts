import {
  createRouter,
  createWebHistory,
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
      path: '/mundial',
      component: () => import('@/views/MundialView.vue'),
      meta: { layout: 'mobile', title: 'Mundial' },
    },
    {
      path: '/grupos',
      component: () => import('@/views/partido/PartidoGruposView.vue'),
      meta: { layout: 'mobile', title: 'Grupos' },
    },
    {
      path: '/eliminatoria',
      component: () => import('@/views/partido/PartidoEliminatoriaView.vue'),
      meta: { layout: 'mobile', title: 'Eliminatoria' },
    },
    {
      path: '/jornadas',
      component: () => import('@/views/BaseQuinielaListView.vue'),
      meta: { layout: 'mobile', title: 'Jornadas' },
    },
    {
      path: '/jornadas/todas',
      component: () => import('@/views/BaseQuinielaAllRoundsView.vue'),
      meta: { layout: 'mobile', title: 'Jornadas' },
    },
    {
      path: '/jornadas/:id',
      component: () => import('@/views/BaseQuinielaRoundView.vue'),
      meta: { layout: 'mobile', title: 'Jornada' },
    },
    {
      path: '/ranking',
      component: () => import('@/views/base/BaseRankingView.vue'),
      meta: { layout: 'mobile', title: 'Ranking' },
    },
    {
      path: '/reglas',
      component: () => import('@/views/base/BaseRulesView.vue'),
      meta: { layout: 'mobile', title: 'Reglas' },
    },
    {
      path: '/historial',
      component: () => import('@/views/base/BaseHistorialView.vue'),
      meta: { layout: 'mobile', title: 'Historial', requiresAuth: true },
    },
    {
      path: '/resultados',
      component: () => import('@/views/base/BaseRoundResultsView.vue'),
      meta: { layout: 'mobile', title: 'Resultados' },
    },
    // Redirecciones de URLs antiguas
    { path: '/quiniela-base', redirect: '/jornadas' },
    { path: '/quiniela-base/jornadas', redirect: '/jornadas/todas' },
    { path: '/quiniela-base/ranking', redirect: '/ranking' },
    { path: '/quiniela-base/reglas', redirect: '/reglas' },
    { path: '/quiniela-base/historial', redirect: '/historial' },
    { path: '/quiniela-base/resultados', redirect: '/resultados' },
    { path: '/quiniela-base/:id', redirect: (to) => `/jornadas/${to.params.id}` },
    { path: '/quiniela-partido', redirect: '/jornadas' },
    { path: '/quiniela-partido/grupos', redirect: '/grupos' },
    { path: '/quiniela-partido/ranking', redirect: '/ranking' },
    { path: '/quiniela-partido/reglas', redirect: '/reglas' },
    { path: '/quiniela-partido/historial', redirect: '/historial' },
    { path: '/match/:id', redirect: '/' },
    { path: '/partido/:id', redirect: '/' },
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
      meta: { layout: 'mobile', requiresAdmin: true, title: 'Admin', hideBottomNav: true },
    },
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
