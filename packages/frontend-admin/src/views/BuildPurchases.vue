<template>
  <div class="p-8">
    <div class="mb-8">
      <p class="text-sm font-mono text-emerald-400 mb-1">// build fulfillment</p>
      <h1 class="text-3xl font-bold text-white">Build Purchases</h1>
      <p class="mt-2 text-sm text-slate-400 max-w-2xl">
        Clients who have paid for a site build. Move them through the pipeline:
        <span class="text-slate-300">queued</span> →
        <span class="text-slate-300">in progress</span> →
        <span class="text-emerald-400">ready</span> (this emails them to start their subscription) →
        <span class="text-slate-300">delivered</span> (auto-set when they subscribe).
      </p>
    </div>

    <!-- Manual flag form -->
    <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-5 mb-8 max-w-2xl">
      <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Manually flag user as build paid</h3>
      <p class="text-xs text-slate-500 mb-4">
        Use this when the user paid you outside of Stripe (cheque, transfer, in-kind). It creates a build purchase
        record without taking a payment, and lets the user proceed to the subscription step.
      </p>
      <form @submit.prevent="submitManual" class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select v-model="manual.user_id" required class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
            <option value="">Select user…</option>
            <option v-for="u in eligibleUsers" :key="u.id" :value="u.id">
              {{ u.name }} — {{ u.email }}
            </option>
          </select>
          <select v-model="manual.tier" required class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
            <option value="">Select tier…</option>
            <option value="basic">Basic</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select v-model="manual.build_status" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors">
            <option value="not_started">Start as: Queued</option>
            <option value="in_progress">Start as: In progress</option>
            <option value="ready">Start as: Ready (sends email)</option>
            <option value="delivered">Start as: Delivered</option>
          </select>
        </div>
        <div class="flex items-center gap-3">
          <button type="submit" :disabled="manualSaving || !manual.user_id || !manual.tier" class="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-medium px-4 py-2 rounded-lg text-sm transition-colors">
            {{ manualSaving ? 'Flagging…' : 'Flag as Paid' }}
          </button>
          <span v-if="manualMsg" class="text-xs text-emerald-400">{{ manualMsg }}</span>
          <span v-if="manualErr" class="text-xs text-red-400">{{ manualErr }}</span>
        </div>
      </form>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-20">
      <div class="inline-block w-6 h-6 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="purchases.length === 0" class="text-center py-20 rounded-xl border border-dashed border-slate-800">
      <p class="text-slate-500">No build purchases yet</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <div
        v-for="p in purchases"
        :key="p.id"
        class="rounded-xl border border-slate-800 bg-slate-900/30 p-5"
      >
        <div class="flex flex-wrap items-start gap-4 justify-between mb-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-semibold text-white">{{ p.user_name }}</p>
              <span class="text-xs text-slate-500">{{ p.user_email }}</span>
              <span v-if="p.is_manual" class="text-[10px] font-mono bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">manual</span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              <span class="capitalize text-slate-300">{{ p.tier }}</span>
              <span v-if="p.amount_cents"> · {{ formatAmount(p.amount_cents) }}</span>
              · paid {{ formatDate(p.paid_at) }}
              <span v-if="p.build_ready_email_sent_at"> · ready email sent {{ formatDate(p.build_ready_email_sent_at) }}</span>
            </p>
          </div>

          <span :class="['text-xs font-mono px-2 py-0.5 rounded-full border whitespace-nowrap', statusBadge(p.build_status)]">
            {{ statusLabel(p.build_status) }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <label class="text-xs text-slate-500">Update status:</label>
          <select
            :value="p.build_status"
            @change="updateStatus(p, $event.target.value)"
            :disabled="p._saving"
            class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="not_started">Queued</option>
            <option value="in_progress">In progress</option>
            <option value="ready">Ready (send email)</option>
            <option value="delivered">Delivered</option>
          </select>
          <span v-if="p._msg" class="text-xs text-emerald-400">{{ p._msg }}</span>
          <span v-if="p._err" class="text-xs text-red-400">{{ p._err }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const purchases = ref([]);
const users = ref([]);
const loading = ref(true);

const manual = ref({ user_id: '', tier: '', build_status: 'not_started' });
const manualSaving = ref(false);
const manualMsg = ref('');
const manualErr = ref('');

// Users without an existing paid build can be manually flagged.
const eligibleUsers = computed(() => {
  const flagged = new Set(
    purchases.value
      .filter(p => p.status === 'paid')
      .map(p => p.user_id)
  );
  return users.value.filter(u => u.role !== 'admin' && !flagged.has(u.id));
});

function statusLabel(s) {
  return ({
    not_started: 'Queued',
    in_progress: 'In progress',
    ready: 'Ready',
    delivered: 'Delivered',
  })[s] || s;
}
function statusBadge(s) {
  return ({
    not_started: 'bg-slate-800 text-slate-400 border-slate-700',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    ready: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    delivered: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  })[s] || 'bg-slate-800 text-slate-400 border-slate-700';
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatAmount(cents) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

async function loadAll() {
  loading.value = true;
  try {
    const [pRes, uRes] = await Promise.all([
      fetch('/api/billing/admin/build-purchases', { credentials: 'include' }),
      fetch('/api/users', { credentials: 'include' }),
    ]);
    if (pRes.ok) {
      const data = await pRes.json();
      purchases.value = data.map(p => ({ ...p, _saving: false, _msg: '', _err: '' }));
    }
    if (uRes.ok) users.value = await uRes.json();
  } finally {
    loading.value = false;
  }
}

async function updateStatus(p, build_status) {
  if (build_status === p.build_status) return;
  p._saving = true;
  p._msg = '';
  p._err = '';
  try {
    const res = await fetch(`/api/billing/admin/build-purchases/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ build_status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    Object.assign(p, data, { _saving: false, _msg: 'Updated', _err: '' });
    setTimeout(() => { p._msg = ''; }, 2500);
  } catch (err) {
    p._err = err.message;
    p._saving = false;
  }
}

async function submitManual() {
  manualSaving.value = true;
  manualMsg.value = '';
  manualErr.value = '';
  try {
    const res = await fetch('/api/billing/admin/build-purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        user_id: manual.value.user_id,
        tier: manual.value.tier,
        build_status: manual.value.build_status,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    manualMsg.value = 'Flagged!';
    manual.value = { user_id: '', tier: '', build_status: 'not_started' };
    await loadAll();
    setTimeout(() => { manualMsg.value = ''; }, 3000);
  } catch (err) {
    manualErr.value = err.message;
  } finally {
    manualSaving.value = false;
  }
}

onMounted(loadAll);
</script>
