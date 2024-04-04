<template>
  <div class="board-container" :class="'view-mode-' + stateManager.viewMode.value">
    <div class="game-board" alt="board" :class="'game-end-' + gameResult"></div>
    <slot name="content">
      <div class="timer">
        <Timer @timerEnd="clearHistoryElement" :duration="timerDuration" />
      </div>
      <div class="actions-container d-flex flex-column justify-center">
        <template v-if="roomState.stage !== 'started'">
          <div class="button-panel d-flex flex-column align-center">
            <StartPanel :room-state="roomState" />
          </div>
        </template>
        <template v-else>
          <template
            v-if="
              stateManager.viewMode.value === 'live' &&
              gameState.stage === 'announceLoyalty' &&
              playerInGame?.features.ladyOfLake === 'has' &&
              visibleHistory?.type !== 'checkLoyalty'
            "
          >
            <AnnounceLoyalty />
          </template>
          <Game v-else :inGamePanel="Boolean(playerInGame)" :visible-history="visibleHistory" />
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
        :visible-history="visibleHistory"
        :current-stage="roomState.stage === 'started' ? gameState.stage : undefined"
        :style="{ transform: calculateRotate(i, true), translate: '0 -50%' }"
        @player-click="onPlayerClick"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, inject, watch, ref, PropType, toRefs, nextTick } from 'vue';
import Player from '@/components/view/board/modules/Player.vue';
import Timer from '@/components/feedback/Timer.vue';
import Game from '@/components/view/board/game/Game.vue';
import StartPanel from '@/components/view/panels/StartPanel.vue';
import AnnounceLoyalty from '@/components/view/board/game/modules/AnnounceLoyalty.vue';
import { THistoryResults } from '@avalon/types';
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
    AnnounceLoyalty,
  },
  props: {
    roomState: {
      type: Object as PropType<TPageRoomState>,
      required: true,
    },
  },
  setup(props) {
    const { roomState } = toRefs(props);
    const gameState = inject(gameStateKey)!;
    const stateManager = inject(stateManagerKey)!;
    const store = useStore();
    const visibleHistory = ref<THistoryResults>();
    const timerDuration = ref(0);

    const playerInGame = computed(() => {
      return gameState.value.players.find((player) => player.id === store.state.user?.id);
    });

    const players = computed(() => {
      if (roomState.value.stage === 'started') {
        return gameState.value.players;
      }

      return roomState.value.players;
    });

    const userIsLeader = computed(() => {
      return store.state.user?.id === roomState.value.leaderID;
    });

    const calculateRotate = (i: number, negative: boolean = false) => {
      return `rotate(${negative ? '-' : ''}${(360 / players.value.length) * i + 180}deg)`;
    };

    const clearHistoryElement = () => {
      visibleHistory.value = undefined;
      timerDuration.value = 0;
      stateManager.moveToNextStage();
    };

    const onPlayerClick = (uuid: string) => {
      if (roomState.value.stage !== 'started') {
        if (userIsLeader.value) {
          socket.emit('kickPlayer', roomState.value.roomID, uuid);
        }

        return;
      }

      const userCanSelect =
        (gameState.value.stage === 'selectTeam' && playerInGame.value?.features.isLeader) ||
        (gameState.value.stage === 'giveExcalibur' && playerInGame.value?.features.isLeader) ||
        (gameState.value.stage === 'assassinate' && playerInGame.value?.features.isAssassin) ||
        (gameState.value.stage === 'useExcalibur' && playerInGame.value?.features.excalibur) ||
        (gameState.value.stage === 'checkLoyalty' && playerInGame.value?.features.ladyOfLake === 'has');

      if (userCanSelect) {
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
        return gameState.value.winner;
      }
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

      timerDuration,
      clearHistoryElement,

      calculateRotate,
      onPlayerClick,
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
    }

    @media screen and (max-height: $value) and (min-height: $newValue) {
      .board-container {
        transform: scale(calc(($newValue - 50px) / $size));
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
}

@include scaleFromSize(840px);

.actions-container {
  top: 120px;
  height: 340px;
  z-index: 1;
  position: absolute;
}

.game-board {
  background-image: url('@/assets/board.webp');
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

.button-panel > button {
  width: 200px;
}

.view-mode-history {
  .timer {
    display: none;
  }
}

.timer {
  text-align: center;
  position: absolute;
  top: 100px;
  font-size: 28px;
  width: 100px;
  height: 30px;
}
</style>
