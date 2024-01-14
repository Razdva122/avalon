<template>
  <div class="room d-flex flex-column align-center mt-8">
    <template v-if="roomState.stage === 'unavailable'">
      <h1 class="text-white">This is wrong uuid</h1>
    </template>
    <template v-else>
      <v-btn v-if="displayRestartButton" @click="restartGame">Restart game</v-btn>
      <Board />
      <RolesInfo v-if="roomState.stage === 'started'" :game-roles="roomState.game.settings.roles" />
    </template>
  </div>
</template>

<script lang="ts">
import { useRouter } from 'vue-router';
import { defineComponent, ref, provide, Ref, computed } from 'vue';
import Board from '@/components/game/board/Board.vue';
import type { TRoomState } from '@avalon/types';
import { socket } from '@/api/socket';
import { roomStateKey, TAvailableRoomState } from '@/pages/room/const';
import { mutateRoomGameForPosition } from '@/pages/room/helpers';
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
    let roomState = ref() as Ref<TRoomState>;
    const alert = ref<boolean>(true);
    const store = useStore();
    const router = useRouter();
    provide(roomStateKey, <TAvailableRoomState>roomState);

    const stateFromBackend = await socket.emitWithAck('joinRoom', props.uuid);
    const userID = store.state.user?.id;

    function syncState(state: TRoomState) {
      if (state.stage !== 'unavailable') {
        mutateRoomGameForPosition(state, userID);
      }

      if ('game' in state) {
        mutateRoomGameForPosition(state.game, userID);
      }

      roomState.value = state;
    }

    syncState(stateFromBackend);

    socket.on('roomUpdated', (state) => {
      syncState(state);
    });

    socket.on('gameUpdated', (game) => {
      if (roomState.value.stage === 'started') {
        mutateRoomGameForPosition(game, userID);
        roomState.value.game = game;
      }
    });

    socket.on('restartGame', (uuid) => {
      router.push({ name: 'room', params: { uuid } });
    });

    const displayRestartButton = computed(() => {
      return (
        roomState.value.stage === 'started' &&
        roomState.value.game.stage === 'end' &&
        roomState.value.leaderID === userID
      );
    });

    const restartGame = () => {
      if (roomState.value.stage !== 'unavailable') {
        return socket.emit('restartGame', roomState.value.roomID);
      }
    };

    return {
      roomState,
      displayRestartButton,
      alert,
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
