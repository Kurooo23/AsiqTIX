import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Register from '../views/Register.vue'
import path from 'node:path'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/', name: 'register', component: Register,
    },
    {
      path: '/home', name: 'home', component: HomeView,
    },
    {
      path: '/about', name: 'about', component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
