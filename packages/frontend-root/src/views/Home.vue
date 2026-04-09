<template>
  <div>
    <!-- Hero Section -->
    <section class="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div class="relative mx-auto max-w-6xl px-6 text-center">
        <div class="inline-flex items-center gap-2 text-sm font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8">
          <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Available for projects
        </div>

        <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
          {{ hero.headline || 'I Build Digital Experiences' }}
        </h1>

        <p class="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {{ hero.subheadline || 'Full-stack developer specializing in modern web applications that are fast, accessible, and built to last.' }}
        </p>

        <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <RouterLink
            to="/portfolio"
            class="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-8 py-3.5 rounded-lg transition-colors text-center"
          >
            {{ hero.cta_primary || 'View My Work' }}
          </RouterLink>
          <RouterLink
            to="/contact"
            class="w-full sm:w-auto border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium px-8 py-3.5 rounded-lg transition-colors text-center"
          >
            {{ hero.cta_secondary || 'Get in Touch' }}
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Featured Projects -->
    <section v-if="majorProjects.length > 0" class="py-20 border-t border-slate-800/50">
      <div class="mx-auto max-w-6xl px-6">
        <div class="flex items-end justify-between mb-12">
          <div>
            <p class="text-sm font-mono text-emerald-400 mb-2">// featured work</p>
            <h2 class="text-3xl font-bold text-white">Major Projects</h2>
          </div>
          <RouterLink to="/portfolio" class="hidden sm:inline-flex items-center gap-1 text-sm text-slate-400 hover:text-emerald-400 transition-colors">
            View all
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </RouterLink>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProjectCard v-for="project in majorProjects" :key="project.id" :project="project" />
        </div>
      </div>
    </section>

    <!-- Services overview -->
    <section class="py-20 border-t border-slate-800/50">
      <div class="mx-auto max-w-6xl px-6">
        <div class="text-center mb-12">
          <p class="text-sm font-mono text-emerald-400 mb-2">// what I do</p>
          <h2 class="text-3xl font-bold text-white">Built for the Modern Web</h2>
          <p class="mt-4 text-slate-400 max-w-xl mx-auto">From concept to deployment, I deliver web solutions that are performant, scalable, and maintainable.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="service in services" :key="service.title" class="p-6 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4" v-html="service.icon" />
            <h3 class="text-lg font-semibold text-white mb-2">{{ service.title }}</h3>
            <p class="text-sm text-slate-400 leading-relaxed">{{ service.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-20 border-t border-slate-800/50">
      <div class="mx-auto max-w-6xl px-6 text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-white">Ready to build something great?</h2>
        <p class="mt-4 text-slate-400 max-w-lg mx-auto">Let's discuss your project and find the right solution for your needs.</p>
        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <RouterLink to="/contact" class="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-8 py-3.5 rounded-lg transition-colors">
            Start a Conversation
          </RouterLink>
          <RouterLink to="/pricing" class="w-full sm:w-auto border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium px-8 py-3.5 rounded-lg transition-colors">
            View Pricing
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import ProjectCard from '../components/ProjectCard.vue';

const projects = ref([]);
const hero = ref({});

const majorProjects = computed(() => projects.value.filter(p => p.is_major));

const services = [
  {
    title: 'Frontend Development',
    description: 'Modern, responsive interfaces built with Vue, React, and cutting-edge web technologies.',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>',
  },
  {
    title: 'Backend & APIs',
    description: 'Robust server-side solutions with Node.js, Express, PostgreSQL, and scalable architecture.',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>',
  },
  {
    title: 'Full-Stack Solutions',
    description: 'End-to-end web applications with authentication, payments, real-time features, and deployment.',
    icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>',
  },
];

onMounted(async () => {
  try {
    const [projectsRes, settingsRes] = await Promise.all([
      fetch('/api/portfolio/projects'),
      fetch('/api/settings'),
    ]);
    if (projectsRes.ok) projects.value = await projectsRes.json();
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      if (settings.hero) hero.value = settings.hero;
    }
  } catch {
    // fail silently on public page
  }
});
</script>
