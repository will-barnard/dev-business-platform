import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Login from '../views/Login.vue';

const routes = [
  { path: '/login', name: 'login', component: Login, meta: { guest: true } },
  { path: '/', name: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { admin: true } },
  { path: '/projects', name: 'projects', component: () => import('../views/Projects.vue'), meta: { admin: true } },
  { path: '/projects/new', name: 'project-new', component: () => import('../views/ProjectEdit.vue'), meta: { admin: true } },
  { path: '/projects/:id', name: 'project-edit', component: () => import('../views/ProjectEdit.vue'), meta: { admin: true } },
  { path: '/settings', name: 'settings', component: () => import('../views/Settings.vue'), meta: { admin: true } },
  { path: '/messages', name: 'messages', component: () => import('../views/Messages.vue'), meta: { admin: true } },
  { path: '/users', name: 'users', component: () => import('../views/Users.vue'), meta: { admin: true } },
  { path: '/build-purchases', name: 'build-purchases', component: () => import('../views/BuildPurchases.vue'), meta: { admin: true } },
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
      if (!auth.loading) { unwatch(); resolve(); }
    });
  }

  if (to.meta.admin && (!auth.isAuthenticated || !auth.isAdmin)) {
    return { name: 'login' };
  }
  if (to.meta.guest && auth.isAuthenticated && auth.isAdmin) {
    return { name: 'dashboard' };
  }
});

export default router;
