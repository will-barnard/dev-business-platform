<template>
  <div class="p-8">
    <div class="mb-8">
      <p class="text-sm font-mono text-emerald-400 mb-1">// settings</p>
      <h1 class="text-3xl font-bold text-white">Site Settings</h1>
    </div>

    <div class="max-w-2xl space-y-8">
      <!-- Hero Settings -->
      <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Hero Section</h3>
        <form @submit.prevent="saveHero" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Headline</label>
            <input v-model="hero.headline" type="text" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Subheadline</label>
            <textarea v-model="hero.subheadline" rows="3" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Primary CTA</label>
              <input v-model="hero.cta_primary" type="text" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Secondary CTA</label>
              <input v-model="hero.cta_secondary" type="text" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button type="submit" :disabled="heroSaving" class="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-medium px-5 py-2 rounded-lg transition-colors">
              {{ heroSaving ? 'Saving...' : 'Save Hero' }}
            </button>
            <span v-if="heroMsg" class="text-sm text-emerald-400">{{ heroMsg }}</span>
          </div>
        </form>
      </div>

      <!-- Pricing Settings -->
      <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Pricing Tiers</h3>
        <div class="space-y-6">
          <div v-for="(tier, idx) in pricing" :key="idx" class="p-4 rounded-lg border border-slate-800 bg-slate-950/50">
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm font-medium text-white">Tier {{ idx + 1 }}</span>
              <button type="button" @click="pricing.splice(idx, 1)" class="text-slate-400 hover:text-red-400 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <input v-model="tier.name" type="text" placeholder="Tier name" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
                <input v-model="tier.price" type="text" placeholder="Price" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <input v-model="tier.description" type="text" placeholder="Description" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors" />
              <div>
                <label class="block text-xs text-slate-500 mb-1">Features (one per line)</label>
                <textarea v-model="tier._featuresText" rows="4" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none font-mono" placeholder="Feature 1&#10;Feature 2" />
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="tier.highlighted" type="checkbox" class="w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer" />
                <span class="text-xs text-slate-400">Highlighted (most popular)</span>
              </label>
            </div>
          </div>
          <button type="button" @click="addTier" class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            + Add pricing tier
          </button>
        </div>
        <div class="flex items-center gap-3 mt-6">
          <button @click="savePricing" :disabled="pricingSaving" class="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-medium px-5 py-2 rounded-lg transition-colors">
            {{ pricingSaving ? 'Saving...' : 'Save Pricing' }}
          </button>
          <span v-if="pricingMsg" class="text-sm text-emerald-400">{{ pricingMsg }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const hero = reactive({ headline: '', subheadline: '', cta_primary: '', cta_secondary: '' });
const heroSaving = ref(false);
const heroMsg = ref('');

const pricing = ref([]);
const pricingSaving = ref(false);
const pricingMsg = ref('');

function addTier() {
  pricing.value.push({
    name: '',
    price: '',
    description: '',
    features: [],
    _featuresText: '',
    highlighted: false,
  });
}

async function saveHero() {
  heroSaving.value = true;
  heroMsg.value = '';
  try {
    const res = await fetch('/api/settings/hero', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ value: { ...hero } }),
    });
    if (!res.ok) throw new Error('Failed to save');
    heroMsg.value = 'Saved!';
    setTimeout(() => heroMsg.value = '', 3000);
  } catch {
    heroMsg.value = 'Error saving';
  } finally {
    heroSaving.value = false;
  }
}

async function savePricing() {
  pricingSaving.value = true;
  pricingMsg.value = '';
  try {
    const tiers = pricing.value.map(t => ({
      name: t.name,
      price: t.price,
      description: t.description,
      features: t._featuresText.split('\n').map(f => f.trim()).filter(Boolean),
      highlighted: t.highlighted,
    }));
    const res = await fetch('/api/settings/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ value: tiers }),
    });
    if (!res.ok) throw new Error('Failed to save');
    pricingMsg.value = 'Saved!';
    setTimeout(() => pricingMsg.value = '', 3000);
  } catch {
    pricingMsg.value = 'Error saving';
  } finally {
    pricingSaving.value = false;
  }
}

onMounted(async () => {
  try {
    const res = await fetch('/api/settings/all', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.hero) {
        Object.assign(hero, data.hero.value);
      }
      if (data.pricing) {
        pricing.value = data.pricing.value.map(t => ({
          ...t,
          _featuresText: (t.features || []).join('\n'),
        }));
      }
    }
  } catch {
    // ignore
  }
});
</script>
