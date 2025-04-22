<template>
  <v-btn class="host-panel" color="grey" @click="overlay = !overlay"> {{ $t('hostMenu.host') }} </v-btn>
  <v-overlay v-model="overlay" class="align-center justify-center">
    <div class="host-actions d-flex flex-column align-center pa-4 rounded-lg">
      <h2 class="mb-4">{{ $t('hostMenu.hostPanel') }}</h2>
      <div class="button-container" v-if="roomStage === 'started'">
        <div class="hint">{{ $t('hostMenu.endRestartGameHint') }}</div>
        <v-btn color="info" class="mb-2" @click="endGame"> {{ $t('hostMenu.endGame') }} </v-btn>
        <v-btn color="info" @click="restartGame"> {{ $t('hostMenu.restartGame') }} </v-btn>
      </div>
      <div class="button-container" v-else>
        <div class="hint">{{ $t('hostMenu.shuffleHint') }}</div>
        <v-btn color="info" @click="shuffle"> {{ $t('hostMenu.shuffle') }} </v-btn>
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
      this.overlay = false;
      socket.emit('endGame', this.roomUuid);
    },
    restartGame() {
      this.overlay = false;
      socket.emit('endAndRestartGame', this.roomUuid);
    },
    shuffle() {
      this.overlay = false;
      socket.emit('shuffle', this.roomUuid);
    },
  },
});
</script>

<style scoped lang="scss">
.host-actions {
  background-color: rgb(var(--v-theme-surface));
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
