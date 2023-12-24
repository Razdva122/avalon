<template>
  <div class="room">
    <template v-if="roomState.stage === 'unavailable'">
      <h1>This is wrong uuid</h1>
    </template>

    <template v-else>
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
        >
          <Player :player="player" :style="{ transform: 'translateY(-50%) ' + calculateRotate(i, true) }" />
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import Player from '@/components/Player.vue';
import type { TGameStage, TRoomState } from '@avalon/types';
import { socket } from '@/api/socket';
import { useStore } from '@/store';

export default defineComponent({
  name: 'Room',
  components: {
    Player,
  },
  props: {
    uuid: {
      required: true,
      type: String,
    },
  },
  async setup(props) {
    const stage = ref<TGameStage | undefined>(undefined);
    const store = useStore();
    let roomState = ref<TRoomState>(await socket.emitWithAck('joinRoom', props.uuid));

    const currentGameStage = computed(() => {
      const stages = {
        initialization: 'The game is being initialized...',
        selectTeam: 'The leader chooses the team.',
        votingForTeam: 'The round table votes for the selected team.',
        onMission: 'The selected team is on a mission.',
        selectMerlin: "Mordred's minions are trying to figure out Merlin.",
        end: 'The game is over.',
        created: 'The game has been created, we are waiting for the players to connect',
        locked: 'The game is locked, we are waiting for the start of the game',
        started: 'The game has started',
        unavailable: 'The game is not available',
      } as const;

      return stages[stage.value || roomState.value.stage];
    });

    const isUserInGame = computed(() => {
      return roomState.value.stage === 'unavailable'
        ? false
        : roomState.value.players.some((player) => player.id === store.state.user?.id);
    });

    const isUserLeader = computed(() => {
      return roomState.value.stage === 'unavailable' ? false : roomState.value.leaderID === store.state.user?.id;
    });

    const joinClick = () => {
      if (roomState.value.stage !== 'unavailable') {
        socket.emit(isUserInGame.value ? 'leaveGame' : 'joinGame', roomState.value.roomID);
      }
    };

    const lockClick = () => {
      if (roomState.value.stage !== 'unavailable') {
        socket.emit('lockRoom', roomState.value.roomID);
      }
    };

    const calculateRotate = (i: number, negative: boolean = false) => {
      if (roomState.value.stage !== 'unavailable') {
        return `rotate(${negative ? '-' : ''}${(360 / roomState.value.players.length) * i + 180}deg)`;
      }
    };

    socket.on('roomUpdated', (state) => {
      roomState.value = state;
    });

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

  beforeRouteLeave() {
    socket.emit('leaveRoom', this.$props.uuid);
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
