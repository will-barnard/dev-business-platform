<template>
  <div class="pt-28 pb-20 px-6">
    <div class="mx-auto max-w-4xl">
      <div class="mb-10">
        <p class="text-sm font-mono text-emerald-400 mb-1">// dashboard</p>
        <h1 class="text-3xl font-bold text-white">Welcome, {{ auth.user?.name }}</h1>
        <p class="mt-2 text-slate-400">Manage your projects and billing from here.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Account Status -->
        <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Account</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-400">Email</span>
              <span class="text-sm text-white font-mono">{{ auth.user?.email }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-400">Member since</span>
              <span class="text-sm text-white">{{ formatDate(auth.user?.created_at) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-400">Status</span>
              <span class="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
            </div>
          </div>
          <RouterLink to="/profile" class="mt-5 inline-block text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            Edit Profile →
          </RouterLink>
        </div>

        <!-- Billing -->
        <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Billing</h3>
          <div v-if="subscription && subscription.status === 'active'" class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-400">Plan</span>
              <span class="text-sm text-white font-semibold capitalize">{{ subscription.tier }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-400">Billing</span>
              <span class="text-sm text-white capitalize">{{ subscription.billing_interval }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-400">Status</span>
              <span class="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 capitalize">{{ subscription.status }}</span>
            </div>
            <RouterLink to="/billing" class="mt-3 inline-block text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              Manage Billing →
            </RouterLink>
          </div>
          <div v-else class="flex items-center justify-center h-32">
            <div class="text-center">
              <svg class="w-8 h-8 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p class="text-sm text-slate-500">No active subscription</p>
              <RouterLink to="/billing" class="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                Choose a Plan →
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Links</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a :href="rootUrl" class="flex items-center gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors group">
              <div class="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              </div>
              <div>
                <p class="text-sm text-white">Main Site</p>
                <p class="text-xs text-slate-500">will-barnard.com</p>
              </div>
            </a>
            <RouterLink to="/profile" class="flex items-center gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors group">
              <div class="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div>
                <p class="text-sm text-white">Profile</p>
                <p class="text-xs text-slate-500">Edit your details</p>
              </div>
            </RouterLink>
            <a :href="rootUrl + '/contact'" class="flex items-center gap-3 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors group">
              <div class="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <div>
                <p class="text-sm text-white">Contact</p>
                <p class="text-xs text-slate-500">Get in touch</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const rootUrl = import.meta.env.VITE_ROOT_URL || 'https://will-barnard.com';
const subscription = ref(null);

onMounted(async () => {
  try {
    const res = await fetch('/api/billing/subscription', { credentials: 'include' });
    if (res.ok) {
      subscription.value = await res.json();
    }
  } catch (e) {
    // Subscription fetch failed silently
  }
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
</script>
