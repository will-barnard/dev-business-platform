<template>
  <nav class="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
    <div class="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
      <a :href="rootUrl" class="text-xl font-semibold tracking-tight text-white">
        <span class="text-emerald-400 font-mono">&lt;</span>WB<span class="text-emerald-400 font-mono">/&gt;</span>
        <span class="text-sm font-normal text-slate-500 ml-2">Studio</span>
      </a>

      <div v-if="auth.isAuthenticated" class="flex items-center gap-4">
        <RouterLink to="/" class="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</RouterLink>
        <RouterLink to="/messages" class="relative text-sm text-slate-400 hover:text-white transition-colors">
          Messages
          <span v-if="unreadCount > 0" class="absolute -top-1.5 -right-3 text-[10px] font-mono bg-emerald-500 text-slate-950 w-4 h-4 rounded-full flex items-center justify-center">{{ unreadCount }}</span>
        </RouterLink>
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

import { ref, onMounted } from 'vue';

const auth = useAuthStore();
const router = useRouter();
const rootUrl = import.meta.env.VITE_ROOT_URL || 'https://will-barnard.com';
const unreadCount = ref(0);

async function loadUnread() {
  try {
    const res = await fetch('/api/conversations/unread/count', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      unreadCount.value = data.count;
    }
  } catch {}
}

onMounted(() => {
  if (auth.isAuthenticated) loadUnread();
});

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}
</script>
