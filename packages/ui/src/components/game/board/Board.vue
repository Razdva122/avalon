<template>
  <div class="board-container">
    <img class="game-board" alt="board" src="@/assets/board.jpeg" />
    <v-alert color="info" variant="tonal" class="game-stage rounded-xl" :text="currentGameStage"></v-alert>
    <div class="actions-container d-flex flex-column">
      <template v-if="roomState.stage !== 'started'">
        <StartPanel />
      </template>
      <template v-else>
        <Game :game="roomState.game"></Game>
        <InGamePanel v-if="playerInGame" :game="roomState.game"></InGamePanel>
      </template>
    </div>
    <div
      class="player-container"
      v-for="(player, i) in players"
      :style="{ transform: calculateRotate(i) }"
      :key="player.id"
    >
      <Player
        :player="player"
        :style="{ transform: 'translateY(-50%) ' + calculateRotate(i, true) }"
        @player-click="onPlayerClick"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, inject } from 'vue';
import Player from '@/components/game/board/modules/Player.vue';
import Game from '@/components/game/board/modules/Game.vue';
import StartPanel from '@/components/game/board/modules/StartPanel.vue';
import InGamePanel from './modules/InGamePanel.vue';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { stages } from '@/components/game/board/const';
import { roomStateKey } from '@/pages/room/const';

export default defineComponent({
  name: 'Board',
  components: {
    Player,
    Game,
    StartPanel,
    InGamePanel,
  },
  setup() {
    const roomState = inject(roomStateKey)!;
    const store = useStore();

    const currentGameStage = computed(() => {
      if (roomState.value.stage === 'started') {
        return stages[roomState.value.game.stage];
      }

      return stages[roomState.value.stage];
    });

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

    const calculateRotate = (i: number, negative: boolean = false) => {
      return `rotate(${negative ? '-' : ''}${(360 / roomState.value.players.length) * i + 180}deg)`;
    };

    const onPlayerClick = (uuid: string) => {
      if (roomState.value.stage !== 'started') {
        return;
      }

      if (playerInGame.value?.features.isLeader) {
        socket.emit('selectPlayer', roomState.value.roomID, uuid);
      }
    };

    return {
      roomState,
      currentGameStage,
      players,
      playerInGame,

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
  z-index: 1;
  position: absolute;
}

.game-board {
  width: 800px;
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

.game-stage {
  position: absolute;
  top: 20%;
  width: 300px;
  background-color: white;
  font-size: 18px;
}
</style>
