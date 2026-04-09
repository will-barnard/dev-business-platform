<template>
  <nav class="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
    <div class="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
      <a :href="rootUrl" class="text-xl font-semibold tracking-tight text-white">
        <span class="text-emerald-400 font-mono">&lt;</span>WB<span class="text-emerald-400 font-mono">/&gt;</span>
        <span class="text-sm font-normal text-slate-500 ml-2">Studio</span>
      </a>

      <div v-if="auth.isAuthenticated" class="flex items-center gap-4">
        <RouterLink to="/" class="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</RouterLink>
        <RouterLink to="/profile" class="text-sm text-slate-400 hover:text-white transition-colors">Profile</RouterLink>
        <button @click="handleLogout" class="text-sm text-slate-500 hover:text-red-400 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const rootUrl = import.meta.env.VITE_ROOT_URL || 'https://will-barnard.com';

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}
</script>
