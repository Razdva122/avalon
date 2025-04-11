<template>
  <div class="plot-cards-panel">
    <template v-if="game.stage === 'restoreHonor' && isUserRestoreHonorOwner">
      <RestoreHonorView :game="game" />
    </template>

    <div v-else-if="data?.length" class="plot-cards-view mb-2">
      <PlotCard
        :display-tooltip="true"
        class="plot-card"
        v-for="card in data"
        :key="card.name"
        :card-name="card.name"
        :class="`plot-card-${card.stage}`"
      ></PlotCard>
    </div>

    <template v-if="isLoyaltyCheckStage && isUserLoyaltyCardOwner && activeCard">
      <LoyaltyCardActions :card-name="activeCard.name" :stage="game.stage" :game-uuid="game.uuid" />
    </template>

    <template v-if="game.stage === 'giveCard' && stateManager.viewMode.value === 'live' && isUserLeader">
      <v-btn color="success" @click="givePlotCard" :disabled="!isGivePlotCardAvailable">
        {{ $t('inGame.giveCard') }}
      </v-btn>
    </template>

    <template v-if="game.stage === 'leadToVictory'">
      <template v-if="isUserLeadToVictoryOwner">
        <v-btn color="success" @click="() => leadToVictoryClick(true)" class="mb-2">
          {{ $t('inGame.takeLead') }}
        </v-btn>
        <v-btn color="warning" @click="() => leadToVictoryClick(false)">
          {{ $t('inGame.skip') }}
        </v-btn>
      </template>
      <template v-else>
        <PlotCard
          :display-tooltip="true"
          class="plot-card plot-card-selectionInProgress"
          card-name="leadToVictory"
        ></PlotCard>
      </template>
    </template>

    <template v-if="game.stage === 'preVote' && !isPlayerActive">
      <PlotCard :display-tooltip="true" class="plot-card plot-card-selectionInProgress" card-name="charge"></PlotCard>
    </template>

    <template v-if="game.stage === 'ambush'">
      <template v-if="isUserAmbushOwner">
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
      <template v-else>
        <PlotCard :display-tooltip="true" class="plot-card plot-card-selectionInProgress" card-name="ambush"></PlotCard>
      </template>
    </template>

    <template v-if="game.stage === 'kingReturns'">
      <template v-if="isUserKingReturnsOwner">
        <v-btn color="success" @click="() => kingReturnsClick(true)" class="mb-2">
          {{ $t('inGame.useCard', { cardName: $t('cardsInfo.kingReturns') }) }}
        </v-btn>
        <v-btn color="warning" @click="() => kingReturnsClick(false)">
          {{ $t('inGame.skipCard', { cardName: $t('cardsInfo.kingReturns') }) }}
        </v-btn>
      </template>
      <template v-else>
        <PlotCard
          :display-tooltip="true"
          class="plot-card plot-card-selectionInProgress"
          card-name="kingReturns"
        ></PlotCard>
      </template>
    </template>

    <template v-if="game.stage === 'weFoundYou'">
      <template v-if="isUserWeFoundYouOwner">
        <v-btn
          :color="isZeroPlayerSelected ? 'warning' : 'success'"
          @click="weFoundYouClick"
          class="mb-2"
          :disabled="!isSinglePlayerSelected && !isZeroPlayerSelected"
        >
          {{
            $t(isZeroPlayerSelected ? 'inGame.skipCard' : 'inGame.useCard', { cardName: $t('cardsInfo.weFoundYou') })
          }}
        </v-btn>
      </template>
      <template v-else>
        <PlotCard
          :display-tooltip="true"
          class="plot-card plot-card-selectionInProgress"
          card-name="weFoundYou"
        ></PlotCard>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, computed, inject } from 'vue';
import PlotCard from '@/components/view/information/PlotCard.vue';
import RestoreHonorView from '@/components/view/board/game/modules/RestoreHonorView.vue';
import LoyaltyCardActions from '@/components/view/board/game/modules/LoyaltyCardActions.vue';
import AnnounceLoyalty from '@/components/view/board/game/modules/AnnounceLoyalty.vue';
import type { ActiveCard, VisualGameState } from '@avalon/types';
import { socket } from '@/api/socket';
import { useGamePlayerState } from '@/helpers/composables/useGamePlayerState';
import { useHasActiveCard, hasActiveCard, useHaveActiveLoyaltyCard } from '@/helpers/plot-cards';
import { stateManagerKey } from '@/helpers/game-state-manager';

type TMethodsWithoutParams = 'useAmbush';

export default defineComponent({
  name: 'PlotCardsPanel',
  components: {
    PlotCard,
    RestoreHonorView,
    LoyaltyCardActions,
    AnnounceLoyalty,
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
    const stateManager = inject(stateManagerKey)!;

    const { player, isUserLeader, isPlayerActive, isZeroPlayerSelected, isSinglePlayerSelected } =
      useGamePlayerState(gameComputed);

    // Create a computed property for the player ID
    const playerID = computed(() => player.value?.id);

    const isUserAmbushOwner = useHasActiveCard(game, playerID, 'ambush');
    const isUserLeadToVictoryOwner = useHasActiveCard(game, playerID, 'leadToVictory');
    const isUserRestoreHonorOwner = useHasActiveCard(game, playerID, 'restoreHonor');
    const isUserKingReturnsOwner = useHasActiveCard(game, playerID, 'kingReturns');
    const isUserWeFoundYouOwner = useHasActiveCard(game, playerID, 'weFoundYou');
    const isUserLoyaltyCardOwner = useHaveActiveLoyaltyCard(game, playerID);

    const isLoyaltyCheckStage = computed(() => {
      return ['checkLoyalty', 'revealLoyalty'].includes(game.value.stage);
    });

    const activeCard = computed(() => {
      return game.value.addonsData.plotCards?.cardsInGame.find((card) => card.stage === 'active');
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
                player.features.isSelected && !hasActiveCard(game.value, player.id, 'ambush') && player.features.isSent,
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

    const kingReturnsClick = (use: boolean) => {
      socket.emit('useKingReturns', game.value.uuid, use);
    };

    const weFoundYouClick = () => {
      socket.emit('useWeFoundYou', game.value.uuid, isZeroPlayerSelected.value ? false : true);
    };

    const emitClick = (methodName: TMethodsWithoutParams) => {
      socket.emit(methodName, game.value.uuid);
    };

    return {
      isUserLeader,
      isPlayerActive,
      isZeroPlayerSelected,
      isSinglePlayerSelected,
      isUserAmbushOwner,
      isUserLeadToVictoryOwner,
      isUserRestoreHonorOwner,
      isUserKingReturnsOwner,
      isUserWeFoundYouOwner,
      isGivePlotCardAvailable,
      isUseAmbushAvailable,
      isLoyaltyCheckStage,
      isUserLoyaltyCardOwner,
      activeCard,
      givePlotCard,
      leadToVictoryClick,
      kingReturnsClick,
      weFoundYouClick,
      emitClick,
      stateManager,
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

.plot-cards-panel {
  display: flex;
  align-items: center;
  flex-direction: column;
}
</style>
