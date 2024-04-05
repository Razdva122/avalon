<template>
  <v-btn class="host-panel" color="grey" @click="overlay = !overlay"> Host </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="host-actions d-flex flex-column align-center pa-4 rounded-lg">
      <h2 class="mb-4">Host panel</h2>
      <div class="button-container" v-if="roomStage === 'started'">
        <div class="hint">The buttons will start voting for the end or restart of the game</div>
        <v-btn color="info mb-2" @click="endGame"> End game </v-btn>
        <v-btn color="info" @click="restartGame"> Restart game </v-btn>
      </div>
      <div class="button-container" v-else>
        <div class="hint">Shuffle players positions in lobby</div>
        <v-btn color="info" @click="shuffle"> Shuffle </v-btn>
      </div>
    </div>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { TRoomState } from '@avalon/types';
import { socket } from '@/api/socket';

export default defineComponent({
  props: {
    roomUuid: {
      required: true,
      type: String,
    },
    roomStage: {
      required: true,
      type: String as PropType<TRoomState['stage']>,
    },
  },
  data: () => ({
    overlay: false,
  }),
  methods: {
    endGame() {
      socket.emit('endGame', this.roomUuid);
    },
    restartGame() {
      socket.emit('endAndRestartGame', this.roomUuid);
    },
    shuffle() {
      socket.emit('shuffle', this.roomUuid);
    },
  },
});
</script>

<style scoped lang="scss">
.host-panel {
  position: fixed;
  right: -28px;
  top: 47%;
  transform: rotate(270deg);
}

.host-actions {
  background-color: white;
  width: 300px;
  max-height: 80vh;
  overflow-y: auto;
}

.hint {
  margin-bottom: 4px;
  font-size: 12px;
}

.button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}
</style>
