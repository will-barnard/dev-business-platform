<template>
  <div class="pt-28 pb-20">
    <div class="mx-auto max-w-3xl px-6">
      <div class="mb-12">
        <p class="text-sm font-mono text-emerald-400 mb-2">// contact</p>
        <h1 class="text-4xl font-bold text-white">Get in Touch</h1>
        <p class="mt-4 text-slate-400">Have a project in mind? I'd love to hear about it.</p>
      </div>

      <div v-if="submitted" class="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <svg class="w-12 h-12 text-emerald-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <h3 class="text-xl font-semibold text-white">Message Sent!</h3>
        <p class="mt-2 text-slate-400">Thanks for reaching out. I'll get back to you as soon as possible.</p>
        <button @click="reset" class="mt-6 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
          Send another message
        </button>
      </div>

      <form v-else @submit.prevent="submit" class="space-y-6">
        <div>
          <label for="name" class="block text-sm font-medium text-slate-300 mb-2">Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            placeholder="Your name"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-slate-300 mb-2">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label for="message" class="block text-sm font-medium text-slate-300 mb-2">Message</label>
          <textarea
            id="message"
            v-model="form.message"
            required
            rows="6"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
            placeholder="Tell me about your project..."
          />
        </div>

        <div v-if="error" class="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold py-3.5 rounded-lg transition-colors"
        >
          {{ submitting ? 'Sending...' : 'Send Message' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const form = reactive({ name: '', email: '', message: '' });
const submitting = ref(false);
const submitted = ref(false);
const error = ref('');

async function submit() {
  error.value = '';
  submitting.value = true;
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to send message');
    }
    submitted.value = true;
  } catch (e) {
    error.value = e.message;
  } finally {
    submitting.value = false;
  }
}

function reset() {
  form.name = '';
  form.email = '';
  form.message = '';
  submitted.value = false;
}
</script>
