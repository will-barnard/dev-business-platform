<template>
  <div class="pt-28 pb-20 px-6">
    <div class="mx-auto max-w-3xl">
      <p class="text-sm font-mono text-emerald-400 mb-1">// billing</p>
      <h1 class="text-3xl font-bold text-white mb-8">Billing</h1>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <div class="inline-block w-6 h-6 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
      </div>

      <!-- 1. Active subscription -->
      <div v-else-if="hasActiveSubscription" class="space-y-6">
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

      <!-- 2. Build is ready → prompt to subscribe -->
      <div v-else-if="buildReady" class="space-y-6">
        <div class="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-6 shadow-lg shadow-emerald-500/10">
          <div class="flex items-start gap-3 mb-4">
            <div class="shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-mono text-emerald-400 mb-1">// step 2 of 2</p>
              <h3 class="text-lg font-bold text-white">Your site is built and ready to launch</h3>
              <p class="text-sm text-slate-400 mt-1">
                Start your subscription below to deploy your site and keep it live.
              </p>
            </div>
          </div>
        </div>

        <!-- Recommended tier (the one they paid build for) -->
        <div class="space-y-3">
          <p class="text-xs font-mono text-slate-500 uppercase tracking-wider">Recommended for your build</p>
          <div class="rounded-xl border border-emerald-500/40 bg-slate-900/30 p-5">
            <div class="flex items-baseline justify-between mb-3">
              <p class="text-base font-semibold text-white capitalize">{{ build.tier }}</p>
              <span class="text-xs font-mono text-emerald-400">Build paid</span>
            </div>

            <!-- Billing toggle -->
            <div class="flex items-center justify-center gap-3 my-4">
              <span :class="['text-sm font-medium', interval === 'monthly' ? 'text-white' : 'text-slate-500']">Monthly</span>
              <button
                @click="interval = interval === 'monthly' ? 'yearly' : 'monthly'"
                :class="['relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors cursor-pointer', interval === 'yearly' ? 'bg-emerald-500' : 'bg-slate-700']"
              >
                <span :class="['inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform', interval === 'yearly' ? 'translate-x-5' : 'translate-x-1']" />
              </button>
              <span :class="['text-sm font-medium', interval === 'yearly' ? 'text-white' : 'text-slate-500']">
                Yearly <span class="text-emerald-400 text-xs ml-1">Save 20%</span>
              </span>
            </div>

            <div class="flex items-baseline gap-1 mb-4">
              <template v-if="recommendedSubPrice">
                <span class="text-sm text-slate-500">$</span>
                <span class="text-3xl font-bold text-white">{{ recommendedSubPrice }}</span>
                <span class="text-sm text-slate-500">/{{ interval === 'monthly' ? 'mo' : 'yr' }}</span>
              </template>
              <span v-else class="text-xl font-semibold text-white">Custom</span>
            </div>

            <button
              @click="checkout(build.tier)"
              :disabled="checkoutLoading === build.tier || !prices[`${build.tier}_${interval}`]"
              class="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold transition-colors"
            >
              <template v-if="checkoutLoading === build.tier">Loading…</template>
              <template v-else-if="prices[`${build.tier}_${interval}`]">
                Start Subscription &amp; Go Live
              </template>
              <template v-else>Contact Us</template>
            </button>
          </div>
        </div>
      </div>

      <!-- 3. Build paid but not ready -->
      <div v-else-if="buildInProgress" class="space-y-6">
        <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
          <div class="flex items-start gap-3 mb-4">
            <div class="shrink-0 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
              <svg class="w-5 h-5 text-emerald-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-mono text-emerald-400 mb-1">// step 1 of 2 — in progress</p>
              <h3 class="text-lg font-bold text-white">Your site is being built</h3>
              <p class="text-sm text-slate-400 mt-1">
                We've got your <span class="capitalize font-medium text-slate-300">{{ build.tier }}</span> build payment.
                We'll email you as soon as it's ready to launch — that's when you'll start your subscription.
              </p>
            </div>
          </div>
          <dl class="grid grid-cols-2 gap-4 text-xs border-t border-slate-800 pt-4">
            <div>
              <dt class="text-slate-500">Build status</dt>
              <dd class="text-slate-200 mt-1 capitalize">{{ buildStatusLabel }}</dd>
            </div>
            <div>
              <dt class="text-slate-500">Paid</dt>
              <dd class="text-slate-200 mt-1">{{ formatDate(build.paid_at) }}</dd>
            </div>
          </dl>
        </div>

        <p class="text-xs text-center text-slate-500">
          Questions? Send us a message from the dashboard.
        </p>
      </div>

      <!-- 4. No build paid → step 1: pay build cost -->
      <div v-else class="space-y-8">
        <!-- Header copy explaining the 2-step flow -->
        <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
          <p class="text-xs font-mono text-emerald-400 mb-2">// how it works</p>
          <ol class="space-y-2 text-sm text-slate-300">
            <li class="flex gap-2"><span class="text-emerald-400 font-mono">1.</span> Pay your one-time build cost for the tier you want.</li>
            <li class="flex gap-2"><span class="text-emerald-400 font-mono">2.</span> We design and build your site.</li>
            <li class="flex gap-2"><span class="text-emerald-400 font-mono">3.</span> When it's ready, we email you to start your monthly subscription — that's when your site goes live.</li>
          </ol>
        </div>

        <div class="text-center">
          <h3 class="text-lg font-semibold text-white mb-1">Step 1: Pick your tier</h3>
          <p class="text-sm text-slate-400">Choose a build tier to get started. The subscription kicks in later, after your site is built.</p>
        </div>

        <!-- Subscription billing toggle (informational only at this stage) -->
        <div v-if="tiers.length > 0" class="flex items-center justify-center gap-3">
          <span :class="['text-xs font-medium', interval === 'monthly' ? 'text-white' : 'text-slate-500']">Monthly</span>
          <button
            @click="interval = interval === 'monthly' ? 'yearly' : 'monthly'"
            :class="['relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors cursor-pointer', interval === 'yearly' ? 'bg-emerald-500' : 'bg-slate-700']"
          >
            <span :class="['inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform', interval === 'yearly' ? 'translate-x-5' : 'translate-x-1']" />
          </button>
          <span :class="['text-xs font-medium', interval === 'yearly' ? 'text-white' : 'text-slate-500']">
            Yearly <span class="text-emerald-400 ml-1">Save 20%</span>
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <button
            v-for="t in tiers"
            :key="tierSlug(t)"
            @click="payBuild(tierSlug(t))"
            :disabled="buildCheckoutLoading === tierSlug(t) || !prices[`build_${tierSlug(t)}`]"
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

            <!-- Build cost (primary) -->
            <div class="mt-3 flex items-baseline gap-0.5">
              <template v-if="formatBuildCost(t)">
                <span class="text-xs text-slate-500">$</span>
                <span class="text-2xl font-bold text-white">{{ formatBuildCost(t) }}</span>
                <span class="text-xs text-slate-500 ml-1">build</span>
              </template>
              <span v-else class="text-lg font-semibold text-white">Custom build</span>
            </div>

            <!-- Subscription cost (secondary, informational) -->
            <p class="text-[11px] text-slate-400 mt-2">
              <template v-if="currentPrice(t)">
                Then <span class="font-semibold text-white">${{ currentPrice(t) }}/{{ interval === 'monthly' ? 'mo' : 'yr' }}</span> to keep it live
              </template>
              <template v-else>
                Then <span class="font-semibold text-white">custom</span> subscription
              </template>
            </p>

            <p v-if="t.description" class="text-xs text-slate-500 mt-2 line-clamp-2">{{ t.description }}</p>

            <div :class="[
              'mt-4 py-2 rounded-lg text-center text-sm font-medium transition-colors',
              t.highlighted
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-slate-300'
            ]">
              {{ prices[`build_${tierSlug(t)}`] ? 'Pay Build Cost' : 'Contact Us' }}
            </div>
            <span v-if="buildCheckoutLoading === tierSlug(t)" class="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/60">
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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const subscription = ref(null);
const build = ref(null);
const prices = ref({});
const tiers = ref([]);
const loading = ref(true);
const error = ref('');
const checkoutLoading = ref(null);
const buildCheckoutLoading = ref(null);
const portalLoading = ref(false);
const interval = ref('monthly');

const hasActiveSubscription = computed(
  () => subscription.value && subscription.value.status === 'active'
);
const buildReady = computed(
  () => build.value && build.value.status === 'paid' &&
        (build.value.build_status === 'ready' || build.value.build_status === 'delivered')
);
const buildInProgress = computed(
  () => build.value && build.value.status === 'paid' &&
        (build.value.build_status === 'not_started' || build.value.build_status === 'in_progress')
);

const buildStatusLabel = computed(() => {
  const map = {
    not_started: 'Queued',
    in_progress: 'In progress',
    ready: 'Ready to launch',
    delivered: 'Delivered',
  };
  return map[build.value?.build_status] || build.value?.build_status || '';
});

const recommendedTier = computed(() => {
  if (!build.value?.tier) return null;
  return tiers.value.find(t => tierSlug(t) === build.value.tier) || null;
});
const recommendedSubPrice = computed(() => {
  const t = recommendedTier.value;
  if (!t) return null;
  return interval.value === 'yearly' ? t.price_yearly : t.price_monthly;
});

async function loadData() {
  try {
    const [subRes, buildRes, priceRes, settingsRes] = await Promise.all([
      fetch('/api/billing/subscription', { credentials: 'include' }),
      fetch('/api/billing/build-purchase', { credentials: 'include' }),
      fetch('/api/billing/prices'),
      fetch('/api/settings'),
    ]);
    if (subRes.ok) subscription.value = await subRes.json();
    if (buildRes.ok) build.value = await buildRes.json();
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

function formatBuildCost(t) {
  const raw = t.build_cost;
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;
  const n = Number(String(raw).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toLocaleString('en-US');
}

async function payBuild(tier) {
  if (!prices.value[`build_${tier}`]) return;
  buildCheckoutLoading.value = tier;
  error.value = '';
  try {
    const res = await fetch('/api/billing/create-build-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tier }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Build checkout failed');
    window.location.href = data.url;
  } catch (err) {
    error.value = err.message;
    buildCheckoutLoading.value = null;
  }
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
  // Accept tier/interval/action from query params (root pricing page → studio billing).
  // action=build (default for new entries) auto-starts the build checkout.
  // action=subscribe auto-starts the subscription checkout (only valid when build is ready).
  const queryTier = route.query.tier;
  const action = route.query.action || (queryTier ? 'build' : null);
  if (route.query.interval) interval.value = route.query.interval;

  loadData().then(() => {
    if (!queryTier) return;
    if (action === 'build' && !build.value) {
      payBuild(queryTier);
    } else if (action === 'subscribe' && buildReady.value && !hasActiveSubscription.value) {
      checkout(queryTier);
    }
  });
});
</script>
