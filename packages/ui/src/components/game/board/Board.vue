<template>
  <div class="board-container mt-16">
    <img class="game-board" alt="board" src="@/assets/board.png" />
    <div class="actions-container d-flex flex-column justify-center">
      <template v-if="roomState.stage !== 'started'">
        <div class="button-panel d-flex flex-column align-center">
          <StartPanel />
        </div>
      </template>
      <template v-else>
        <Game :game="roomState.game" :inGamePanel="Boolean(playerInGame)"></Game>
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
import StartPanel from '@/components/game/panels/StartPanel.vue';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { roomStateKey } from '@/pages/room/const';

export default defineComponent({
  name: 'Board',
  components: {
    Player,
    Game,
    StartPanel,
  },
  setup() {
    const roomState = inject(roomStateKey)!;
    const store = useStore();

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
      if (roomState.value.stage !== 'started' || roomState.value.game.stage === 'end') {
        return;
      }

      const userCanSelect =
        (roomState.value.game.stage === 'selectTeam' && playerInGame.value?.features.isLeader) ||
        (roomState.value.game.stage === 'selectMerlin' && playerInGame.value?.features.isAssassin);

      if (userCanSelect) {
        socket.emit('selectPlayer', roomState.value.roomID, uuid);
      }
    };

    return {
      roomState,
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
</style>
