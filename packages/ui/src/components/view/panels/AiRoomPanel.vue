<template>
  <section v-if="ai" class="ai-panel" :aria-label="$t('aiArena.title')">
    <details class="ai-disclosure">
      <summary>
        <span class="ai-heading"
          ><strong>{{ $t('aiArena.title') }}</strong
          ><small v-if="ai.model">{{ ai.model }}</small></span
        >
        <span class="ai-status" :class="`ai-status--${ai.status}`">{{ $t(`aiArena.${ai.status}`) }}</span>
        <span class="ai-expand" aria-hidden="true">⌄</span>
        <span class="sr-only">{{ $t('aiArena.controls') }}</span>
      </summary>
      <div class="ai-details">
        <p aria-live="polite">{{ ai.message }}</p>
        <v-btn v-if="canReveal" class="mt-2" :loading="revealing" :aria-pressed="rolesShown" @click="toggleRoles">
          {{ $t(rolesShown ? 'aiArena.hideRoles' : 'aiArena.revealRoles') }}
        </v-btn>
        <p v-if="rolesShown">{{ $t('aiArena.rolesHint') }}</p>
        <div v-if="canManage" class="ai-controls">
          <v-btn v-if="ai.status === 'ready'" color="success" :loading="busy" @click="control('start')">{{
            $t('aiArena.start')
          }}</v-btn>
          <v-btn
            v-if="ai.status === 'paused' && ai.canResumeBudget && limits[roomID] !== undefined"
            color="success"
            :loading="busy"
            @click="control('resumeBudget')"
          >
            {{ $t('aiArena.resumeBudget', { limit: limits[roomID] * 2 }) }}
          </v-btn>
          <v-btn
            v-if="['ready', 'running', 'paused'].includes(ai.status)"
            color="warning"
            :disabled="busy"
            @click="control('stop')"
            >{{ $t('aiArena.stop') }}</v-btn
          >
        </div>
        <AiBudgetPanel
          v-if="canManage && budget"
          :budget="budget"
          :cost="costs[roomID]"
          :match-limit="limits[roomID]"
        />
      </div>
    </details>
    <p v-if="error" class="ai-error" role="alert">{{ error }}</p>
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
const { canManage, costs, limits, budget, refresh } = useAiAccess(computed(() => [props.roomID]));
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
async function control(action: 'start' | 'stop' | 'resumeBudget') {
  busy.value = true;
  error.value = '';
  try {
    const result = await socket.timeout(10000).emitWithAck('controlAiRoom', props.roomID, action);
    if ('error' in result) error.value = result.error;
    else await refresh();
  } catch {
    error.value = t('aiArena.connectionError');
  } finally {
    busy.value = false;
  }
}
</script>
<style scoped>
.ai-panel {
  width: min(360px, calc(100vw - 16px));
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  border-radius: 12px;
  background: rgb(var(--v-theme-inset));
  box-shadow: 0 4px 16px #0002;
  overflow: hidden;
}
summary {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 8px 12px;
  cursor: pointer;
  list-style: none;
}
summary::-webkit-details-marker {
  display: none;
}
summary:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -3px;
}
.ai-heading {
  display: grid;
  min-width: 0;
  flex: 1;
}
.ai-heading small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.75;
  font-size: 12px;
}
.ai-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 20px;
  background: rgba(var(--v-theme-primary), 0.12);
}
.ai-status--running {
  color: rgb(var(--v-theme-success));
}
.ai-status--paused {
  color: rgb(var(--v-theme-warning));
}
details[open] .ai-expand {
  transform: rotate(180deg);
}
.ai-details {
  max-height: 45dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 12px 12px;
  border-top: 1px solid #8884;
}
.ai-details p {
  margin: 8px 0;
  overflow-wrap: anywhere;
  font-size: 13px;
}
.ai-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.ai-details :deep(.v-btn) {
  min-height: 44px;
  max-width: 100%;
  height: auto;
  padding-top: 8px;
  padding-bottom: 8px;
}
.ai-details :deep(.v-btn__content) {
  white-space: normal;
}
.ai-error {
  margin: 8px 12px;
  overflow-wrap: anywhere;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>
