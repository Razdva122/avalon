<template>
  <div class="board-container">
    <img class="game-board" alt="board" src="../../assets/board.jpeg" />
    <v-alert color="info" variant="tonal" class="game-stage rounded-xl" :text="currentGameStage"></v-alert>
    <div class="actions-container d-flex flex-column">
      <template v-if="roomState.stage !== 'started'">
        <v-btn v-if="isUserInGame" rounded="lg" variants="tonal" color="warning" @click="joinClick"> Leave Game </v-btn>
        <v-btn
          v-else
          rounded="lg"
          variants="tonal"
          color="info"
          :disabled="roomState.stage !== 'created'"
          @click="joinClick"
        >
          Join Game
        </v-btn>
        <template v-if="isUserLeader">
          <v-btn class="mt-2" rounded="lg" variants="tonal" color="info" @click="lockClick">
            {{ roomState.stage === 'created' ? 'Lock Game' : 'Unlock game' }}
          </v-btn>
          <v-btn
            class="mt-2"
            rounded="lg"
            variants="tonal"
            color="success"
            :disabled="isStartGameDisabled"
            @click="startClick"
          >
            Start Game
          </v-btn>
        </template>
      </template>
      <template v-else>
        <Game :game="roomState.game"></Game>
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
        @player-click="playerClick"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, toRef } from 'vue';
import Player from '@/components/Player.vue';
import type { TAvailableRoom } from '@avalon/types';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { stages } from '@/components/room/const';
import Game from '@/components/room/Game.vue';

export default defineComponent({
  name: 'Board',
  components: {
    Player,
    Game,
  },
  props: {
    roomState: {
      required: true,
      type: Object as PropType<TAvailableRoom>,
    },
  },
  async setup(props) {
    const roomState = toRef(props, 'roomState');
    const store = useStore();

    const currentGameStage = computed(() => {
      if (roomState.value.stage === 'started') {
        return stages[roomState.value.game.stage];
      }

      return stages[roomState.value.stage];
    });

    const isUserInGame = computed(() => {
      return roomState.value.players.some((player) => player.id === store.state.user?.id);
    });

    const isUserLeader = computed(() => {
      return roomState.value.leaderID === store.state.user?.id;
    });

    const isPlayerLeader = computed(() => {
      if (roomState.value.stage === 'created') {
        return roomState.value.leaderID === store.state.user?.id;
      }
    });

    const isStartGameDisabled = computed(() => {
      return (
        roomState.value.stage !== 'locked' || roomState.value.players.length < 5 || roomState.value.players.length > 10
      );
    });

    const players = computed(() => {
      if (roomState.value.stage === 'started') {
        return roomState.value.game.players;
      }

      return roomState.value.players;
    });

    const joinClick = () => {
      socket.emit(isUserInGame.value ? 'leaveGame' : 'joinGame', roomState.value.roomID);
    };

    const lockClick = () => {
      socket.emit('lockRoom', roomState.value.roomID);
    };

    const startClick = () => {
      socket.emit('startGame', roomState.value.roomID);
    };

    const calculateRotate = (i: number, negative: boolean = false) => {
      return `rotate(${negative ? '-' : ''}${(360 / roomState.value.players.length) * i + 180}deg)`;
    };

    const playerClick = (uuid: string) => {
      if (isPlayerLeader.value) {
        socket.emit('selectPlayer', roomState.value.roomID, uuid);
      }
    };

    return {
      roomState,
      currentGameStage,
      players,

      isUserLeader,
      isUserInGame,
      isStartGameDisabled,

      calculateRotate,
      joinClick,
      lockClick,
      startClick,
      playerClick,
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
