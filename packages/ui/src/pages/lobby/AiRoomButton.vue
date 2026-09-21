<template>
  <div v-if="canManage">
    <v-btn color="secondary" :loading="busy" @click="openRoom">AI Avalon · 7 bots</v-btn>
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from '@/store';
import { socket } from '@/api/socket';
const store = useStore();
const router = useRouter();
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
async function openRoom() {
  busy.value = true;
  error.value = '';
  try {
    const result = await socket.timeout(10000).emitWithAck('createAiRoom');
    if ('error' in result) error.value = result.error;
    else await router.push({ name: 'room', params: { uuid: result.roomID } });
  } catch {
    error.value = 'Could not create the AI room. Check your connection and try again.';
  } finally {
    busy.value = false;
  }
}
</script>
