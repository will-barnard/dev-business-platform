<template>
  <div class="pt-28 pb-20 px-6">
    <div class="mx-auto max-w-3xl">
      <div class="flex items-center justify-between mb-8">
        <div>
          <p class="text-sm font-mono text-emerald-400 mb-1">// messages</p>
          <h1 class="text-3xl font-bold text-white">Messages</h1>
        </div>
        <button
          v-if="!activeConversation && !showNew"
          @click="showNew = true"
          class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          New Message
        </button>
        <button
          v-if="activeConversation || showNew"
          @click="activeConversation = null; showNew = false"
          class="text-sm text-slate-400 hover:text-white transition-colors"
        >
          ← Back to inbox
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-20">
        <div class="inline-block w-6 h-6 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
      </div>

      <!-- New message form -->
      <div v-else-if="showNew" class="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
        <h3 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">New Conversation</h3>
        <form @submit.prevent="createConversation" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Subject</label>
            <input
              v-model="newSubject"
              type="text"
              placeholder="What's this about?"
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-300 mb-2">Message</label>
            <textarea
              v-model="newMessage"
              rows="4"
              placeholder="Type your message..."
              class="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>
          <div class="flex items-center gap-3">
            <button
              type="submit"
              :disabled="!newMessage.trim() || sending"
              class="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {{ sending ? 'Sending...' : 'Send Message' }}
            </button>
            <button type="button" @click="showNew = false" class="text-sm text-slate-500 hover:text-white transition-colors">Cancel</button>
          </div>
        </form>
      </div>

      <!-- Conversation thread -->
      <div v-else-if="activeConversation" class="space-y-4">
        <div class="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <h3 class="text-sm font-semibold text-white">{{ activeConversation.subject }}</h3>
        </div>

        <div class="space-y-3 max-h-[400px] overflow-y-auto pr-1" ref="messagesContainer">
          <div
            v-for="msg in threadMessages"
            :key="msg.id"
            :class="[
              'rounded-xl p-4 max-w-[85%]',
              msg.sender_role === 'admin'
                ? 'bg-slate-800/50 border border-slate-700 mr-auto'
                : 'bg-emerald-500/10 border border-emerald-500/20 ml-auto'
            ]"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-medium" :class="msg.sender_role === 'admin' ? 'text-slate-300' : 'text-emerald-400'">
                {{ msg.sender_name || 'Unknown' }}
              </span>
              <span v-if="msg.sender_role === 'admin'" class="text-[10px] font-mono bg-slate-700 text-slate-400 px-1 py-0.5 rounded">admin</span>
            </div>
            <p class="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{{ msg.body }}</p>
            <p class="text-xs text-slate-600 mt-2">{{ formatDate(msg.created_at) }}</p>
          </div>
        </div>

        <!-- Reply -->
        <form @submit.prevent="sendReply" class="flex gap-3">
          <input
            v-model="replyText"
            type="text"
            placeholder="Type a reply..."
            class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            @keydown.enter.prevent="sendReply"
          />
          <button
            type="submit"
            :disabled="!replyText.trim() || replying"
            class="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-medium px-5 py-3 rounded-lg transition-colors shrink-0"
          >
            {{ replying ? '...' : 'Send' }}
          </button>
        </form>
      </div>

      <!-- Conversation list (inbox) -->
      <div v-else>
        <div v-if="conversations.length === 0" class="text-center py-20 rounded-xl border border-dashed border-slate-800">
          <svg class="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p class="text-slate-500 mb-3">No conversations yet</p>
          <button @click="showNew = true" class="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            Start a conversation →
          </button>
        </div>

        <div v-else class="space-y-2">
          <button
            v-for="conv in conversations"
            :key="conv.id"
            @click="openConversation(conv)"
            class="w-full text-left rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 p-4 transition-colors"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-semibold text-white truncate">{{ conv.subject }}</p>
                  <span v-if="conv.unread_count > 0" class="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                    {{ conv.unread_count }}
                  </span>
                </div>
                <p class="text-sm text-slate-500 truncate mt-1">{{ conv.last_message }}</p>
              </div>
              <span class="text-xs text-slate-600 whitespace-nowrap shrink-0">{{ formatShortDate(conv.updated_at) }}</span>
            </div>
          </button>
        </div>
      </div>

      <p v-if="error" class="mt-4 text-sm text-red-400 text-center">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';

const conversations = ref([]);
const loading = ref(true);
const error = ref('');

const showNew = ref(false);
const newSubject = ref('');
const newMessage = ref('');
const sending = ref(false);

const activeConversation = ref(null);
const threadMessages = ref([]);
const replyText = ref('');
const replying = ref(false);
const messagesContainer = ref(null);

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

async function loadConversations() {
  try {
    const res = await fetch('/api/conversations', { credentials: 'include' });
    if (res.ok) conversations.value = await res.json();
  } catch {
    error.value = 'Failed to load conversations';
  } finally {
    loading.value = false;
  }
}

async function openConversation(conv) {
  try {
    const res = await fetch(`/api/conversations/${conv.id}`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      activeConversation.value = data.conversation;
      threadMessages.value = data.messages;
      conv.unread_count = 0;
      scrollToBottom();
    }
  } catch {
    error.value = 'Failed to load conversation';
  }
}

async function createConversation() {
  if (!newMessage.value.trim()) return;
  sending.value = true;
  error.value = '';
  try {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        subject: newSubject.value.trim() || 'New message',
        message: newMessage.value.trim(),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to send');
    }
    const conv = await res.json();
    newSubject.value = '';
    newMessage.value = '';
    showNew.value = false;
    await loadConversations();
    // Open the new conversation
    const found = conversations.value.find(c => c.id === conv.id);
    if (found) openConversation(found);
  } catch (err) {
    error.value = err.message;
  } finally {
    sending.value = false;
  }
}

async function sendReply() {
  if (!replyText.value.trim() || !activeConversation.value) return;
  replying.value = true;
  error.value = '';
  try {
    const res = await fetch(`/api/conversations/${activeConversation.value.id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: replyText.value.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to send');
    }
    const msg = await res.json();
    threadMessages.value.push({ ...msg, sender_name: 'You', sender_role: 'client' });
    replyText.value = '';
    scrollToBottom();
  } catch (err) {
    error.value = err.message;
  } finally {
    replying.value = false;
  }
}

onMounted(loadConversations);
</script>
