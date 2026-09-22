<template>
  <section v-if="ai" class="ai-panel" :aria-label="$t('aiArena.title')">
    <strong>{{ $t('aiArena.create') }}</strong>
    <p aria-live="polite">{{ ai.message }}</p>
    <small
      >{{ $t('aiArena.subtitle') }}
      <span v-if="canManage && costs[roomID] !== undefined"> · {{ costs[roomID].toFixed(2) }} ₽</span>
    </small>
    <p v-if="ai.model">{{ $t('aiArena.model', { model: ai.model }) }}</p>
    <v-btn v-if="canReveal" class="mt-2" :loading="revealing" :aria-pressed="rolesShown" @click="toggleRoles">
      {{ $t(rolesShown ? 'aiArena.hideRoles' : 'aiArena.revealRoles') }}
    </v-btn>
    <p v-if="rolesShown">{{ $t('aiArena.rolesHint') }}</p>
    <div v-if="canManage" class="ai-controls">
      <v-btn v-if="ai.status === 'ready'" color="success" :loading="busy" @click="control('start')">{{
        $t('aiArena.start')
      }}</v-btn>
      <v-btn
        v-if="['ready', 'running', 'paused'].includes(ai.status)"
        color="warning"
        :disabled="busy"
        @click="control('stop')"
        >{{ $t('aiArena.stop') }}</v-btn
      >
    </div>
    <AiBudgetPanel v-if="canManage && budget" :budget="budget" :cost="costs[roomID]" />
    <p v-if="error" role="alert">{{ error }}</p>
  </section>
</template>
<script setup lang="ts">
import AiBudgetPanel from '@/components/view/panels/AiBudgetPanel.vue';
import { ref, computed } from 'vue';
import { useAiAccess } from '@/helpers/composables/useAiAccess';
import { useI18n } from 'vue-i18n';
import { socket } from '@/api/socket';
import type { AiRoomState, TRoles } from '@avalon/types';
const props = defineProps<{ ai: AiRoomState; roomID: string; canReveal?: boolean; rolesShown?: boolean }>();
const { t } = useI18n();
const { canManage, costs, budget } = useAiAccess(computed(() => [props.roomID]));
const emit = defineEmits<{ roles: [value: Record<string, TRoles>] }>();
const revealing = ref(false);
async function toggleRoles() {
  error.value = '';
  if (props.rolesShown) return emit('roles', {});
  const roomID = props.roomID;
  revealing.value = true;
  try {
    const result = await socket.timeout(5000).emitWithAck('getAiSpectatorRoles', roomID);
    if (props.roomID !== roomID || !props.canReveal) return;
    if ('error' in result) error.value = t('aiArena.rolesError');
    else emit('roles', result.roles);
  } catch {
    error.value = t('aiArena.connectionError');
  } finally {
    revealing.value = false;
  }
}
const busy = ref(false);
const error = ref('');
async function control(action: 'start' | 'stop') {
  busy.value = true;
  error.value = '';
  try {
    const result = await socket.timeout(10000).emitWithAck('controlAiRoom', props.roomID, action);
    if ('error' in result) error.value = result.error;
  } catch {
    error.value = t('aiArena.connectionError');
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
