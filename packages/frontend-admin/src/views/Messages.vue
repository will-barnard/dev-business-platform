<template>
  <div class="p-8">
    <div class="mb-8">
      <p class="text-sm font-mono text-emerald-400 mb-1">// messages</p>
      <h1 class="text-3xl font-bold text-white">Contact Messages</h1>
    </div>

    <div v-if="loading" class="text-center py-20">
      <div class="inline-block w-6 h-6 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
    </div>

    <div v-else-if="messages.length === 0" class="text-center py-20 rounded-xl border border-dashed border-slate-800">
      <svg class="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
      <p class="text-slate-500">No messages yet</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="[
          'rounded-xl border p-5 transition-colors',
          msg.is_read ? 'border-slate-800 bg-slate-900/20' : 'border-slate-700 bg-slate-900/50'
        ]"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-white">{{ msg.name }}</span>
              <span v-if="!msg.is_read" class="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">New</span>
            </div>
            <a :href="'mailto:' + msg.email" class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">{{ msg.email }}</a>
            <p class="mt-3 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{{ msg.message }}</p>
            <p class="mt-3 text-xs text-slate-600">{{ formatDate(msg.created_at) }}</p>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button
              v-if="!msg.is_read"
              @click="markRead(msg)"
              class="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
              title="Mark as read"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            </button>
            <button
              @click="deleteMessage(msg.id)"
              class="p-2 text-slate-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const messages = ref([]);
const loading = ref(true);

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

async function markRead(msg) {
  try {
    const res = await fetch(`/api/contact/${msg.id}/read`, {
      method: 'PUT',
      credentials: 'include',
    });
    if (res.ok) msg.is_read = true;
  } catch {
    // ignore
  }
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  try {
    const res = await fetch(`/api/contact/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      messages.value = messages.value.filter(m => m.id !== id);
    }
  } catch {
    // ignore
  }
}

onMounted(async () => {
  try {
    const res = await fetch('/api/contact', { credentials: 'include' });
    if (res.ok) messages.value = await res.json();
  } catch {
    // ignore
  } finally {
    loading.value = false;
  }
});
</script>
