<template>
  <aside class="fixed left-0 top-0 bottom-0 w-64 border-r border-slate-800/50 bg-slate-950 flex flex-col z-40 hidden lg:flex">
    <!-- Logo -->
    <div class="px-6 py-5 border-b border-slate-800/50">
      <a :href="rootUrl" class="text-lg font-semibold tracking-tight text-white">
        <span class="text-emerald-400 font-mono">&lt;</span>WB<span class="text-emerald-400 font-mono">/&gt;</span>
        <span class="text-sm font-normal text-slate-500 ml-2">Admin</span>
      </a>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
        :class="isActive(item.to)
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'"
      >
        <span v-html="item.icon" class="w-5 h-5" />
        {{ item.label }}
        <span v-if="item.badge" class="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-mono">
          {{ item.badge }}
        </span>
      </RouterLink>
    </nav>

    <!-- Footer -->
    <div class="px-4 py-4 border-t border-slate-800/50">
      <div class="flex items-center gap-3 px-3 py-2">
        <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-semibold">
          {{ auth.user?.name?.charAt(0) || 'A' }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-white truncate">{{ auth.user?.name }}</p>
          <p class="text-xs text-slate-500 truncate">{{ auth.user?.email }}</p>
        </div>
      </div>
      <button
        @click="handleLogout"
        class="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        Sign Out
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink, useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const rootUrl = import.meta.env.VITE_ROOT_URL || 'https://will-barnard.com';
const unreadCount = ref(0);

const navItems = ref([
  {
    to: '/',
    label: 'Dashboard',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>',
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>',
  },
  {
    to: '/messages',
    label: 'Messages',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>',
    badge: null,
  },
  {
    to: '/users',
    label: 'Users',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',
  },
  {
    to: '/build-purchases',
    label: 'Builds',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>',
    badge: null,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',
  },
]);

function isActive(path) {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}

async function handleLogout() {
  await auth.logout();
  router.push('/login');
}

onMounted(async () => {
  try {
    const res = await fetch('/api/contact', { credentials: 'include' });
    if (res.ok) {
      const messages = await res.json();
      const unread = messages.filter(m => !m.is_read).length;
      if (unread > 0) {
        const msgItem = navItems.value.find(i => i.to === '/messages');
        if (msgItem) msgItem.badge = unread;
      }
    }
  } catch {
    // ignore
  }

  // Builds awaiting fulfillment (paid but not yet delivered/ready).
  try {
    const res = await fetch('/api/billing/admin/build-purchases', { credentials: 'include' });
    if (res.ok) {
      const builds = await res.json();
      const pending = builds.filter(b => b.status === 'paid' && (b.build_status === 'not_started' || b.build_status === 'in_progress')).length;
      if (pending > 0) {
        const item = navItems.value.find(i => i.to === '/build-purchases');
        if (item) item.badge = pending;
      }
    }
  } catch {
    // ignore
  }
});
</script>
