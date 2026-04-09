<template>
  <div class="pt-28 pb-20">
    <div class="mx-auto max-w-6xl px-6">
      <div class="text-center mb-16">
        <p class="text-sm font-mono text-emerald-400 mb-2">// pricing</p>
        <h1 class="text-4xl font-bold text-white">Simple, Transparent Pricing</h1>
        <p class="mt-4 text-slate-400 max-w-xl mx-auto">Choose the package that fits your project. Every build includes clean code, responsive design, and thorough testing.</p>
      </div>

      <div v-if="tiers.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div
          v-for="tier in tiers"
          :key="tier.name"
          :class="[
            'relative rounded-xl border p-8 flex flex-col',
            tier.highlighted
              ? 'border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
              : 'border-slate-800 bg-slate-900/30'
          ]"
        >
          <div v-if="tier.highlighted" class="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-mono bg-emerald-500 text-slate-950 px-3 py-1 rounded-full font-semibold">
            Most Popular
          </div>

          <h3 class="text-lg font-semibold text-white">{{ tier.name }}</h3>
          <div class="mt-4 flex items-baseline gap-1">
            <span v-if="tier.price !== 'Custom'" class="text-sm text-slate-500">$</span>
            <span class="text-4xl font-bold text-white">{{ tier.price }}</span>
          </div>
          <p class="mt-3 text-sm text-slate-400 leading-relaxed">{{ tier.description }}</p>

          <ul class="mt-8 space-y-3 flex-1">
            <li v-for="feature in tier.features" :key="feature" class="flex items-start gap-3 text-sm">
              <svg class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-slate-300">{{ feature }}</span>
            </li>
          </ul>

          <RouterLink
            to="/contact"
            :class="[
              'mt-8 block text-center py-3 rounded-lg font-medium transition-colors',
              tier.highlighted
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white'
            ]"
          >
            Get Started
          </RouterLink>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <div class="inline-block w-6 h-6 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

const tiers = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const settings = await res.json();
      if (settings.pricing) tiers.value = settings.pricing;
    }
  } catch {
    // fail silently
  } finally {
    loading.value = false;
  }
});
</script>
