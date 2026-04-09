<template>
  <div class="min-h-screen flex">
    <Sidebar v-if="auth.isAuthenticated && auth.isAdmin" />
    <div class="flex-1 flex flex-col" :class="{ 'lg:ml-64': auth.isAuthenticated && auth.isAdmin }">
      <main class="flex-1">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
import { useAuthStore } from './stores/auth';
import Sidebar from './components/Sidebar.vue';

const auth = useAuthStore();
</script>
