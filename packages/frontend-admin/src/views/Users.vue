<template>
  <div class="p-8">
    <div class="mb-8">
      <p class="text-sm font-mono text-emerald-400 mb-1">// users</p>
      <h1 class="text-3xl font-bold text-white">Users</h1>
    </div>

    <div v-if="loading" class="text-center py-20">
      <div class="inline-block w-6 h-6 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
    </div>

    <div v-else-if="users.length === 0" class="text-center py-20 rounded-xl border border-dashed border-slate-800">
      <svg class="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      <p class="text-slate-500">No users registered yet</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="user in users"
        :key="user.id"
        class="rounded-xl border border-slate-800 bg-slate-900/30 p-5"
      >
        <div class="flex items-start justify-between gap-4 mb-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-semibold shrink-0">
              {{ user.name?.charAt(0) || '?' }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-semibold text-white truncate">{{ user.name }}</p>
                <span v-if="user.role === 'admin'" class="text-[10px] font-mono bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">admin</span>
              </div>
              <p class="text-xs text-slate-500 truncate">{{ user.email }}</p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <!-- Build badge -->
            <span
              v-if="user.build_payment_status === 'paid'"
              :class="[
                'text-xs font-mono px-2 py-0.5 rounded-full border whitespace-nowrap',
                user.build_status === 'ready'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : user.build_status === 'delivered'
                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              ]"
              :title="user.build_is_manual ? 'Manually flagged' : 'Stripe payment'"
            >
              build: {{ buildLabel(user.build_status) }}<span v-if="user.build_is_manual"> · manual</span>
            </span>

            <!-- Subscription badge -->
            <span v-if="user.sub_status === 'active'" class="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 capitalize">
              {{ user.tier }} · {{ user.billing_interval }}
            </span>
            <span v-else class="text-xs font-mono bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-700">
              No plan
            </span>
          </div>
        </div>

        <!-- URL fields -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Website URL</label>
            <input
              v-model="user._websiteUrl"
              @focus="user._editing = true"
              type="url"
              placeholder="https://their-site.com"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Admin Login URL</label>
            <input
              v-model="user._adminUrl"
              @focus="user._editing = true"
              type="url"
              placeholder="https://admin.their-site.com"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-slate-600">Joined {{ formatDate(user.created_at) }}</span>
          <div class="flex items-center gap-2">
            <span v-if="user._msg" class="text-xs text-emerald-400">{{ user._msg }}</span>
            <button
              v-if="user._editing"
              @click="saveUser(user)"
              :disabled="user._saving"
              class="text-xs bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              {{ user._saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const users = ref([]);
const loading = ref(true);

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildLabel(s) {
  return ({
    not_started: 'queued',
    in_progress: 'building',
    ready: 'ready',
    delivered: 'delivered',
  })[s] || s || 'paid';
}

async function saveUser(user) {
  user._saving = true;
  user._msg = '';
  try {
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        website_url: user._websiteUrl,
        admin_url: user._adminUrl,
      }),
    });
    if (!res.ok) throw new Error('Failed');
    user._editing = false;
    user._msg = 'Saved!';
    setTimeout(() => user._msg = '', 3000);
  } catch {
    user._msg = 'Error saving';
  } finally {
    user._saving = false;
  }
}

onMounted(async () => {
  try {
    const res = await fetch('/api/users', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      users.value = data.map(u => ({
        ...u,
        _websiteUrl: u.website_url || '',
        _adminUrl: u.admin_url || '',
        _editing: false,
        _saving: false,
        _msg: '',
      }));
    }
  } catch {
    // ignore
  } finally {
    loading.value = false;
  }
});
</script>
