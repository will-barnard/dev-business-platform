<template>
  <div class="pt-28 pb-20 px-6">
    <div class="mx-auto max-w-3xl">
      <p class="text-sm font-mono text-emerald-400 mb-1">// billing</p>
      <h1 class="text-3xl font-bold text-white mb-8">Billing</h1>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <div class="inline-block w-6 h-6 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
      </div>

      <!-- Active subscription -->
      <div v-else-if="subscription && subscription.status === 'active'" class="space-y-6">
        <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Current Plan</h3>
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-xl font-bold text-white capitalize">{{ subscription.tier }}</p>
              <p class="text-sm text-slate-400 capitalize">{{ subscription.billing_interval }} billing</p>
            </div>
            <span class="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 capitalize">
              {{ subscription.status }}
            </span>
          </div>
          <p v-if="subscription.current_period_end" class="text-sm text-slate-500">
            Renews {{ formatDate(subscription.current_period_end) }}
          </p>
        </div>

        <button
          @click="openPortal"
          :disabled="portalLoading"
          class="w-full py-3 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium transition-colors disabled:opacity-50"
        >
          {{ portalLoading ? 'Loading...' : 'Manage Subscription' }}
        </button>
      </div>

      <!-- No subscription -->
      <div v-else class="space-y-8">
        <div class="text-center">
          <svg class="w-10 h-10 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h3 class="text-lg font-semibold text-white mb-2">No active subscription</h3>
          <p class="text-sm text-slate-400 mb-8">Choose a plan to get started.</p>

          <!-- Billing toggle -->
          <div class="flex items-center justify-center gap-3">
            <span :class="['text-sm font-medium transition-colors', interval === 'monthly' ? 'text-white' : 'text-slate-500']">Monthly</span>
            <button
              @click="interval = interval === 'monthly' ? 'yearly' : 'monthly'"
              :class="['relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer', interval === 'yearly' ? 'bg-emerald-500' : 'bg-slate-700']"
            >
              <span :class="['inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform', interval === 'yearly' ? 'translate-x-6' : 'translate-x-1']" />
            </button>
            <span :class="['text-sm font-medium transition-colors', interval === 'yearly' ? 'text-white' : 'text-slate-500']">
              Yearly
              <span class="text-emerald-400 text-xs ml-1">Save 20%</span>
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <button
            v-for="t in tiers"
            :key="tierSlug(t)"
            @click="checkout(tierSlug(t))"
            :disabled="checkoutLoading === tierSlug(t) || !prices[`${tierSlug(t)}_${interval}`]"
            :class="[
              'relative rounded-xl border p-5 text-left transition-all disabled:opacity-40',
              t.highlighted
                ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/10 sm:-translate-y-2'
                : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
            ]"
          >
            <div v-if="t.highlighted" class="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider whitespace-nowrap">
              Recommended
            </div>
            <p class="text-sm font-semibold text-white">{{ t.name }}</p>
            <div class="mt-2 flex items-baseline gap-0.5">
              <template v-if="currentPrice(t)">
                <span class="text-xs text-slate-500">$</span>
                <span class="text-2xl font-bold text-white">{{ currentPrice(t) }}</span>
                <span class="text-xs text-slate-500">/{{ interval === 'monthly' ? 'mo' : 'yr' }}</span>
              </template>
              <span v-else class="text-lg font-semibold text-white">Custom</span>
            </div>
            <p v-if="t.description" class="text-xs text-slate-500 mt-2 line-clamp-2">{{ t.description }}</p>
            <div :class="[
              'mt-4 py-2 rounded-lg text-center text-sm font-medium transition-colors',
              t.highlighted
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-slate-300'
            ]">
              {{ currentPrice(t) ? 'Get Started' : 'Contact Us' }}
            </div>
            <span v-if="checkoutLoading === tierSlug(t)" class="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/60">
              <span class="w-5 h-5 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
            </span>
          </button>
        </div>
      </div>

      <p v-if="error" class="mt-4 text-sm text-red-400 text-center">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const subscription = ref(null);
const prices = ref({});
const tiers = ref([]);
const loading = ref(true);
const error = ref('');
const checkoutLoading = ref(null);
const portalLoading = ref(false);
const interval = ref('monthly');

async function loadData() {
  try {
    const [subRes, priceRes, settingsRes] = await Promise.all([
      fetch('/api/billing/subscription', { credentials: 'include' }),
      fetch('/api/billing/prices'),
      fetch('/api/settings'),
    ]);
    if (subRes.ok) subscription.value = await subRes.json();
    if (priceRes.ok) prices.value = await priceRes.json();
    if (settingsRes.ok) {
      const s = await settingsRes.json();
      if (s.pricing) tiers.value = s.pricing;
    }
  } catch {
    error.value = 'Failed to load billing info';
  } finally {
    loading.value = false;
  }
}

function tierSlug(t) {
  return t.slug || t.name?.toLowerCase();
}

function currentPrice(t) {
  const p = interval.value === 'yearly' ? t.price_yearly : t.price_monthly;
  return p || null;
}

async function checkout(tier) {
  const priceId = prices.value[`${tier}_${interval.value}`];
  if (!priceId) return;

  checkoutLoading.value = tier;
  error.value = '';
  try {
    const res = await fetch('/api/billing/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ priceId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed');
    window.location.href = data.url;
  } catch (err) {
    error.value = err.message;
    checkoutLoading.value = null;
  }
}

async function openPortal() {
  portalLoading.value = true;
  error.value = '';
  try {
    const res = await fetch('/api/billing/portal-session', {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Portal failed');
    window.location.href = data.url;
  } catch (err) {
    error.value = err.message;
    portalLoading.value = false;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

onMounted(() => {
  // Accept tier/interval from query params (from root pricing page)
  if (route.query.tier) {
    const tier = route.query.tier;
    if (route.query.interval) interval.value = route.query.interval;
    // Auto-checkout after prices load
    loadData().then(() => {
      if (!subscription.value?.status || subscription.value.status !== 'active') {
        checkout(tier);
      }
    });
  } else {
    loadData();
  }
});
</script>
