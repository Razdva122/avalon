<template>
  <div class="room d-flex flex-column align-center mt-8">
    <template v-if="roomState.stage === 'unavailable'">
      <h1 class="text-white">This is wrong uuid</h1>
    </template>
    <template v-else>
      <v-btn v-if="displayRestartButton" @click="restartGame">Restart game</v-btn>
      <Board :room-state="roomState as unknown as TAvailableRoomStateRef" />
      <RolesInfo v-if="roomState.stage === 'started'" :game-roles="game.settings.roles" :visible-roles="visibleRoles" />
    </template>
  </div>
</template>

<script lang="ts">
import { useRouter } from 'vue-router';
import { defineComponent, ref, provide, Ref, computed } from 'vue';
import Board from '@/components/game/board/Board.vue';
import type { TRoomState, TVisibleRole, IVisualGameState } from '@avalon/types';
import { socket } from '@/api/socket';
import { gameStateKey, TPageRoomStateRef, TAvailableRoomStateRef } from '@/pages/room/const';
import { mutateRoomGameForPosition, mutateRoomState } from '@/pages/room/helpers';
import { useStore } from '@/store';
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
    let roomState = ref() as TPageRoomStateRef;
    const alert = ref<boolean>(true);
    const store = useStore();
    const router = useRouter();

    const game = computed(() => {
      if (roomState.value.stage === 'started') {
        return roomState.value.gameStates[roomState.value.pointer];
      }
    }) as Ref<IVisualGameState>;

    provide(gameStateKey, game);

    const initState = async (uuid: string) => {
      const stateFromBackend = await socket.emitWithAck('joinRoom', uuid);
      syncState(stateFromBackend);
    };

    await initState(props.uuid);

    const userID = store.state.user?.id;

    function syncState(state: TRoomState) {
      if (state.stage !== 'unavailable') {
        mutateRoomGameForPosition(state, userID);
      }

      if ('game' in state) {
        mutateRoomGameForPosition(state.game, userID);
      }

      mutateRoomState({ roomState, newRoomState: state });
    }

    socket.on('roomUpdated', (state) => {
      syncState(state);
    });

    socket.on('gameUpdated', (game) => {
      if (roomState.value.stage === 'started') {
        mutateRoomGameForPosition(game, userID);
        mutateRoomState({ roomState, newGameState: game });
      }
    });

    socket.on('restartGame', (uuid) => {
      router.push({ name: 'room', params: { uuid } });
      initState(uuid);
    });

    const displayRestartButton = computed(() => {
      return roomState.value.stage === 'started' && game.value.stage === 'end' && roomState.value.leaderID === userID;
    });

    const restartGame = () => {
      if (roomState.value.stage !== 'unavailable') {
        return socket.emit('restartGame', roomState.value.roomID);
      }
    };

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
</style>
