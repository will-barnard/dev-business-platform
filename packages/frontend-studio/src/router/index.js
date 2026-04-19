import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Login from '../views/Login.vue';

const routes = [
  { path: '/login', name: 'login', component: Login, meta: { guest: true } },
  { path: '/register', name: 'register', component: () => import('../views/Register.vue'), meta: { guest: true } },
  { path: '/forgot-password', name: 'forgot-password', component: () => import('../views/ForgotPassword.vue'), meta: { guest: true } },
  { path: '/reset-password', name: 'reset-password', component: () => import('../views/ResetPassword.vue'), meta: { guest: true } },
  { path: '/', name: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { auth: true } },
  { path: '/profile', name: 'profile', component: () => import('../views/Profile.vue'), meta: { auth: true } },
  { path: '/billing', name: 'billing', component: () => import('../views/Billing.vue'), meta: { auth: true } },
  { path: '/billing/checkout', name: 'billing-checkout', component: () => import('../views/Billing.vue'), meta: { auth: true } },
  { path: '/billing/success', name: 'billing-success', component: () => import('../views/BillingSuccess.vue'), meta: { auth: true } },
  { path: '/billing/cancel', name: 'billing-cancel', component: () => import('../views/BillingCancel.vue'), meta: { auth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (auth.loading) {
    await new Promise(resolve => {
      const unwatch = auth.$subscribe(() => {
        if (!auth.loading) {
          unwatch();
          resolve();
        }
      });
      // Also resolve if already done
      if (!auth.loading) { unwatch(); resolve(); }
    });
  }

  if (to.meta.auth && !auth.isAuthenticated) {
    return { name: 'login' };
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: 'dashboard' };
  }
});

export default router;
