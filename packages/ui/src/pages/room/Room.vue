<template>
  <div class="room d-flex flex-column align-center mt-8">
    <template v-if="errorMessage">
      <h1 class="text-white">{{ errorMessage.error }}</h1>
    </template>
    <template v-else>
      <v-btn v-if="displayRestartButton" @click="restartGame" class="restart-button">Restart game</v-btn>
      <Board :room-state="roomState" />
      <RolesInfo v-if="roomState.stage === 'started'" :game-roles="game.settings.roles" :visible-roles="visibleRoles" />
    </template>
  </div>
</template>

<script lang="ts">
import { useRouter } from 'vue-router';
import { defineComponent, ref, computed } from 'vue';
import Board from '@/components/game/board/Board.vue';
import type { TVisibleRole, ISocketError } from '@avalon/types';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { GameStateManager } from '@/helpers/game-state-manager';
import RolesInfo from '@/components/game/information/RolesInfo.vue';

export default defineComponent({
  name: 'Room',
  components: {
    Board,
    RolesInfo,
  },
  props: {
    uuid: {
      required: true,
      type: String,
    },
  },
  async setup(props) {
    const stateManager = new GameStateManager();
    const alert = ref<boolean>(true);
    const errorMessage = ref<ISocketError>();
    const store = useStore();
    const router = useRouter();

    const roomState = stateManager.state;
    const game = stateManager.game;

    const userID = store.state.user?.id;

    const initState = async (uuid: string) => {
      const stateFromBackend = await socket.emitWithAck('joinRoom', uuid);

      if ('error' in stateFromBackend) {
        errorMessage.value = stateFromBackend;
      } else {
        stateManager.mutateRoomState({ newRoomState: stateFromBackend, userID });
      }
    };

    await initState(props.uuid);

    socket.on('roomUpdated', (state) => {
      stateManager.mutateRoomState({ newRoomState: state, userID });
    });

    socket.on('gameUpdated', (game) => {
      if (roomState.value.stage === 'started') {
        stateManager.mutateRoomState({ newGameState: game, userID });
      }
    });

    socket.on('restartGame', (uuid) => {
      router.push({ name: 'room', params: { uuid } });
      initState(uuid);
    });

    const displayRestartButton = computed(() => {
      return roomState.value.stage === 'started' && game.value.stage === 'end' && roomState.value.leaderID === userID;
    });

    const restartGame = () => socket.emit('restartGame', roomState.value.roomID);

    const visibleRoles = computed(() => {
      if (roomState.value.stage === 'started') {
        return game.value.players.reduce<TVisibleRole[]>((acc, el) => {
          if (!acc.includes(el.role)) {
            acc.push(el.role);
          }

          return acc;
        }, []);
      }

      return [];
    });

    return {
      roomState,
      errorMessage,
      displayRestartButton,
      visibleRoles,
      alert,
      game,
      restartGame,
    };
  },

  beforeRouteLeave() {
    socket.emit('leaveRoom', this.$props.uuid);
  },
});
</script>

<style lang="scss">
.game-stage {
  width: 500px;
  background-color: white;
  font-size: 18px;
}

.restart-button {
  position: absolute;
  top: 450px;
  z-index: 10;
}
</style>
