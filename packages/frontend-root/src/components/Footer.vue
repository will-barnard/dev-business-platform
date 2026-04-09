<template>
  <footer class="border-t border-slate-800/50 bg-slate-950">
    <div class="mx-auto max-w-6xl px-6 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <RouterLink to="/" class="text-lg font-semibold text-white">
            <span class="text-emerald-400 font-mono">&lt;</span>WB<span class="text-emerald-400 font-mono">/&gt;</span>
          </RouterLink>
          <p class="mt-3 text-sm text-slate-500 leading-relaxed">
            Building modern, performant web applications with attention to detail and clean code.
          </p>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Navigation</h4>
          <div class="space-y-2">
            <RouterLink to="/" class="block text-sm text-slate-500 hover:text-slate-300 transition-colors">Home</RouterLink>
            <RouterLink to="/portfolio" class="block text-sm text-slate-500 hover:text-slate-300 transition-colors">Portfolio</RouterLink>
            <RouterLink to="/pricing" class="block text-sm text-slate-500 hover:text-slate-300 transition-colors">Pricing</RouterLink>
            <RouterLink to="/contact" class="block text-sm text-slate-500 hover:text-slate-300 transition-colors">Contact</RouterLink>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Connect</h4>
          <div class="space-y-2">
            <a :href="studioUrl + '/register'" class="block text-sm text-slate-500 hover:text-slate-300 transition-colors">Client Portal</a>
            <a href="https://github.com" target="_blank" rel="noopener" class="block text-sm text-slate-500 hover:text-slate-300 transition-colors">GitHub</a>
          </div>
        </div>
      </div>
      <div class="mt-10 pt-6 border-t border-slate-800/50 text-center text-sm text-slate-600">
        &copy; {{ new Date().getFullYear() }} Will Barnard. All rights reserved.
      </div>
    </div>
  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router';
const studioUrl = import.meta.env.VITE_STUDIO_URL || 'https://studio.will-barnard.com';
</script>
