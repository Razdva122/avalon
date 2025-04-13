<template>
  <div class="restore-honor-view">
    <div class="cards-section mb-2">
      <div v-if="selectedPlayer && availableCards.length > 0" class="plot-cards-view">
        <PlotCard
          v-for="card in availableCards"
          :key="card.id"
          :card-name="card.name"
          :display-tooltip="true"
          class="plot-card"
          :class="{ 'plot-card-selected': selectedCard === card.id }"
          @click="selectCard(card.id)"
        ></PlotCard>
      </div>
    </div>

    <div class="message-section">
      <div v-if="isMultiplePlayersSelected" class="mb-2 error-text">
        {{ $t('inGame.selectSinglePlayer') }}
      </div>
      <div v-else-if="isSelfSelected" class="mb-2 error-text">
        {{ $t('inGame.cannotSelectSelf') }}
      </div>
      <div v-else-if="!selectedPlayer" class="mb-2">
        {{ $t('inGame.selectPlayer') }}
      </div>
      <div v-else-if="availableCards.length === 0" class="mb-2">
        {{ $t('inGame.noAvailableCards') }}
      </div>
      <div v-else-if="!selectedCard" class="mb-2">
        {{ $t('inGame.selectCard') }}
      </div>

      <v-btn
        v-else-if="selectedPlayer && availableCards.length > 0"
        color="success"
        @click="onRestoreHonor"
        :disabled="!canRestoreHonor"
      >
        {{ $t('inGame.takeCard') }}
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, watch } from 'vue';
import PlotCard from '@/components/view/information/PlotCard.vue';
import type { VisualGameState } from '@avalon/types';
import { socket } from '@/api/socket';
import { useGamePlayerState } from '@/helpers/composables/useGamePlayerState';
import { getPlayerCards } from '@/helpers/plot-cards';

export default defineComponent({
  name: 'RestoreHonorView',
  components: {
    PlotCard,
  },
  props: {
    game: {
      required: true,
      type: Object as PropType<VisualGameState>,
    },
    cardID: {
      required: true,
      type: String,
    },
  },
  setup(props) {
    const gameComputed = computed(() => props.game);
    const { player: currentPlayer } = useGamePlayerState(gameComputed);

    const selectedPlayers = computed(() => {
      return props.game.players.filter((player) => player.features.isSelected);
    });

    const selectedPlayer = computed(() => {
      return selectedPlayers.value.length === 1 ? selectedPlayers.value[0] : null;
    });

    const isMultiplePlayersSelected = computed(() => {
      return selectedPlayers.value.length > 1;
    });

    const isSelfSelected = computed(() => {
      return selectedPlayer.value?.id === currentPlayer.value?.id;
    });

    const selectedCard = ref<string | null>(null);

    watch(selectedPlayers, () => {
      selectedCard.value = null;
    });

    const availableCards = computed(() => {
      if (!selectedPlayer.value || !currentPlayer.value) return [];

      return getPlayerCards(props.game, selectedPlayer.value.id);
    });

    const canRestoreHonor = computed(() => {
      return selectedPlayer.value && selectedCard.value && !isMultiplePlayersSelected.value && !isSelfSelected.value;
    });

    const selectCard = (cardId: string | undefined) => {
      if (!cardId) return;
      selectedCard.value = selectedCard.value === cardId ? null : cardId;
    };

    const onRestoreHonor = () => {
      if (isMultiplePlayersSelected.value || isSelfSelected.value) {
        return;
      }

      if (selectedCard.value) {
        socket.emit('useRestoreHonor', props.game.uuid, props.cardID, selectedCard.value);
        selectedCard.value = null;
      }
    };

    return {
      selectedPlayer,
      selectedCard,
      availableCards,
      canRestoreHonor,
      selectCard,
      onRestoreHonor,
      isMultiplePlayersSelected,
      isSelfSelected,
    };
  },
});
</script>

<style scoped lang="scss">
.restore-honor-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 200px;
}

.cards-section {
  width: 100%;
  display: flex;
  justify-content: center;
}

.message-section {
  font-size: 18px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.plot-cards-view {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.plot-card {
  width: 60px;
  height: 60px;
  cursor: pointer;
}

.plot-card-selected {
  border: 2px solid rgb(var(--v-theme-success));
  box-shadow: 0 0 10px rgba(var(--v-theme-success), 0.5);
}

.error-text {
  color: rgb(var(--v-theme-error));
  font-weight: bold;
}
</style>
