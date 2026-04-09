<template>
  <div class="pt-28 pb-20">
    <div class="mx-auto max-w-6xl px-6">
      <div class="mb-12">
        <p class="text-sm font-mono text-emerald-400 mb-2">// portfolio</p>
        <h1 class="text-4xl font-bold text-white">My Work</h1>
        <p class="mt-4 text-slate-400 max-w-xl">A collection of projects I've built for clients and personal exploration.</p>
      </div>

      <!-- Major Projects -->
      <div v-if="majorProjects.length > 0" class="mb-16">
        <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <span class="w-2 h-2 bg-emerald-400 rounded-full" />
          Major Projects
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProjectCard v-for="project in majorProjects" :key="project.id" :project="project" />
        </div>
      </div>

      <!-- Other Projects -->
      <div v-if="otherProjects.length > 0">
        <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <span class="w-2 h-2 bg-slate-500 rounded-full" />
          Other Projects
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProjectCard v-for="project in otherProjects" :key="project.id" :project="project" />
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!loading && majorProjects.length === 0 && otherProjects.length === 0" class="text-center py-20">
        <p class="text-slate-500">Projects coming soon.</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <div class="inline-block w-6 h-6 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ProjectCard from '../components/ProjectCard.vue';

const projects = ref([]);
const loading = ref(true);

const majorProjects = computed(() => projects.value.filter(p => p.is_major));
const otherProjects = computed(() => projects.value.filter(p => !p.is_major));

onMounted(async () => {
  try {
    const res = await fetch('/api/portfolio/projects');
    if (res.ok) projects.value = await res.json();
  } catch {
    // fail silently
  } finally {
    loading.value = false;
  }
});
</script>
