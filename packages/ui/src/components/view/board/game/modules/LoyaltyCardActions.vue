<template>
  <v-btn color="warning" :disabled="!isCheckAvailable" @click="checkLoyalty">
    {{ stage === 'checkLoyalty' ? $t('inGame.checkLoyalty') : $t('inGame.revealLoyalty') }}
  </v-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { socket } from '@/api/socket';
import { TPlotCardNames } from '@avalon/types';

const props = defineProps<{
  cardName: TPlotCardNames;
  stage: string;
  gameUuid: string;
}>();

const isCheckAvailable = computed(() => {
  return true;
});

const checkLoyalty = () => {
  if (props.stage === 'revealLoyalty') {
    socket.emit('revealLoyalty', props.gameUuid);
  } else {
    socket.emit('checkLoyalty', props.gameUuid);
  }
};
</script>
