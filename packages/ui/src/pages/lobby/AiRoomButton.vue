<template>
  <div v-if="canManage">
    <v-btn color="secondary" :loading="busy" @click="openRoom">{{ $t('aiArena.create') }}</v-btn>
    <AiBudgetPanel v-if="canManage && budget" :budget="budget" />
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import AiBudgetPanel from '@/components/view/panels/AiBudgetPanel.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAiAccess } from '@/helpers/composables/useAiAccess';
import { useI18n } from 'vue-i18n';
import { socket } from '@/api/socket';
const { t } = useI18n();
const router = useRouter();
const { canManage, budget } = useAiAccess();
const busy = ref(false);
const error = ref('');
async function openRoom() {
  busy.value = true;
  error.value = '';
  try {
    const result = await socket.timeout(10000).emitWithAck('createAiRoom');
    if ('error' in result) error.value = result.error;
    else await router.push({ name: 'room', params: { uuid: result.roomID } });
  } catch {
    error.value = t('aiArena.connectionError');
  } finally {
    busy.value = false;
  }
}
</script>
