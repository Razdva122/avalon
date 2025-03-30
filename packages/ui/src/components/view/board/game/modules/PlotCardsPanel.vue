<template>
  <div>
    <div v-if="data?.length" class="plot-cards-view mb-2">
      <PlotCard
        :display-tooltip="true"
        class="plot-card"
        v-for="card in data"
        :key="card.name"
        :card-name="card.name"
        :class="`plot-card-${card.stage}`"
      ></PlotCard>
    </div>

    <template v-if="game.stage === 'giveCard' && isUserLeader">
      <v-btn color="success" @click="givePlotCard" :disabled="!isGivePlotCardAvailable">
        {{ $t('inGame.giveCard') }}
      </v-btn>
    </template>

    <template v-if="game.stage === 'leadToVictory' && isPlayerActive">
      <v-btn color="success" @click="() => leadToVictoryClick(true)" class="mb-2">
        {{ $t('inGame.takeLead') }}
      </v-btn>
      <v-btn color="warning" @click="() => leadToVictoryClick(false)">
        {{ $t('inGame.skip') }}
      </v-btn>
    </template>

    <template v-if="game.stage === 'ambush' && isUserAmbushOwner">
      <v-btn
        :color="isZeroPlayerSelected ? 'warning' : 'success'"
        :disabled="!isUseAmbushAvailable"
        @click="emitClick('useAmbush')"
        >{{
          isZeroPlayerSelected
            ? $t('inGame.skipCard', { cardName: $t('cardsInfo.ambush') })
            : $t('inGame.useCard', { cardName: $t('cardsInfo.ambush') })
        }}</v-btn
      >
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, computed } from 'vue';
import PlotCard from '@/components/view/information/PlotCard.vue';
import type { ActiveCard, VisualGameState } from '@avalon/types';
import { socket } from '@/api/socket';
import { useGamePlayerState } from '@/helpers/composables/useGamePlayerState';

type TMethodsWithoutParams = 'useAmbush';

export default defineComponent({
  name: 'PlotCardsPanel',
  components: {
    PlotCard,
  },
  props: {
    data: {
      type: Array as PropType<ActiveCard[]>,
    },
    game: {
      required: true,
      type: Object as PropType<VisualGameState>,
    },
  },
  setup(props) {
    const { game } = toRefs(props);
    const gameComputed = computed(() => game.value);

    const { player, isUserLeader, isPlayerActive, isZeroPlayerSelected, isSinglePlayerSelected } =
      useGamePlayerState(gameComputed);

    const isUserAmbushOwner = computed(() => {
      return Boolean(player.value?.features.ambushCard === 'active');
    });

    const isGivePlotCardAvailable = computed(() => {
      return (
        isSinglePlayerSelected.value &&
        game.value.players.find((player) => player.features.isSelected && !player.features.isLeader)
      );
    });

    const isUseAmbushAvailable = computed(() => {
      return (
        isZeroPlayerSelected.value ||
        (isSinglePlayerSelected.value &&
          Boolean(
            game.value.players.find(
              (player) =>
                player.features.isSelected && player.features.ambushCard !== 'active' && player.features.isSent,
            ),
          ))
      );
    });

    const givePlotCard = () => {
      socket.emit('givePlotCard', game.value.uuid);
    };

    const leadToVictoryClick = (use: boolean) => {
      socket.emit('useLeadToVictory', game.value.uuid, use);
    };

    const emitClick = (methodName: TMethodsWithoutParams) => {
      socket.emit(methodName, game.value.uuid);
    };

    return {
      isUserLeader,
      isPlayerActive,
      isZeroPlayerSelected,
      isUserAmbushOwner,
      isGivePlotCardAvailable,
      isUseAmbushAvailable,
      givePlotCard,
      leadToVictoryClick,
      emitClick,
    };
  },
});
</script>

<style scoped lang="scss">
.plot-cards-view {
  display: flex;
  gap: 10px;
}

.plot-card {
  width: 60px;
  height: 60px;
}

.plot-card-selectionInProgress {
  border: 2px solid rgb(var(--v-theme-info));
}

.plot-card-active {
  border: 2px solid white;
}

.plot-card-used {
  opacity: 50%;
}
</style>
