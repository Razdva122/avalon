<template>
  <v-btn color="success" :disabled="!isCheckAvailable" @click="checkLoyalty">
    {{ stage === 'checkLoyalty' ? $t('inGame.checkLoyalty') : $t('inGame.revealLoyalty') }}
  </v-btn>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { socket } from '@/api/socket';
import { TPlotCardNames } from '@avalon/types';
import { gameStateKey } from '@/helpers/game-state-manager';

const props = defineProps<{
  cardName: TPlotCardNames;
  stage: string;
  gameUuid: string;
}>();

// Get the game state
const gameState = inject(gameStateKey)!;

const isCheckAvailable = computed(() => {
  const selectedPlayersCount = gameState.value.players.filter((player) => player.features.isSelected).length;

  return selectedPlayersCount === 1;
});

const checkLoyalty = () => {
  // Get the active card ID
  const activeCard = gameState.value.addonsData.plotCards?.cardsInGame.find(
    (card) => card.name === props.cardName && card.stage === 'active',
  )!;

  if (props.stage === 'revealLoyalty') {
    socket.emit('revealLoyaltyWithCard', props.gameUuid, activeCard.id);
  } else {
    socket.emit('checkLoyaltyWithCard', props.gameUuid, activeCard.id);
  }
};
</script>
