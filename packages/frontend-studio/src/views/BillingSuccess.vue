<template>
  <div class="pt-28 pb-20 px-6">
    <div class="mx-auto max-w-lg text-center">
      <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-10">
        <svg class="w-16 h-16 text-emerald-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 class="text-2xl font-bold text-white mb-3">Subscription Active</h1>
        <p class="text-slate-400 mb-8">Your payment was successful. Welcome aboard!</p>
        <RouterLink to="/billing" class="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium px-6 py-3 rounded-lg transition-colors">
          View Subscription
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
