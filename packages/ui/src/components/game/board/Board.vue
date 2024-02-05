<template>
  <div class="board-container mt-16">
    <img class="game-board" alt="board" src="@/assets/board.png" />
    <Timer class="timer" @timerEnd="clearHistoryElement" :duration="timerDuration" />
    <div class="actions-container d-flex flex-column justify-center">
      <template v-if="roomState.stage !== 'started'">
        <div class="button-panel d-flex flex-column align-center">
          <StartPanel :room-state="roomState as unknown as TAvailableRoomStateRef" />
        </div>
      </template>
      <template v-else>
        <template v-if="gameState.stage === 'announceLoyalty' && playerInGame?.features.ladyOfLake === 'has'">
          <AnnounceLoyalty />
        </template>
        <Game v-else :game="gameState" :inGamePanel="Boolean(playerInGame)" :visible-history="visibleHistory"></Game>
      </template>
    </div>
    <div
      class="player-container"
      v-for="(player, i) in players"
      :style="{ transform: calculateRotate(i) }"
      :key="player.id"
    >
      <Player
        :player-state="player"
        :visible-history="visibleHistory"
        :style="{ transform: 'translateY(-50%) ' + calculateRotate(i, true) }"
        @player-click="onPlayerClick"
      />
    </div>
  </div>
</template>

<script lang="ts">
import * as _ from 'lodash';
import { defineComponent, computed, inject, watch, ref, PropType, toRefs } from 'vue';
import Player from '@/components/game/board/modules/Player.vue';
import Timer from '@/components/feedback/Timer.vue';
import Game from '@/components/game/board/modules/Game.vue';
import StartPanel from '@/components/game/panels/StartPanel.vue';
import AnnounceLoyalty from './modules/AnnounceLoyalty.vue';
import { THistoryResults } from '@avalon/types';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { gameStateKey, TAvailableRoomStateRef } from '@/pages/room/const';

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
      type: Object as PropType<TAvailableRoomStateRef>,
      required: true,
    },
  },
  setup(props) {
    const { roomState } = toRefs(props);
    const gameState = inject(gameStateKey)!;
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
      return `rotate(${negative ? '-' : ''}${(360 / roomState.value.players.length) * i + 180}deg)`;
    };

    const clearHistoryElement = () => {
      visibleHistory.value = undefined;
      timerDuration.value = 0;
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
        (gameState.value.stage === 'selectMerlin' && playerInGame.value?.features.isAssassin) ||
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

    watch(gameHistoryLength, () => {
      const lastElement = _.last(gameState.value.history);

      if (
        lastElement?.type === 'vote' ||
        (lastElement?.type === 'checkLoyalty' && lastElement.result) ||
        (lastElement?.type === 'switchResult' && lastElement.targetID)
      ) {
        const timeoutTime = 10000;
        visibleHistory.value = lastElement;
        timerDuration.value = timeoutTime;
      }
    });

    return {
      roomState,
      gameState,
      players,
      playerInGame,
      visibleHistory,

      timerDuration,
      clearHistoryElement,

      calculateRotate,
      onPlayerClick,
    };
  },
});
</script>

<style lang="scss">
.board-container {
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100vw;
}

.actions-container {
  height: 300px;
  z-index: 1;
  position: absolute;
}

.game-board {
  width: 600px;
}

.player-container {
  user-select: none;
  pointer-events: none;
  display: flex;
  justify-content: center;
  position: absolute;
  top: 0;
  width: 600px;
  height: 600px;
}

.button-panel > button {
  width: 200px;
}

.timer {
  position: absolute;
  top: 120px;
  font-size: 28px;
}
</style>
