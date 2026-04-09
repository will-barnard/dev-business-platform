import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/portfolio', name: 'portfolio', component: () => import('../views/Portfolio.vue') },
  { path: '/pricing', name: 'pricing', component: () => import('../views/Pricing.vue') },
  { path: '/contact', name: 'contact', component: () => import('../views/Contact.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
