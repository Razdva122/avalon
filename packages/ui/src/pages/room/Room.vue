<template>
  <div class="room">
    <template v-if="roomState.stage === 'unavailable'">
      <h1>This is wrong uuid</h1>
    </template>
    <Board v-else :roomState="roomState" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import Board from '@/components/room/Board.vue';
import type { TRoomState } from '@avalon/types';
import { socket } from '@/api/socket';

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
    let roomState = ref<TRoomState>(await socket.emitWithAck('joinRoom', props.uuid));

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
