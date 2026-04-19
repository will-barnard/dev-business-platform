<template>
  <div class="pt-28 pb-20 px-6">
    <div class="mx-auto max-w-lg text-center">
      <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-10">
        <svg class="w-16 h-16 text-slate-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <h1 class="text-2xl font-bold text-white mb-3">Checkout Canceled</h1>
        <p class="text-slate-400 mb-8">No worries — you can subscribe anytime.</p>
        <RouterLink to="/billing" class="inline-block border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium px-6 py-3 rounded-lg transition-colors">
          Back to Billing
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
