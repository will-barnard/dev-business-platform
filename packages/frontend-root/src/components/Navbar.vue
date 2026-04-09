<template>
  <nav class="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
    <div class="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
      <RouterLink to="/" class="text-xl font-semibold tracking-tight text-white">
        <span class="text-emerald-400 font-mono">&lt;</span>WB<span class="text-emerald-400 font-mono">/&gt;</span>
      </RouterLink>

      <!-- Desktop nav -->
      <div class="hidden md:flex items-center gap-8">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="text-sm text-slate-400 hover:text-white transition-colors"
          active-class="!text-white"
        >
          {{ link.label }}
        </RouterLink>
      </div>

      <div class="hidden md:flex items-center gap-3">
        <a :href="studioUrl + '/login'" class="text-sm text-slate-400 hover:text-white transition-colors px-3 py-2">
          Sign In
        </a>
        <a :href="studioUrl + '/register'" class="text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium px-4 py-2 rounded-lg transition-colors">
          Get Started
        </a>
      </div>

      <!-- Mobile menu button -->
      <button @click="mobileOpen = !mobileOpen" class="md:hidden text-slate-400 hover:text-white">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path v-if="!mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile menu -->
    <div v-if="mobileOpen" class="md:hidden border-t border-slate-800/50 bg-slate-950/95 backdrop-blur-xl">
      <div class="px-6 py-4 space-y-3">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="block text-sm text-slate-400 hover:text-white transition-colors"
          @click="mobileOpen = false"
        >
          {{ link.label }}
        </RouterLink>
        <div class="pt-3 border-t border-slate-800 flex flex-col gap-2">
          <a :href="studioUrl + '/login'" class="text-sm text-slate-400 hover:text-white transition-colors py-2">Sign In</a>
          <a :href="studioUrl + '/register'" class="text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium px-4 py-2 rounded-lg transition-colors text-center">Get Started</a>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const studioUrl = import.meta.env.VITE_STUDIO_URL || 'https://studio.will-barnard.com';
const mobileOpen = ref(false);

const links = [
  { to: '/', label: 'Home' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
];
</script>
