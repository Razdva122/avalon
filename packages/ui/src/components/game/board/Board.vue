<template>
  <div class="board-container mt-16">
    <img class="game-board" alt="board" src="@/assets/board.png" />
    <Timer class="timer" @timerEnd="clearHistoryElement" :duration="timerDuration" />
    <div class="actions-container d-flex flex-column justify-center">
      <template v-if="roomState.stage !== 'started'">
        <div class="button-panel d-flex flex-column align-center">
          <StartPanel />
        </div>
      </template>
      <template v-else>
        <template v-if="roomState.game.stage === 'announceLoyalty' && playerInGame?.features.ladyOfLake === 'has'">
          <AnnounceLoyalty />
        </template>
        <Game
          v-else
          :game="roomState.game"
          :inGamePanel="Boolean(playerInGame)"
          :visible-history="visibleHistory"
        ></Game>
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
import { defineComponent, computed, inject, watch, ref } from 'vue';
import Player from '@/components/game/board/modules/Player.vue';
import Timer from '@/components/feedback/Timer.vue';
import Game from '@/components/game/board/modules/Game.vue';
import StartPanel from '@/components/game/panels/StartPanel.vue';
import AnnounceLoyalty from './modules/AnnounceLoyalty.vue';
import { THistoryResults } from '@avalon/types';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { roomStateKey } from '@/pages/room/const';

export default defineComponent({
  name: 'Board',
  components: {
    Player,
    Game,
    StartPanel,
    Timer,
    AnnounceLoyalty,
  },
  setup() {
    const roomState = inject(roomStateKey)!;
    const store = useStore();
    const visibleHistory = ref<THistoryResults>();
    const timerDuration = ref(0);

    const playerInGame = computed(() => {
      if (roomState.value.stage === 'started') {
        return roomState.value.game.players.find((player) => player.id === store.state.user?.id);
      }
    });

    const players = computed(() => {
      if (roomState.value.stage === 'started') {
        return roomState.value.game.players;
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

      if (roomState.value.game.stage === 'end') {
        return;
      }

      const userCanSelect =
        (roomState.value.game.stage === 'selectTeam' && playerInGame.value?.features.isLeader) ||
        (roomState.value.game.stage === 'selectMerlin' && playerInGame.value?.features.isAssassin) ||
        (roomState.value.game.stage === 'checkLoyalty' && playerInGame.value?.features.ladyOfLake === 'has');

      if (userCanSelect) {
        socket.emit('selectPlayer', roomState.value.roomID, uuid);
      }
    };

    const gameHistoryLength = computed(() => {
      if (roomState.value.stage === 'started') {
        return roomState.value.game.history.length;
      }
    });

    watch(gameHistoryLength, () => {
      if ('game' in roomState.value) {
        const lastElement = _.last(roomState.value.game.history);

        if (lastElement?.type === 'vote' || (lastElement?.type === 'checkLoyalty' && lastElement.result)) {
          const timeoutTime = 10000;
          visibleHistory.value = lastElement;
          timerDuration.value = timeoutTime;
        }
      }
    });

    return {
      roomState,
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
