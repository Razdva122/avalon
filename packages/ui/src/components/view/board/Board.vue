<template>
  <div class="wrapper">
    <div class="board-container" :class="'view-mode-' + stateManager.viewMode.value">
      <div class="game-board" alt="board" :class="'game-end-' + gameResult"></div>
      <slot name="content">
        <div class="timer" v-if="timerDuration > 0">
          <Timer @timerEnd="clearHistoryElement" :duration="timerDuration" />
        </div>
        <div class="actions-container d-flex flex-column justify-center">
          <template v-if="roomState.stage !== 'started'">
            <div class="options-panel mb-4">
              <div class="options-title">{{ $t('game.rolesAndAddons') }}</div>
              <OptionsPreview
                :roles="roomState.options.roles"
                :addons="roomState.options.addons"
                class="options-preview"
              />
            </div>
            <div class="button-panel d-flex flex-column align-center">
              <StartPanel :room-state="roomState" />
            </div>
          </template>
          <template v-else>
            <template v-if="shouldShowAnnounceLoyalty">
              <AnnounceLoyalty />
            </template>
            <Game v-else :inGamePanel="Boolean(playerInGame)" :visible-history="visibleHistory">
              <template v-slot:restart>
                <slot name="restart"></slot>
              </template>
            </Game>
            <div
              v-if="gameTimer && (gameTimer.active || gameTimer.isCustom) && stateManager.viewMode.value === 'live'"
              class="game-timer"
            >
              <GameTimer
                @timerEnd="onGameTimerEnd"
                :endTime="gameTimer.endTime || Date.now()"
                :isCustom="gameTimer.isCustom"
              >
                <template v-slot:timer-controls>
                  <CustomTimerControls
                    v-if="userIsLeader && gameTimer.isCustom"
                    :roomID="roomState.roomID"
                    :leaderID="roomState.leaderID"
                  />
                </template>
              </GameTimer>
            </div>
          </template>
        </div>
      </slot>
      <div
        class="player-container"
        v-for="(player, i) in players"
        :style="{ transform: calculateRotate(i) }"
        :key="player.id"
      >
        <Player
          :player-state="player"
          :display-kick="userIsLeader"
          :display-index="roomState.stage === 'started' ? gameState.features.displayIndex : false"
          :visible-history="visibleHistory"
          :current-stage="roomState.stage === 'started' ? gameState.stage : undefined"
          :style="{ transform: calculateRotate(i, true), translate: '0 -50%' }"
          @player-click="onPlayerClick"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, inject, watch, ref, PropType, toRefs, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Player from '@/components/view/board/modules/Player.vue';
import Timer from '@/components/feedback/Timer.vue';
import GameTimer from '@/components/feedback/GameTimer.vue';
import Game from '@/components/view/board/game/Game.vue';
import StartPanel from '@/components/view/panels/StartPanel.vue';
import OptionsPreview from '@/components/view/information/OptionsPreview.vue';
import AnnounceLoyalty from '@/components/view/board/game/modules/AnnounceLoyalty.vue';
import CustomTimerControls from '@/components/view/board/modules/CustomTimerControls.vue';
import eventBus from '@/helpers/event-bus';
import { THistoryResults } from '@avalon/types';
import { hasActiveCard, useHaveActiveLoyaltyCard, isAdjacentPlayer, isPlayerOnMission } from '@/helpers/plot-cards';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { gameStateKey, stateManagerKey, TPageRoomState } from '@/helpers/game-state-manager';
import { calculateVisualElement } from '@/components/view/board/helpers';

export default defineComponent({
  name: 'Board',
  components: {
    Player,
    Game,
    StartPanel,
    Timer,
    GameTimer,
    AnnounceLoyalty,
    OptionsPreview,
    CustomTimerControls,
  },
  props: {
    roomState: {
      type: Object as PropType<TPageRoomState>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const router = useRouter();
    const { roomState } = toRefs(props);
    const gameState = inject(gameStateKey)!;
    const stateManager = inject(stateManagerKey)!;
    const store = useStore();
    const visibleHistory = ref<THistoryResults>();
    const timerDuration = ref(0);

    const playerInGame = computed(() => {
      return gameState.value.players.find((player) => player.id === store.state.profile?.id);
    });

    const players = computed(() => {
      if (roomState.value.stage === 'started') {
        return gameState.value.players;
      }

      return roomState.value.players;
    });

    const userIsLeader = computed(() => {
      return store.state.profile?.id === roomState.value.leaderID;
    });

    const calculateRotate = (i: number, negative: boolean = false) => {
      return `rotate(${negative ? '-' : ''}${(360 / players.value.length) * i + 180}deg)`;
    };

    const clearHistoryElement = () => {
      visibleHistory.value = undefined;
      timerDuration.value = 0;
      stateManager.moveToNextStage();
    };

    const gameTimer = computed(() => {
      if (
        roomState.value.stage === 'started' &&
        gameState.value.stage !== 'end' &&
        gameState.value?.timer &&
        !visibleHistory.value
      ) {
        return gameState.value.timer;
      }
      return null;
    });

    const onGameTimerEnd = () => {
      // Timer ended, backend will handle the timeout
    };

    const navigateToUserStats = (uuid: string) => {
      router.push({ name: 'user_stats', params: { uuid } });
    };

    const kickPlayer = (uuid: string) => {
      socket.emit('kickPlayer', roomState.value.roomID, uuid);
    };

    const canUserSelectPlayer = (targetPlayerID: string) => {
      if (!playerInGame.value) return false;

      const { stage } = gameState.value;
      const features = playerInGame.value.features;
      const playerID = playerInGame.value.id;

      // Special case for areYouTheOne card - can only select adjacent players
      if (stage === 'checkLoyalty' && hasActiveCard(gameState.value, playerID, 'areYouTheOne')) {
        return isAdjacentPlayer(gameState.value, playerID, targetPlayerID);
      }

      if (
        (stage === 'weFoundYou' && hasActiveCard(gameState.value, playerID, 'weFoundYou')) ||
        (stage === 'useExcalibur' && features.excalibur) ||
        (stage === 'ambush' && hasActiveCard(gameState.value, playerID, 'ambush'))
      ) {
        return isPlayerOnMission(gameState.value, targetPlayerID);
      }

      return (
        (stage === 'selectTeam' && features.isLeader) ||
        (stage === 'giveExcalibur' && features.isLeader) ||
        (stage === 'assassinate' && features.isAssassin) ||
        (stage === 'checkLoyalty' && (features.ladyOfLake === 'active' || features.ladyOfSea === 'active')) ||
        (stage === 'checkLoyalty' && features.witchLoyalty === 'active') ||
        (stage === 'giveCard' && features.isLeader) ||
        (stage === 'leadToVictory' && hasActiveCard(gameState.value, playerID, 'leadToVictory')) ||
        (stage === 'restoreHonor' && hasActiveCard(gameState.value, playerID, 'restoreHonor')) ||
        (stage === 'revealLoyalty' && hasActiveCard(gameState.value, playerID, 'showNature')) ||
        (stage === 'revealLoyalty' && hasActiveCard(gameState.value, playerID, 'showStrength'))
      );
    };

    const onPlayerClick = (uuid: string) => {
      if (roomState.value.stage === 'started' && roomState.value.game.stage === 'end') {
        navigateToUserStats(uuid);
        return;
      }

      if (roomState.value.stage !== 'started') {
        userIsLeader.value ? kickPlayer(uuid) : navigateToUserStats(uuid);
        return;
      }

      if (canUserSelectPlayer(uuid)) {
        socket.emit('selectPlayer', gameState.value.uuid, uuid);
      }
    };

    const gameHistoryLength = computed(() => {
      if (gameState.value) {
        return gameState.value.history.length;
      }
    });

    const lastVisibleElement = computed(() => {
      return calculateVisualElement(gameState.value.history);
    });

    watch(gameHistoryLength, (newLength) => {
      if (!newLength || stateManager.viewMode.value === 'history') {
        return;
      }

      if (lastVisibleElement.value.element && lastVisibleElement.value.timeout > 0) {
        nextTick(() => {
          visibleHistory.value = lastVisibleElement.value.element;
          timerDuration.value = lastVisibleElement.value.timeout;
        });
      } else {
        stateManager.moveToNextStage();
      }
    });

    const playerWaitForActionState = computed(() => {
      if ('game' in roomState.value) {
        return roomState.value.game.players.find((player) => player.id === store.state.profile?.id)?.features
          .waitForAction;
      }
    });

    watch(playerWaitForActionState, () => {
      if (playerWaitForActionState && stateManager.viewMode.value === 'history') {
        eventBus.emit('infoMessage', t('infoMessage.waitForAction'));
      }
    });

    const gamePointer = computed(() => {
      if (roomState.value.stage !== 'started') {
        return 0;
      }

      return roomState.value.pointer;
    });

    watch(gamePointer, (pointer) => {
      if (stateManager.viewMode.value === 'live') {
        return;
      }

      if (lastVisibleElement.value.element) {
        visibleHistory.value = lastVisibleElement.value.element;
      } else {
        visibleHistory.value = undefined;
      }

      if (stateManager.state.value.stage === 'started') {
        if (pointer === stateManager.state.value.gameStates.length - 1) {
          visibleHistory.value = undefined;
        }
      }
    });

    watch(stateManager.viewMode, (newViewMode) => {
      if (newViewMode === 'live') {
        nextTick(() => {
          timerDuration.value = 0;
          visibleHistory.value = undefined;
        });
      }
    });

    const gameResult = computed(() => {
      if (roomState.value.stage === 'started') {
        return gameState.value.result?.winner;
      }
    });

    const playerID = computed(() => playerInGame.value?.id);

    const isUserLoyaltyAnnouncer = computed(() => {
      if (!playerInGame.value) {
        return false;
      }

      return (
        playerInGame.value.features.ladyOfLake === 'active' ||
        playerInGame.value.features.ladyOfSea === 'active' ||
        playerInGame.value.features.witchLoyalty === 'active' ||
        (useHaveActiveLoyaltyCard(gameState, playerID) && playerInGame.value.features.waitForAction === true)
      );
    });

    const shouldShowAnnounceLoyalty = computed(() => {
      if (gameState.value.stage !== 'announceLoyalty') {
        return false;
      }
      if (stateManager.viewMode.value !== 'live' || visibleHistory.value?.type === 'announceLoyalty') {
        return false;
      }

      return isUserLoyaltyAnnouncer.value;
    });

    return {
      roomState,
      gameState,
      players,
      playerInGame,
      visibleHistory,
      stateManager,
      gameResult,
      userIsLeader,
      shouldShowAnnounceLoyalty,

      timerDuration,
      clearHistoryElement,

      calculateRotate,
      onPlayerClick,
      gameTimer,
      onGameTimerEnd,
    };
  },
});
</script>

<style lang="scss">
@mixin gameEndShadow($color) {
  box-shadow:
    rgba($color, 0.4) 8px 8px,
    rgba($color, 0.3) 16px 16px,
    rgba($color, 0.2) 24px 24px,
    rgba($color, 0.1) 32px 32px,
    rgba($color, 0.05) 40px 40px;
}

@mixin scaleFromSize($size) {
  $value: $size;

  @while $value > 300px {
    $newValue: calc($value - 50px);

    @media screen and (max-width: $value) and (min-width: $newValue) {
      .board-container {
        transform: scale(calc(($newValue + 40px) / $size));
      }

      .wrapper {
        width: $newValue;
        height: $newValue;
      }
    }

    @media screen and (max-height: $value) and (min-height: $newValue) {
      .board-container {
        transform: scale(calc(($newValue - 50px) / $size));
      }

      .wrapper {
        width: $newValue;
        height: $newValue;
      }
    }

    $value: $newValue;
  }
}

.board-container {
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin: 120px 100px;
  color: white;
  overflow: visible;
  transform: scale(1);
}

@include scaleFromSize(840px);

.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions-container {
  top: 120px;
  height: 340px;
  z-index: 1;
  position: absolute;
}

.game-board {
  background-image: getImagePathByID('core', 'board');
  width: 600px;
  height: 600px;
  background-position: center;
  border-radius: 50%;
  background-size: 137%;
}

.game-end-evil {
  @include gameEndShadow(rgb(255, 25, 25));
}

.game-end-good {
  @include gameEndShadow(rgb(0, 85, 184));
}

.player-container {
  user-select: none;
  pointer-events: none;
  display: flex;
  justify-content: center;
  position: absolute;
  top: -10px;
  width: 620px;
  height: 620px;
  transition: transform 0.5s;
}

.button-panel button {
  width: 200px;
}

.options-panel {
  padding: 6px;
  border-radius: 12px;
}

.options-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.options-title {
  text-align: center;
  font-size: 24px;
}

.view-mode-history {
  .timer {
    display: none;
  }
}

.timer {
  text-align: center;
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24px;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  min-width: 60px;
}

.game-timer {
  position: fixed;
  bottom: -50px;
  left: -100px;
  background-color: rgb(var(--v-theme-surface-light));
  color: white;
  padding: 15px 25px;
  border-radius: 30px;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  min-width: 120px;
  justify-content: center;
}
</style>
