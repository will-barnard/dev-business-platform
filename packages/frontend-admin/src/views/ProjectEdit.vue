<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-8">
      <RouterLink to="/projects" class="text-slate-400 hover:text-white transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      </RouterLink>
      <div>
        <p class="text-sm font-mono text-emerald-400 mb-1">// {{ isNew ? 'new project' : 'edit project' }}</p>
        <h1 class="text-3xl font-bold text-white">{{ isNew ? 'Add Project' : 'Edit Project' }}</h1>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="max-w-2xl space-y-6">
      <div>
        <label for="title" class="block text-sm font-medium text-slate-300 mb-2">Title *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          placeholder="Project title"
        />
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-slate-300 mb-2">Description</label>
        <textarea
          id="description"
          v-model="form.description"
          rows="4"
          class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
          placeholder="Describe the project..."
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="url" class="block text-sm font-medium text-slate-300 mb-2">Live URL</label>
          <input
            id="url"
            v-model="form.url"
            type="url"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            placeholder="https://example.com"
          />
        </div>
        <div>
          <label for="github_url" class="block text-sm font-medium text-slate-300 mb-2">GitHub URL</label>
          <input
            id="github_url"
            v-model="form.github_url"
            type="url"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            placeholder="https://github.com/..."
          />
        </div>
      </div>

      <!-- Images -->
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Image URLs</label>
        <div class="space-y-2">
          <div v-for="(img, idx) in form.images" :key="idx" class="flex gap-2">
            <input
              v-model="form.images[idx]"
              type="url"
              class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="https://example.com/image.png"
            />
            <button type="button" @click="form.images.splice(idx, 1)" class="p-2 text-slate-400 hover:text-red-400 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <button type="button" @click="form.images.push('')" class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            + Add image URL
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="display_order" class="block text-sm font-medium text-slate-300 mb-2">Display Order</label>
          <input
            id="display_order"
            v-model.number="form.display_order"
            type="number"
            class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            placeholder="0"
          />
        </div>
        <div class="flex items-end">
          <label class="flex items-center gap-3 cursor-pointer py-3">
            <input
              v-model="form.is_major"
              type="checkbox"
              class="w-5 h-5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
            />
            <span class="text-sm text-slate-300">Major project (featured)</span>
          </label>
        </div>
      </div>

      <div v-if="error" class="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
        {{ error }}
      </div>

      <div class="flex items-center gap-3 pt-2">
        <button
          type="submit"
          :disabled="saving"
          class="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {{ saving ? 'Saving...' : (isNew ? 'Create Project' : 'Save Changes') }}
        </button>
        <RouterLink to="/projects" class="text-sm text-slate-400 hover:text-slate-300 transition-colors px-3 py-2.5">
          Cancel
        </RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';

const route = useRoute();
const router = useRouter();

const isNew = computed(() => route.name === 'project-new');
const form = reactive({
  title: '',
  description: '',
  url: '',
  github_url: '',
  images: [],
  is_major: false,
  display_order: 0,
});
const error = ref('');
const saving = ref(false);

onMounted(async () => {
  if (!isNew.value) {
    try {
      const res = await fetch(`/api/portfolio/projects/${route.params.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        Object.assign(form, {
          title: data.title || '',
          description: data.description || '',
          url: data.url || '',
          github_url: data.github_url || '',
          images: data.images || [],
          is_major: data.is_major || false,
          display_order: data.display_order || 0,
        });
      }
    } catch {
      error.value = 'Failed to load project';
    }
  }
});

async function handleSubmit() {
  error.value = '';
  saving.value = true;
  try {
    const body = {
      ...form,
      images: form.images.filter(url => url.trim()),
    };

    const url = isNew.value ? '/api/portfolio/projects' : `/api/portfolio/projects/${route.params.id}`;
    const method = isNew.value ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to save');
    }

    router.push('/projects');
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>
