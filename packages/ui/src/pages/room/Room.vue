<template>
  <div class="room d-flex flex-column align-center mt-8">
    <template v-if="roomState.stage === 'unavailable'">
      <h1>This is wrong uuid</h1>
    </template>
    <template v-else>
      <v-alert
        v-model="alert"
        color="info"
        variant="tonal"
        class="game-stage rounded-xl mb-10"
        closable
        close-label="Close Alert"
        :text="currentGameStage"
      ></v-alert>
      <Board />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, provide, Ref, computed } from 'vue';
import Board from '@/components/game/board/Board.vue';
import type { TRoomState } from '@avalon/types';
import { socket } from '@/api/socket';
import { roomStateKey, TAvailableRoomState, stages } from '@/pages/room/const';
import { mutateRoomGameForPosition } from '@/pages/room/helpers';
import { useStore } from '@/store';

export default defineComponent({
  name: 'Room',
  components: {
    Board,
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

    const currentGameStage = computed(() => {
      if (roomState.value.stage === 'started') {
        return stages[roomState.value.game.stage];
      }

      return stages[roomState.value.stage];
    });

    return {
      roomState,
      currentGameStage,
      alert,
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
