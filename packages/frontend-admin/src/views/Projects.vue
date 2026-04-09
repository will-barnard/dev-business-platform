<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <p class="text-sm font-mono text-emerald-400 mb-1">// portfolio</p>
        <h1 class="text-3xl font-bold text-white">Projects</h1>
      </div>
      <RouterLink to="/projects/new" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Add Project
      </RouterLink>
    </div>

    <div v-if="loading" class="text-center py-20">
      <div class="inline-block w-6 h-6 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
    </div>

    <div v-else-if="projects.length === 0" class="text-center py-20 rounded-xl border border-dashed border-slate-800">
      <svg class="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      <p class="text-slate-500 mb-4">No projects yet</p>
      <RouterLink to="/projects/new" class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">Create your first project →</RouterLink>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="project in projects"
        :key="project.id"
        class="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 transition-colors"
      >
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-16 h-10 rounded bg-slate-800 overflow-hidden shrink-0">
            <img v-if="project.images?.length" :src="project.images[0]" class="w-full h-full object-cover" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-medium text-white truncate">{{ project.title }}</h3>
              <span v-if="project.is_major" class="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Major
              </span>
            </div>
            <p class="text-xs text-slate-500 truncate mt-0.5">{{ project.url || 'No URL' }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xs text-slate-600 font-mono">Order: {{ project.display_order }}</span>
          <RouterLink :to="`/projects/${project.id}`" class="p-2 text-slate-400 hover:text-white transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </RouterLink>
          <button @click="deleteProject(project.id)" class="p-2 text-slate-400 hover:text-red-400 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

const projects = ref([]);
const loading = ref(true);

async function fetchProjects() {
  try {
    const res = await fetch('/api/portfolio/projects', { credentials: 'include' });
    if (res.ok) projects.value = await res.json();
  } catch {
    // ignore
  } finally {
    loading.value = false;
  }
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  try {
    const res = await fetch(`/api/portfolio/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      projects.value = projects.value.filter(p => p.id !== id);
    }
  } catch {
    // ignore
  }
}

onMounted(fetchProjects);
</script>
