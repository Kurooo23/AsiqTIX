// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import Login from '@/views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',      name: 'login', component: Login },
    { path: '/home',  name: 'home',  component: HomeView, meta: { requiresWallet: true } },
    { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
    { path: '/:pathMatch(.*)*', redirect: { name: 'login' } },
  ],
})

/** Guard sederhana:
 *  Izinkan rute yang memerlukan login jika ada token ATAU walletAddress.
 *  (Token dari backend lebih disarankan; walletAddress cadangan.)
 */
router.beforeEach((to) => {
  if (!to.meta.requiresWallet) return true
  const hasToken = !!localStorage.getItem('auth_token')
  const hasAddr  = !!localStorage.getItem('walletAddress')
  if (hasToken || hasAddr) return true
  return { name: 'login' }
})

export default router
