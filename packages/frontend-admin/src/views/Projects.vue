<template>
  <div class="p-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <p class="text-sm font-mono text-emerald-400 mb-1">// portfolio</p>
        <h1 class="text-3xl font-bold text-white">Projects</h1>
      </div>
      <RouterLink to="/projects/new" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Add Project
      </RouterLink>
    </div>

    <div v-if="loading" class="text-center py-20">
      <div class="inline-block w-6 h-6 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
    </div>

    <div v-else-if="projects.length === 0" class="text-center py-20 rounded-xl border border-dashed border-slate-800">
      <svg class="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
      <p class="text-slate-500 mb-4">No projects yet</p>
      <RouterLink to="/projects/new" class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">Create your first project →</RouterLink>
    </div>

    <div v-else class="space-y-10">
      <!-- Major Projects -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-mono text-emerald-400 flex items-center gap-2">
            <span class="w-2 h-2 bg-emerald-400 rounded-full" />
            major projects
            <span class="text-slate-600 normal-case font-normal">— shown with image cards</span>
          </h2>
          <span v-if="reorderMsg.major" class="text-xs text-emerald-400">{{ reorderMsg.major }}</span>
        </div>

        <div v-if="majorProjects.length === 0" class="text-center py-10 rounded-xl border border-dashed border-slate-800 text-sm text-slate-600">
          No major projects yet. Toggle a project to "major" on its edit page.
        </div>
        <div v-else class="space-y-2">
          <ProjectRow
            v-for="(project, idx) in majorProjects"
            :key="project.id"
            :project="project"
            :index="idx"
            :total="majorProjects.length"
            :reordering="reordering"
            @move="(dir) => move('major', idx, dir)"
            @delete="deleteProject(project.id)"
          />
        </div>
      </section>

      <!-- Other Projects -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-mono text-slate-400 flex items-center gap-2">
            <span class="w-2 h-2 bg-slate-500 rounded-full" />
            other projects
            <span class="text-slate-600 normal-case font-normal">— shown as compact rows</span>
          </h2>
          <span v-if="reorderMsg.other" class="text-xs text-emerald-400">{{ reorderMsg.other }}</span>
        </div>

        <div v-if="otherProjects.length === 0" class="text-center py-10 rounded-xl border border-dashed border-slate-800 text-sm text-slate-600">
          No other projects.
        </div>
        <div v-else class="space-y-2">
          <ProjectRow
            v-for="(project, idx) in otherProjects"
            :key="project.id"
            :project="project"
            :index="idx"
            :total="otherProjects.length"
            :reordering="reordering"
            @move="(dir) => move('other', idx, dir)"
            @delete="deleteProject(project.id)"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import ProjectRow from '../components/ProjectRow.vue';

const projects = ref([]);
const loading = ref(true);
const reordering = ref(false);
const reorderMsg = reactive({ major: '', other: '' });

const majorProjects = computed(() =>
  projects.value
    .filter(p => p.is_major)
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
);
const otherProjects = computed(() =>
  projects.value
    .filter(p => !p.is_major)
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
);

async function fetchProjects() {
  try {
    const res = await fetch('/api/portfolio/projects', { credentials: 'include' });
    if (res.ok) projects.value = await res.json();
  } catch {
    // ignore
  } finally {
    loading.value = false;
  }
}

// Move a project up or down within its group, then persist the new order to the backend.
async function move(group, idx, dir) {
  if (reordering.value) return;
  const list = group === 'major' ? majorProjects.value : otherProjects.value;
  const targetIdx = idx + (dir === 'up' ? -1 : 1);
  if (targetIdx < 0 || targetIdx >= list.length) return;

  // Build the new order for this group.
  const newOrder = list.slice();
  const [moved] = newOrder.splice(idx, 1);
  newOrder.splice(targetIdx, 0, moved);

  // Optimistically apply locally.
  newOrder.forEach((p, i) => {
    const ref = projects.value.find(x => x.id === p.id);
    if (ref) ref.display_order = i;
  });

  reordering.value = true;
  try {
    const res = await fetch('/api/portfolio/projects/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ids: newOrder.map(p => p.id) }),
    });
    if (!res.ok) throw new Error('Reorder failed');
    reorderMsg[group] = 'Saved';
    setTimeout(() => { reorderMsg[group] = ''; }, 1500);
  } catch {
    reorderMsg[group] = 'Error — refreshing';
    await fetchProjects();
    setTimeout(() => { reorderMsg[group] = ''; }, 2500);
  } finally {
    reordering.value = false;
  }
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  try {
    const res = await fetch(`/api/portfolio/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      projects.value = projects.value.filter(p => p.id !== id);
    }
  } catch {
    // ignore
  }
}

onMounted(fetchProjects);
</script>
