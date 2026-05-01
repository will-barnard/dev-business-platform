<template>
  <div class="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 transition-colors">
    <!-- Reorder buttons -->
    <div class="flex flex-col gap-0.5 shrink-0">
      <button
        :disabled="reordering || index === 0"
        @click="$emit('move', 'up')"
        class="p-1 text-slate-500 hover:text-emerald-400 disabled:opacity-20 disabled:hover:text-slate-500 disabled:cursor-not-allowed transition-colors"
        :title="index === 0 ? 'Already first' : 'Move up'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" /></svg>
      </button>
      <button
        :disabled="reordering || index === total - 1"
        @click="$emit('move', 'down')"
        class="p-1 text-slate-500 hover:text-emerald-400 disabled:opacity-20 disabled:hover:text-slate-500 disabled:cursor-not-allowed transition-colors"
        :title="index === total - 1 ? 'Already last' : 'Move down'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" /></svg>
      </button>
    </div>

    <!-- Position -->
    <span class="shrink-0 w-6 text-center text-xs font-mono text-slate-600">
      {{ index + 1 }}
    </span>

    <!-- Thumbnail -->
    <div class="w-16 h-10 rounded bg-slate-800 overflow-hidden shrink-0">
      <img v-if="project.images?.length" :src="project.images[0]" class="w-full h-full object-cover" />
    </div>

    <!-- Title + URL -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h3 class="text-sm font-medium text-white truncate">{{ project.title }}</h3>
        <span v-if="project.is_major" class="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
          major
        </span>
      </div>
      <p class="text-xs text-slate-500 truncate mt-0.5">{{ project.url || 'No URL' }}</p>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1 shrink-0">
      <RouterLink :to="`/projects/${project.id}`" class="p-2 text-slate-400 hover:text-white transition-colors" title="Edit">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
      </RouterLink>
      <button @click="$emit('delete')" class="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';

defineProps({
  project: { type: Object, required: true },
  index: { type: Number, required: true },
  total: { type: Number, required: true },
  reordering: { type: Boolean, default: false },
});

defineEmits(['move', 'delete']);
</script>
