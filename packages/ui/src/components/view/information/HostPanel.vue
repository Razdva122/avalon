<template>
  <v-btn class="host-panel" color="grey" @click="overlay = !overlay"> Host </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="host-actions d-flex flex-column align-center pa-4 rounded-lg">
      <h2>Host panel</h2>
      <div class="hint">The buttons will start voting for the end or restart of the game</div>
      <v-btn color="info mb-2" @click="endGame"> End game </v-btn>
      <v-btn color="info" @click="restartGame"> Restart game </v-btn>
    </div>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { socket } from '@/api/socket';

export default defineComponent({
  props: {
    roomUuid: {
      required: true,
      type: String,
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
</style>
