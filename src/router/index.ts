import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    name: 'home',
    path: '/',
    component: () => import('@/views/Home/index.vue')
  },
  {
    name: 'about',
    path: '/about',
    component: () => import('@/views/About/index.vue')
  }
]

const router = createRouter({
  routes,
  history: createWebHistory()
})

export default router