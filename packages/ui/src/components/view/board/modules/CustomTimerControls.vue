<template>
  <div class="custom-timer-controls" v-if="isRoomLeader">
    <v-menu location="top" :close-on-content-click="true">
      <template #activator="{ props }">
        <v-btn v-bind="props" class="timer-add" variant="text" color="primary" min-height="44">{{
          $t('timerUi.addTime')
        }}</v-btn>
      </template>
      <v-list class="timer-presets" :aria-label="$t('timerUi.addTime')">
        <v-list-item
          v-for="minutes in [1, 2, 5]"
          :key="minutes"
          :title="$t('timerUi.addMinutes', { count: minutes })"
          @click="addMinutes(minutes)"
        />
      </v-list>
    </v-menu>
    <v-btn
      class="timer-toggle"
      :icon="isTimerActive ? 'stop' : 'play_arrow'"
      :aria-label="$t(isTimerActive ? 'game.stop' : 'game.start')"
      :title="$t(isTimerActive ? 'game.stop' : 'game.start')"
      :color="isTimerActive ? 'error' : 'success'"
      variant="text"
      min-height="44"
      @click="isTimerActive ? stopTimer() : startTimer()"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, inject } from 'vue';
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
      if (!isRoomLeader.value) return;
      if (isTimerActive.value) {
        // Добавить минуты к существующему таймеру
        socket.emit('addCustomTimerTime', props.roomID, minutes * 60);
      } else {
        // Запустить новый таймер
        socket.emit('startCustomTimer', props.roomID, minutes * 60);
      }
    };

    const startTimer = () => {
      if (isRoomLeader.value) socket.emit('startCustomTimer', props.roomID, 1 * 60);
    };

    const stopTimer = () => {
      if (isRoomLeader.value) socket.emit('stopCustomTimer', props.roomID);
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
  align-items: center;
  gap: 0;
}
.custom-timer-controls :deep(.v-btn) {
  min-width: 0;
  padding-inline: 8px;
  font-size: 13px;
  letter-spacing: 0;
  text-transform: none;
}
.timer-toggle {
  width: 44px;
  height: 44px;
}
.timer-presets {
  min-width: 140px;
}
.timer-presets :deep(.v-list-item) {
  min-height: 44px;
}
</style>
