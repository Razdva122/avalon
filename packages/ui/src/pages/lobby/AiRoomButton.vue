<template>
  <div v-if="canManage">
    <label v-if="!activeRoomID" class="ai-model-select">
      <span>{{ $t('aiArena.selectModel') }}</span>
      <select v-model="selectedModel" :disabled="busy">
        <option v-for="model in models" :key="model.id" :value="model.id">{{ model.label }}</option>
      </select>
    </label>
    <v-btn color="secondary" :loading="busy" :disabled="!activeRoomID && !selectedModel" @click="openRoom">
      {{ $t(activeRoomID ? 'aiArena.watch' : 'aiArena.create') }}
    </v-btn>
    <AiBudgetPanel v-if="canManage && budget" :budget="budget" />
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
const { t } = useI18n();
const router = useRouter();
const { canManage, budget, models, defaultModel, activeRoomID } = useAiAccess();
const selectedModel = ref('');
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
    const result = await socket.timeout(10000).emitWithAck('createAiRoom', selectedModel.value);
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
.ai-model-select {
  display: grid;
  gap: 4px;
  margin-bottom: 8px;
}
select {
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
