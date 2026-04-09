<template>
  <div class="min-h-screen flex items-center justify-center pt-20 pb-10 px-6">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-white">Reset your password</h1>
        <p class="mt-2 text-slate-400">Enter your email and we'll send you a reset link</p>
      </div>

      <div v-if="sent" class="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <svg class="w-12 h-12 text-emerald-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h3 class="text-lg font-semibold text-white">Check your email</h3>
        <p class="mt-2 text-sm text-slate-400">If an account with that email exists, we've sent a password reset link.</p>
        <RouterLink to="/login" class="mt-6 inline-block text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          Back to login
        </RouterLink>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label for="email" class="block text-sm font-medium text-slate-300 mb-2">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div v-if="error" class="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold py-3 rounded-lg transition-colors"
        >
          {{ submitting ? 'Sending...' : 'Send Reset Link' }}
        </button>

        <p class="text-center">
          <RouterLink to="/login" class="text-sm text-slate-500 hover:text-slate-300 transition-colors">Back to login</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const email = ref('');
const error = ref('');
const submitting = ref(false);
const sent = ref(false);

async function handleSubmit() {
  error.value = '';
  submitting.value = true;
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Something went wrong');
    }
    sent.value = true;
  } catch (e) {
    error.value = e.message;
  } finally {
    submitting.value = false;
  }
}
</script>
