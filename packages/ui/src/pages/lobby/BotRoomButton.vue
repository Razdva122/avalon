<template>
  <v-btn
    v-if="available"
    class="bot-room-button"
    color="secondary"
    size="large"
    :elevation="0"
    :loading="busy"
    :disabled="busy"
    @click="openRoom"
  >
    <v-icon icon="fa:fa-solid fa-robot" size="20" class="mr-2" aria-hidden="true" />
    {{ $t(ownRoomID ? 'aiArena.botContinue' : 'aiArena.botPlay') }}
  </v-btn>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { socket } from '@/api/socket';
import eventBus from '@/helpers/event-bus';
import { useAiAccess } from '@/helpers/composables/useAiAccess';

const { t } = useI18n();
const router = useRouter();
const { canPlay, botModes, ownRoomID, refresh } = useAiAccess();
const available = computed(() => canPlay.value && (ownRoomID.value || botModes.value.smart || botModes.value.regular));
const busy = ref(false);

async function openRoom() {
  if (busy.value || !available.value) return;
  busy.value = true;
  try {
    if (ownRoomID.value) {
      await router.push({ name: 'room', params: { uuid: ownRoomID.value } });
      return;
    }
    const result = await socket.timeout(30000).emitWithAck('createHumanAiRoom');
    if ('error' in result) {
      eventBus.emit('infoMessage', t('aiArena.botPlayError'));
      await refresh();
    } else await router.push({ name: 'room', params: { uuid: result.roomID } });
  } catch {
    eventBus.emit('infoMessage', t('aiArena.connectionError'));
    await refresh();
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.bot-room-button {
  min-height: 44px;
  max-width: 100%;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}
</style>
