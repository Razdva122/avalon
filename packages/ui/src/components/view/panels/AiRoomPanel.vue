<template>
  <section v-if="ai" class="ai-panel" aria-label="AI match">
    <strong>AI Avalon · 7 players</strong>
    <p aria-live="polite">{{ ai.message }}</p>
    <small
      >English discussion · Unranked · {{ ai.costRub.toFixed(2) }} ₽ used / reserved · {{ ai.fallbacks }} fallback
      actions</small
    >
    <div v-if="canManage" class="ai-controls">
      <v-btn v-if="ai.status === 'ready'" color="success" :loading="busy" @click="control('start')"
        >Start AI match</v-btn
      >
      <v-btn
        v-if="['ready', 'running', 'paused'].includes(ai.status)"
        color="warning"
        :disabled="busy"
        @click="control('stop')"
        >Stop</v-btn
      >
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
  </section>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useStore } from '@/store';
import { socket } from '@/api/socket';
import type { AiRoomState } from '@avalon/types';
const props = defineProps<{ ai: AiRoomState; roomID: string }>();
const store = useStore();
const canManage = ref(false);
const busy = ref(false);
const error = ref('');
watch(
  () => store.state.profile?.id,
  async () => {
    try {
      canManage.value = (await socket.timeout(5000).emitWithAck('getAiRoomAccess')).canManage;
    } catch {
      canManage.value = false;
    }
  },
  { immediate: true },
);
async function control(action: 'start' | 'stop') {
  busy.value = true;
  error.value = '';
  try {
    const result = await socket.timeout(10000).emitWithAck('controlAiRoom', props.roomID, action);
    if ('error' in result) error.value = result.error;
  } catch {
    error.value = 'Could not reach the server. Reconnect and check the match status.';
  } finally {
    busy.value = false;
  }
}
</script>
<style scoped>
.ai-panel {
  width: min(560px, calc(100vw - 32px));
  padding: 12px 16px;
  margin: 8px;
  border-radius: 12px;
  background: rgb(var(--v-theme-inset));
}
p {
  margin: 6px 0;
}
small {
  opacity: 0.8;
}
.ai-controls {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>
