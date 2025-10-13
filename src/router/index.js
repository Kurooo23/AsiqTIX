import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue'
import path from 'node:path'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/', name: 'login', component: Login,
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
