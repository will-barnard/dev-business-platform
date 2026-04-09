<template>
  <div class="p-8">
    <div class="mb-8">
      <p class="text-sm font-mono text-emerald-400 mb-1">// admin dashboard</p>
      <h1 class="text-3xl font-bold text-white">Dashboard</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
        <p class="text-sm text-slate-400">{{ stat.label }}</p>
        <p class="text-2xl font-bold text-white mt-1">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Recent Messages -->
    <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-white">Recent Messages</h2>
        <RouterLink to="/messages" class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">View all →</RouterLink>
      </div>
      <div v-if="recentMessages.length === 0" class="text-center py-8 text-slate-500">
        No messages yet
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="msg in recentMessages"
          :key="msg.id"
          class="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-white">{{ msg.name }}</span>
              <span v-if="!msg.is_read" class="w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
            <p class="text-sm text-slate-400 truncate mt-0.5">{{ msg.message }}</p>
          </div>
          <span class="text-xs text-slate-600 whitespace-nowrap">{{ formatDate(msg.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

const stats = ref([
  { label: 'Total Projects', value: '—' },
  { label: 'Major Projects', value: '—' },
  { label: 'Messages', value: '—' },
  { label: 'Unread', value: '—' },
]);
const recentMessages = ref([]);

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return d.toLocaleDateString();
}

onMounted(async () => {
  try {
    const [projectsRes, messagesRes] = await Promise.all([
      fetch('/api/portfolio/projects', { credentials: 'include' }),
      fetch('/api/contact', { credentials: 'include' }),
    ]);

    if (projectsRes.ok) {
      const projects = await projectsRes.json();
      stats.value[0].value = projects.length;
      stats.value[1].value = projects.filter(p => p.is_major).length;
    }

    if (messagesRes.ok) {
      const messages = await messagesRes.json();
      stats.value[2].value = messages.length;
      stats.value[3].value = messages.filter(m => !m.is_read).length;
      recentMessages.value = messages.slice(0, 5);
    }
  } catch {
    // ignore
  }
});
</script>
