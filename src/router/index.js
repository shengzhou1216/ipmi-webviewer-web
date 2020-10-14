import Vue from 'vue'
import Router from 'vue-router'
const routes = [
    {
        path: '/',
        name: 'index',
        component: () => import('@/views/index.vue')
    },
    {
      path: '/:ip/info',
      name: 'info',
      component: () => import('@/views/info.vue')
    }
]

Vue.use(Router)

const router = new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: routes
})

export default router