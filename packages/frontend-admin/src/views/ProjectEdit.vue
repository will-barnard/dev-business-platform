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
        <label class="block text-sm font-medium text-slate-300 mb-2">Images</label>
        <div class="space-y-2">
          <div v-for="(img, idx) in form.images" :key="idx" class="flex gap-2 items-center">
            <!-- Thumbnail -->
            <div class="shrink-0 w-10 h-10 rounded-lg border border-slate-700 overflow-hidden bg-slate-900 flex items-center justify-center">
              <img v-if="img" :src="img" class="w-full h-full object-cover" />
              <svg v-else class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <!-- URL input -->
            <input
              v-model="form.images[idx]"
              type="text"
              class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              placeholder="https://example.com/image.jpg"
            />
            <!-- Hidden file input -->
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              class="hidden"
              :ref="el => { if (el) fileInputRefs[idx] = el }"
              @change="e => handleFileUpload(e, idx)"
            />
            <!-- Upload button -->
            <button
              type="button"
              :disabled="!!uploading[idx]"
              @click="fileInputRefs[idx]?.click()"
              class="shrink-0 p-2 text-slate-400 hover:text-emerald-400 disabled:opacity-40 transition-colors"
              title="Upload image file"
            >
              <svg v-if="!uploading[idx]" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            </button>
            <!-- Remove button -->
            <button type="button" @click="form.images.splice(idx, 1)" class="shrink-0 p-2 text-slate-400 hover:text-red-400 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <button type="button" @click="form.images.push('')" class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            + Add image
          </button>
        </div>
        <p v-if="uploadError" class="mt-2 text-xs text-red-400">{{ uploadError }}</p>
      </div>

      <div>
        <label class="flex items-center gap-3 cursor-pointer py-3">
          <input
            v-model="form.is_major"
            type="checkbox"
            class="w-5 h-5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
          />
          <span class="text-sm text-slate-300">
            Major project (featured)
            <span class="block text-xs text-slate-500 mt-0.5">Major projects show as image cards. Other projects show as compact rows.</span>
          </span>
        </label>
        <p class="text-xs text-slate-500 mt-2">
          Display order is set from the <RouterLink to="/projects" class="text-emerald-400 hover:text-emerald-300">Projects list</RouterLink> using the up/down arrows.
        </p>
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
// Note: display_order is intentionally NOT part of this form. It's managed from
// the projects list view via up/down reorder buttons, which call a dedicated
// /reorder endpoint. Including it here would let a stale value clobber the
// list-driven order on every save.
const form = reactive({
  title: '',
  description: '',
  url: '',
  github_url: '',
  images: [],
  is_major: false,
});
const error = ref('');
const saving = ref(false);
const uploadError = ref('');
const uploading = ref([]);
const fileInputRefs = ref([]);

async function handleFileUpload(e, idx) {
  const file = e.target.files?.[0];
  if (!file) return;
  uploading.value[idx] = true;
  uploadError.value = '';
  try {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('/api/portfolio/upload', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    form.images[idx] = data.url;
  } catch (err) {
    uploadError.value = err.message;
  } finally {
    uploading.value[idx] = false;
    e.target.value = '';
  }
}

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
