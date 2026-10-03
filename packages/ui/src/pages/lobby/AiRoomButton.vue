<template>
  <div v-if="canManage" class="ai-lobby-controls">
    <div v-if="!activeRoomID" class="ai-room-selects">
      <label>
        <span>{{ $t('aiArena.selectModel') }}</span>
        <select v-model="selectedModel" :disabled="busy">
          <option v-for="model in models" :key="model.id" :value="model.id">{{ model.label }}</option>
        </select>
      </label>
      <label>
        <span>{{ $t('aiArena.selectLanguage') }}</span>
        <select v-model="selectedLanguage" :disabled="busy">
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="zh-tw">繁體中文（台灣）</option>
        </select>
      </label>
      <label>
        <span>{{ $t('aiArena.selectPlayerCount') }}</span>
        <select v-model="selectedPlayerCount" :disabled="busy">
          <option :value="5">5</option>
          <option :value="6">6</option>
          <option :value="7">7</option>
          <option :value="8">8</option>
        </select>
      </label>
    </div>
    <v-btn color="secondary" :loading="busy" :disabled="!activeRoomID && !selectedModel" @click="openRoom">
      {{ $t(activeRoomID ? 'aiArena.watch' : 'aiArena.create', { count: selectedPlayerCount }) }}
    </v-btn>
    <p v-if="selectedModel === 'codex-chatgpt'">{{ $t('aiArena.codexSubscription') }}</p>
    <details v-else-if="budget" class="ai-budget-details">
      <summary>{{ $t('aiArena.budgetDetails') }}</summary>
      <AiBudgetPanel :budget="budget" />
    </details>
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import AiBudgetPanel from '@/components/view/panels/AiBudgetPanel.vue';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAiAccess } from '@/helpers/composables/useAiAccess';
import { useI18n } from 'vue-i18n';
import { socket } from '@/api/socket';
import type { AiLanguage, AiPlayerCount } from '@avalon/types';
const { t } = useI18n();
const router = useRouter();
const { canManage, budget, models, defaultModel, activeRoomID } = useAiAccess();
const selectedModel = ref('');
const selectedLanguage = ref<AiLanguage>('en');
const selectedPlayerCount = ref<AiPlayerCount>(7);
watch([models, defaultModel], () => {
  if (!models.value.some((model) => model.id === selectedModel.value)) {
    selectedModel.value = models.value.some((model) => model.id === defaultModel.value)
      ? defaultModel.value
      : models.value[0]?.id || '';
  }
});
const busy = ref(false);
const error = ref('');
async function openRoom() {
  busy.value = true;
  error.value = '';
  try {
    if (activeRoomID.value) {
      await router.push({ name: 'room', params: { uuid: activeRoomID.value } });
      return;
    }
    const result = await socket.timeout(10000).emitWithAck('createAiRoom', {
      model: selectedModel.value,
      language: selectedLanguage.value,
      playerCount: selectedPlayerCount.value,
    });
    if ('error' in result) error.value = result.error;
    else await router.push({ name: 'room', params: { uuid: result.roomID } });
  } catch {
    error.value = t('aiArena.connectionError');
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.ai-lobby-controls {
  padding: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  border-radius: 12px;
  background: rgb(var(--v-theme-inset));
  max-width: 100%;
}
.ai-lobby-controls > :deep(.v-btn) {
  min-height: 44px;
  max-width: 100%;
}
.ai-budget-details summary {
  cursor: pointer;
  padding: 12px 0;
  min-height: 44px;
  font-size: 13px;
}
.ai-budget-details summary:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
}
.ai-room-selects {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr));
  gap: 8px;
  margin-bottom: 8px;
}
.ai-room-selects label {
  display: grid;
  gap: 4px;
  min-width: 0;
}
select {
  min-height: 44px;
  width: 100%;
  min-width: 0;
  padding: 8px 12px;
  border: 1px solid currentColor;
  border-radius: 4px;
  color: rgb(var(--v-theme-on-surface));
  background: rgb(var(--v-theme-surface));
  font: inherit;
  appearance: auto;
}
select:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
select:disabled {
  opacity: 0.6;
}
</style>
