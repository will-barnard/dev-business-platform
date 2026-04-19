<template>
  <div class="pt-28 pb-20">
    <div class="mx-auto max-w-6xl px-6">
      <div class="text-center mb-16">
        <p class="text-sm font-mono text-emerald-400 mb-2">// pricing</p>
        <h1 class="text-4xl font-bold text-white">Simple, Transparent Pricing</h1>
        <p class="mt-4 text-slate-400 max-w-xl mx-auto">Choose the package that fits your project. Every build includes clean code, responsive design, and thorough testing.</p>
      </div>

      <!-- Billing toggle -->
      <div v-if="tiers.length > 0" class="flex items-center justify-center gap-3 mb-12">
        <span :class="['text-sm font-medium', interval === 'monthly' ? 'text-white' : 'text-slate-500']">Monthly</span>
        <button
          @click="interval = interval === 'monthly' ? 'yearly' : 'monthly'"
          :class="['relative w-12 h-6 rounded-full transition-colors', interval === 'yearly' ? 'bg-emerald-500' : 'bg-slate-700']"
        >
          <span :class="['absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform', interval === 'yearly' ? 'translate-x-6' : 'translate-x-0.5']" />
        </button>
        <span :class="['text-sm font-medium', interval === 'yearly' ? 'text-white' : 'text-slate-500']">
          Yearly
          <span class="text-emerald-400 text-xs ml-1">Save 20%</span>
        </span>
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
            <span v-if="getPrice(tier) !== 'Custom'" class="text-sm text-slate-500">$</span>
            <span class="text-4xl font-bold text-white">{{ getPrice(tier) }}</span>
            <span v-if="getPrice(tier) !== 'Custom'" class="text-sm text-slate-500">/{{ interval === 'monthly' ? 'mo' : 'yr' }}</span>
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

          <a
            :href="getCheckoutUrl(tier)"
            :class="[
              'mt-8 block text-center py-3 rounded-lg font-medium transition-colors',
              tier.highlighted
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white'
            ]"
          >
            Get Started
          </a>
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

const tiers = ref([]);
const loading = ref(true);
const interval = ref('monthly');

const studioUrl = import.meta.env.VITE_STUDIO_URL || 'https://studio.will-barnard.com';

function getPrice(tier) {
  if (interval.value === 'yearly' && tier.price_yearly) return tier.price_yearly;
  return tier.price || tier.price_monthly || 'Custom';
}

function getCheckoutUrl(tier) {
  const tierSlug = tier.slug || tier.name?.toLowerCase();
  if (!tierSlug || getPrice(tier) === 'Custom') return `${studioUrl}/billing`;
  return `${studioUrl}/billing/checkout?tier=${tierSlug}&interval=${interval.value}`;
}

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
