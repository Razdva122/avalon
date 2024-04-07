<template>
  <div class="room d-flex flex-column align-center justify-space-around">
    <template v-if="errorMessage">
      <h1 class="mb-4">{{ errorMessage.error }}</h1>
      <v-btn size="x-large" @click="$router.push({ name: 'lobby' })">Back to lobby</v-btn>
    </template>
    <template v-else>
      <v-btn v-if="displayRestartButton" @click="restartGame" class="restart-button">Restart game</v-btn>
      <Board :room-state="roomState">
        <template v-slot:content>
          <RoomVote v-if="roomState.vote" :roomUuid="roomState.roomID" :vote="roomState.vote" />
        </template>
      </Board>
      <RolesInfo v-if="roomState.stage === 'started'" :game-roles="game.settings.roles" :visible-roles="visibleRoles" />
      <HostPanel v-if="displayHostPanel" :roomUuid="roomState.roomID" :roomStage="roomState.stage" />
    </template>
  </div>
</template>

<script lang="ts">
import { useRouter } from 'vue-router';
import { defineComponent, ref, computed } from 'vue';
import Board from '@/components/view/board/Board.vue';
import type { TVisibleRole, ISocketError } from '@avalon/types';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { GameStateManager } from '@/helpers/game-state-manager';
import RolesInfo from '@/components/view/information/RolesInfo.vue';
import HostPanel from '@/components/view/panels/HostPanel.vue';
import RoomVote from '@/components/view/panels/RoomVote.vue';

export default defineComponent({
  name: 'Room',
  components: {
    Board,
    RolesInfo,
    HostPanel,
    RoomVote,
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
      if (state.roomID === props.uuid) {
        stateManager.mutateRoomState({ newRoomState: state, userID });
      }
    });

    socket.on('gameUpdated', (game) => {
      if (game.uuid === props.uuid && roomState.value.stage === 'started') {
        stateManager.mutateRoomState({ newGameState: game, userID });
      }
    });

    socket.on('restartGame', (uuid) => {
      router.push({ name: 'room', params: { uuid } });
      initState(uuid);
    });

    const displayHostPanel = computed(() => {
      return roomState.value.leaderID === userID;
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
      displayHostPanel,
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

.room {
  width: 100vw;
  height: 100%;
}
</style>
