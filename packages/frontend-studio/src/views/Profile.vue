<template>
  <div class="pt-28 pb-20 px-6">
    <div class="mx-auto max-w-2xl">
      <div class="mb-10">
        <p class="text-sm font-mono text-emerald-400 mb-1">// profile</p>
        <h1 class="text-3xl font-bold text-white">Your Profile</h1>
      </div>

      <!-- Profile Form -->
      <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-6 mb-6">
        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Account Details</h3>
        <form @submit.prevent="updateProfile" class="space-y-5">
          <div>
            <label for="name" class="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
            <input
              id="name"
              v-model="profileForm.name"
              type="text"
              required
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label for="email" class="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              required
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
          <div v-if="profileMsg" :class="['text-sm rounded-lg px-4 py-3', profileSuccess ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20']">
            {{ profileMsg }}
          </div>
          <button
            type="submit"
            :disabled="profileSaving"
            class="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {{ profileSaving ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>
      </div>

      <!-- Change Password -->
      <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Change Password</h3>
        <form @submit.prevent="changePassword" class="space-y-5">
          <div>
            <label for="currentPassword" class="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
            <input
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              type="password"
              required
              autocomplete="current-password"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label for="newPassword" class="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <input
              id="newPassword"
              v-model="passwordForm.newPassword"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <div v-if="passwordMsg" :class="['text-sm rounded-lg px-4 py-3', passwordSuccess ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20']">
            {{ passwordMsg }}
          </div>
          <button
            type="submit"
            :disabled="passwordSaving"
            class="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {{ passwordSaving ? 'Updating...' : 'Update Password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();

const profileForm = reactive({
  name: auth.user?.name || '',
  email: auth.user?.email || '',
});
const profileMsg = ref('');
const profileSuccess = ref(false);
const profileSaving = ref(false);

const passwordForm = reactive({ currentPassword: '', newPassword: '' });
const passwordMsg = ref('');
const passwordSuccess = ref(false);
const passwordSaving = ref(false);

async function updateProfile() {
  profileMsg.value = '';
  profileSaving.value = true;
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(profileForm),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    auth.user = data;
    profileSuccess.value = true;
    profileMsg.value = 'Profile updated';
  } catch (e) {
    profileSuccess.value = false;
    profileMsg.value = e.message;
  } finally {
    profileSaving.value = false;
  }
}

async function changePassword() {
  passwordMsg.value = '';
  passwordSaving.value = true;
  try {
    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(passwordForm),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    passwordSuccess.value = true;
    passwordMsg.value = 'Password updated';
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
  } catch (e) {
    passwordSuccess.value = false;
    passwordMsg.value = e.message;
  } finally {
    passwordSaving.value = false;
  }
}
</script>
