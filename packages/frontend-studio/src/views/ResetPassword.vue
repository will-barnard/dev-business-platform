<template>
  <div class="min-h-screen flex items-center justify-center pt-20 pb-10 px-6">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-white">Set a new password</h1>
        <p class="mt-2 text-slate-400">Enter your new password below</p>
      </div>

      <div v-if="success" class="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <svg class="w-12 h-12 text-emerald-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <h3 class="text-lg font-semibold text-white">Password Reset!</h3>
        <p class="mt-2 text-sm text-slate-400">Your password has been changed. You can now sign in.</p>
        <RouterLink to="/login" class="mt-6 inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium px-6 py-2.5 rounded-lg transition-colors">
          Sign In
        </RouterLink>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label for="password" class="block text-sm font-medium text-slate-300 mb-2">New Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            placeholder="••••••••"
          />
          <p class="mt-1 text-xs text-slate-500">Must be at least 8 characters</p>
        </div>

        <div>
          <label for="confirm" class="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
          <input
            id="confirm"
            v-model="confirmPassword"
            type="password"
            required
            autocomplete="new-password"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            placeholder="••••••••"
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
          {{ submitting ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, RouterLink } from 'vue-router';

const route = useRoute();
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const submitting = ref(false);
const success = ref(false);

async function handleSubmit() {
  error.value = '';

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }

  submitting.value = true;
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: route.query.token,
        password: password.value,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Something went wrong');
    }
    success.value = true;
  } catch (e) {
    error.value = e.message;
  } finally {
    submitting.value = false;
  }
}
</script>
