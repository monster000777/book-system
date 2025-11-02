import { createRouter, createWebHistory } from 'vue-router';
import BookManage from '../views/BookManage.vue';

const routes = [
  {
    path: '/',
    name: 'BookManage',
    component: BookManage
  },
  {
    path: '/book/:id',
    name: 'BookDetails',
    component: () => import('../views/BookDetails.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;