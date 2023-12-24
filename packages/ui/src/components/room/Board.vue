<template>
  <div class="board-container">
    <img class="game-board" alt="board" src="../../assets/board.jpeg" />
    <v-alert color="info" variant="tonal" class="game-stage rounded-xl" :text="currentGameStage"></v-alert>
    <div class="actions-container d-flex flex-column">
      <v-btn rounded="lg" variants="tonal" :color="isUserInGame ? 'warning' : 'info'" @click="joinClick">{{
        isUserInGame ? 'Leave Game' : 'Join Game'
      }}</v-btn>
      <template v-if="isUserLeader && (roomState.stage === 'created' || roomState.stage === 'locked')">
        <v-btn class="mt-2" rounded="lg" variants="tonal" color="info" @click="lockClick">{{
          roomState.stage === 'created' ? 'Lock Game' : 'Unlock game'
        }}</v-btn>
      </template>
    </div>
    <div
      class="player-container"
      v-for="(player, i) in roomState.players"
      :style="{ transform: calculateRotate(i) }"
      :key="player.id"
    >
      <Player :player="player" :style="{ transform: 'translateY(-50%) ' + calculateRotate(i, true) }" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, toRef } from 'vue';
import Player from '@/components/Player.vue';
import type { TAvailableRoom, TGameStage } from '@avalon/types';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { stages } from '@/components/room/const';

export default defineComponent({
  name: 'Board',
  components: {
    Player,
  },
  props: {
    roomState: {
      required: true,
      type: Object as PropType<TAvailableRoom>,
    },
  },
  async setup(props) {
    const stage = ref<TGameStage | undefined>(undefined);
    const roomState = toRef(props, 'roomState');
    const store = useStore();

    const currentGameStage = computed(() => {
      return stages[stage.value || roomState.value.stage];
    });

    const isUserInGame = computed(() => {
      return roomState.value.players.some((player) => player.id === store.state.user?.id);
    });

    const isUserLeader = computed(() => {
      return roomState.value.leaderID === store.state.user?.id;
    });

    const joinClick = () => {
      socket.emit(isUserInGame.value ? 'leaveGame' : 'joinGame', roomState.value.roomID);
    };

    const lockClick = () => {
      socket.emit('lockRoom', roomState.value.roomID);
    };

    const calculateRotate = (i: number, negative: boolean = false) => {
      return `rotate(${negative ? '-' : ''}${(360 / roomState.value.players.length) * i + 180}deg)`;
    };

    return {
      roomState,
      stage,
      currentGameStage,

      isUserLeader,
      isUserInGame,

      calculateRotate,
      joinClick,
      lockClick,
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
