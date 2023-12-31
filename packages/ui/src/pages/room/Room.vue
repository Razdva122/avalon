<template>
  <div class="room">
    <template v-if="roomState.stage === 'unavailable'">
      <h1>This is wrong uuid</h1>
    </template>
    <Board v-else />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, provide, Ref } from 'vue';
import Board from '@/components/game/board/Board.vue';
import type { TRoomState } from '@avalon/types';
import { socket } from '@/api/socket';
import { roomStateKey, TAvailableRoomState } from '@/pages/room/const';

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
    provide(roomStateKey, <TAvailableRoomState>roomState);
    roomState.value = await socket.emitWithAck('joinRoom', props.uuid);

    socket.on('roomUpdated', (state) => {
      roomState.value = state;
    });

    socket.on('gameUpdated', (game) => {
      if (roomState.value.stage === 'started') {
        roomState.value.game = game;
      }
    });

    return {
      roomState,
    };
  },

  beforeRouteLeave() {
    socket.emit('leaveRoom', this.$props.uuid);
  },
});
</script>
