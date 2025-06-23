<template>
  <div class="custom-timer-controls" v-if="isRoomLeader">
    <div class="timer-buttons">
      <v-btn color="primary" size="medium" @click="addMinutes(1)">+1</v-btn>
      <v-btn color="primary" size="medium" @click="addMinutes(2)">+2</v-btn>
      <v-btn color="primary" size="medium" @click="addMinutes(5)">+5</v-btn>
    </div>
    <div class="timer-controls">
      <v-btn
        :color="isTimerActive ? 'error' : 'success'"
        size="medium"
        @click="isTimerActive ? stopTimer() : startTimer()"
      >
        {{ isTimerActive ? $t('game.stop') : $t('game.start') }}
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, inject } from 'vue';
import { useStore } from '@/store';
import { socket } from '@/api/socket';
import { gameStateKey } from '@/helpers/game-state-manager';

export default defineComponent({
  name: 'CustomTimerControls',
  props: {
    roomID: {
      type: String,
      required: true,
    },
    leaderID: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();
    const gameState = inject(gameStateKey)!;

    const isRoomLeader = computed(() => {
      return store.state.profile?.id === props.leaderID;
    });

    const isTimerActive = computed(() => {
      return gameState.value.timer?.active && gameState.value.timer?.isCustom;
    });

    const addMinutes = (minutes: number) => {
      if (isTimerActive.value) {
        // Добавить минуты к существующему таймеру
        socket.emit('addCustomTimerTime', props.roomID, minutes * 60);
      } else {
        // Запустить новый таймер
        socket.emit('startCustomTimer', props.roomID, minutes * 60);
      }
    };

    const startTimer = () => {
      socket.emit('startCustomTimer', props.roomID, 1 * 60);
    };

    const stopTimer = () => {
      socket.emit('stopCustomTimer', props.roomID);
    };

    return {
      isRoomLeader,
      isTimerActive,
      addMinutes,
      startTimer,
      stopTimer,
    };
  },
});
</script>

<style scoped lang="scss">
.custom-timer-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.timer-buttons {
  display: flex;
  gap: 10px;
}

.timer-controls {
  display: flex;
  justify-content: center;
}
</style>
