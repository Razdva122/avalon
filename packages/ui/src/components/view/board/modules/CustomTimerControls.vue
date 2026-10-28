<template>
  <div v-if="isRoomLeader" class="custom-timer-controls" :class="{ 'timer-toolbar': compact }">
    <div class="timer-quick-row">
      <label class="timer-player">
        <span>{{ $t('timerUi.turn') }}</span>
        <select :value="timerPlayerID || ''" :disabled="!canManage" @change="setTimerPlayer">
          <option value="">{{ $t('timerUi.unassigned') }}</option>
          <option v-for="player in timerPlayers" :key="player.id" :value="player.id">{{ player.name }}</option>
        </select>
      </label>
      <v-btn
        class="timer-next"
        color="primary"
        variant="flat"
        min-height="44"
        :disabled="!canManage || !nextTimerPlayer || durationError"
        :aria-label="nextTimerPlayer ? $t('timerUi.nextPlayer', { name: nextTimerPlayer.name }) : $t('timerUi.next')"
        :title="$t('timerUi.nextHint', { time: durationLabel })"
        @click="nextPlayer"
      >
        <span class="timer-next-full">{{
          nextTimerPlayer ? $t('timerUi.nextPlayer', { name: nextTimerPlayer.name }) : $t('timerUi.next')
        }}</span>
        <span class="timer-next-short">{{ $t('timerUi.next') }}</span>
        <span class="material-icons" aria-hidden="true">arrow_forward</span>
      </v-btn>
      <v-btn
        v-if="compact"
        class="timer-more"
        icon
        color="text-primary"
        variant="text"
        :aria-label="$t('timerUi.controls')"
        :title="$t('timerUi.controls')"
        :disabled="!canManage"
        @click="settingsOpen = true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </v-btn>
    </div>

    <div class="timer-settings">
      <div class="timer-duration-row">
        <label class="timer-duration">
          <span>{{ $t('timerUi.perTurn') }}</span>
          <select :value="durationChoice" :disabled="!canManage" @change="onDurationChoice">
            <option v-for="seconds in durationPresets" :key="seconds" :value="String(seconds)">
              {{ formatDuration(seconds) }}
            </option>
            <option value="custom">{{ $t('timerUi.customDuration') }}</option>
          </select>
        </label>
        <label v-if="durationChoice === 'custom'" class="timer-custom-duration">
          <span>{{ $t('timerUi.seconds') }}</span>
          <input
            type="number"
            inputmode="numeric"
            min="1"
            max="86400"
            step="1"
            :value="customDurationDraft"
            :disabled="!canManage"
            :aria-invalid="durationError || undefined"
            @input="onCustomDurationChange"
          />
        </label>
      </div>
      <p v-if="durationError" class="timer-duration-error" role="alert">{{ $t('timerUi.durationRange') }}</p>
      <p class="timer-settings-hint">{{ $t('timerUi.durationHint') }}</p>
      <div class="timer-action-row">
        <v-btn
          class="timer-toggle"
          :color="isTimerActive ? 'error' : 'primary'"
          variant="outlined"
          min-height="44"
          :disabled="!canManage || (!isTimerActive && durationError)"
          @click="isTimerActive ? stopTimer() : startTimer()"
        >
          <span class="material-icons" aria-hidden="true">{{ isTimerActive ? 'stop' : 'play_arrow' }}</span>
          {{ $t(isTimerActive ? 'timerUi.stop' : 'timerUi.start') }}
        </v-btn>
        <v-btn
          class="timer-add"
          variant="text"
          color="primary"
          min-height="44"
          :disabled="!canManage || !isTimerActive"
          :title="$t('timerUi.addCurrentHint')"
          @click="addMinutes(1)"
        >
          {{ $t('timerUi.addMinutes', { count: 1 }) }}
        </v-btn>
        <span class="timer-run-state" role="status">{{
          $t(isTimerActive ? 'timerUi.running' : 'timerUi.stopped')
        }}</span>
      </div>
    </div>

    <v-dialog
      v-if="compact"
      v-model="settingsOpen"
      max-width="420"
      class="timer-settings-dialog"
      :aria-label="$t('timerUi.controls')"
    >
      <v-card class="timer-settings-card">
        <header class="timer-settings-header">
          <h2>{{ $t('timerUi.controls') }}</h2>
          <v-btn
            icon="close"
            color="text-primary"
            variant="text"
            :aria-label="$t('hostMenu.close')"
            @click="settingsOpen = false"
          />
        </header>
        <CustomTimerControls :roomID="roomID" :leaderID="leaderID" />
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, inject, ref, watch } from 'vue';
import { useStore } from '@/store';
import { socket } from '@/api/socket';
import { gameStateKey, stateManagerKey } from '@/helpers/game-state-manager';

export default defineComponent({
  name: 'CustomTimerControls',
  props: {
    roomID: { type: String, required: true },
    leaderID: { type: String, required: true },
    compact: { type: Boolean, default: false },
  },
  setup(props) {
    const store = useStore();
    const gameState = inject(gameStateKey)!;
    const stateManager = inject(stateManagerKey)!;
    const settingsOpen = ref(false);
    const durationPresets = [60, 120, 300];
    const showCustomDuration = ref(false);
    const durationError = ref(false);
    const isRoomLeader = computed(() => store.state.profile?.id === props.leaderID);
    const isTimerActive = computed(() => Boolean(gameState.value.timer?.active && gameState.value.timer?.isCustom));
    const canManage = computed(
      () =>
        isRoomLeader.value &&
        stateManager.viewMode.value === 'live' &&
        gameState.value.stage !== 'end' &&
        gameState.value.timer?.isCustom,
    );
    const timerPlayerID = computed(() => gameState.value.timer?.playerID);
    const durationSeconds = computed(() => gameState.value.timer?.durationSeconds ?? 60);
    const customDurationDraft = ref(durationSeconds.value);
    watch(durationSeconds, (seconds, previous) => {
      if (customDurationDraft.value === previous) customDurationDraft.value = seconds;
    });
    const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    const durationLabel = computed(() => formatDuration(durationSeconds.value));
    const durationChoice = computed(() =>
      showCustomDuration.value || !durationPresets.includes(durationSeconds.value)
        ? 'custom'
        : String(durationSeconds.value),
    );
    const timerPlayers = computed(() =>
      [...gameState.value.players]
        .sort((a, b) => a.index - b.index)
        .map((player) => {
          const user = store.state.users[player.id];
          return { id: player.id, name: user?.status === 'ready' ? user.profile.name : '…' };
        }),
    );
    const nextTimerPlayer = computed(() => {
      const index = timerPlayers.value.findIndex((player) => player.id === timerPlayerID.value);
      return index < 0 ? undefined : timerPlayers.value[(index + 1) % timerPlayers.value.length];
    });
    watch(canManage, (allowed) => {
      if (!allowed) settingsOpen.value = false;
    });
    const setTimerPlayer = (event: Event) => {
      if (canManage.value)
        socket.emit('setCustomTimerPlayer', props.roomID, (event.target as HTMLSelectElement).value || null);
    };
    const nextPlayer = () => {
      if (canManage.value && nextTimerPlayer.value && !durationError.value)
        socket.emit('nextCustomTimerPlayer', props.roomID);
    };
    const setDuration = (seconds: number) => {
      if (!canManage.value) return;
      durationError.value = !Number.isInteger(seconds) || seconds < 1 || seconds > 86400;
      if (!durationError.value) socket.emit('setCustomTimerDuration', props.roomID, seconds);
    };
    const onDurationChoice = (event: Event) => {
      const value = (event.target as HTMLSelectElement).value;
      showCustomDuration.value = value === 'custom';
      durationError.value = false;
      if (showCustomDuration.value) customDurationDraft.value = durationSeconds.value;
      if (!showCustomDuration.value) setDuration(Number(value));
    };
    const onCustomDurationChange = (event: Event) => {
      customDurationDraft.value = Number((event.target as HTMLInputElement).value);
      setDuration(customDurationDraft.value);
    };
    const addMinutes = (minutes: number) => {
      if (canManage.value && isTimerActive.value) socket.emit('addCustomTimerTime', props.roomID, minutes * 60);
    };
    const startTimer = () => {
      if (canManage.value && !durationError.value) socket.emit('startCustomTimer', props.roomID);
    };
    const stopTimer = () => {
      if (canManage.value) socket.emit('stopCustomTimer', props.roomID);
    };
    return {
      isRoomLeader,
      isTimerActive,
      canManage,
      timerPlayerID,
      timerPlayers,
      nextTimerPlayer,
      durationSeconds,
      customDurationDraft,
      durationLabel,
      durationChoice,
      durationPresets,
      showCustomDuration,
      durationError,
      settingsOpen,
      formatDuration,
      setTimerPlayer,
      nextPlayer,
      setDuration,
      onDurationChoice,
      onCustomDurationChange,
      addMinutes,
      startTimer,
      stopTimer,
    };
  },
});
</script>

<style scoped lang="scss">
.custom-timer-controls {
  display: grid;
  gap: 12px;
  min-width: 0;
}
.timer-quick-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: end;
  gap: 8px;
}
.timer-player,
.timer-duration,
.timer-custom-duration {
  display: grid;
  gap: 4px;
  min-width: 0;
  font-size: 12px;
}
.timer-player select,
.timer-duration select,
.timer-custom-duration input {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid rgb(var(--v-theme-inset-hover));
  border-radius: 6px;
  color: rgb(var(--v-theme-text-primary));
  background: rgb(var(--v-theme-inset));
  font-size: 14px;
}
.timer-player select:focus-visible,
.timer-duration select:focus-visible,
.timer-custom-duration input:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.custom-timer-controls :deep(.v-btn) {
  min-width: 0;
  padding-inline: 12px;
  letter-spacing: 0;
  text-transform: none;
  font-size: 13px;
}
.timer-next {
  max-width: 100%;
  width: 100%;
}
.timer-next :deep(.v-btn__content) {
  min-width: 0;
  gap: 6px;
}
.timer-next-full {
  overflow: hidden;
  white-space: normal;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.2;
}
.timer-next-short,
.timer-more {
  display: none;
}
.timer-settings {
  display: grid;
  gap: 8px;
}
.timer-duration-row,
.timer-action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.timer-duration,
.timer-custom-duration {
  flex: 1;
  min-width: 100px;
}
.timer-custom-duration input {
  max-width: 150px;
}
.timer-action-row .material-icons {
  font-size: 18px;
  margin-right: 5px;
}
.timer-settings-hint,
.timer-run-state {
  font-size: 12px;
  line-height: 1.4;
  color: rgba(var(--v-theme-text-primary), 0.7);
}
.timer-settings-hint {
  margin: 0;
}
.timer-duration-error {
  font-size: 12px;
  color: rgb(var(--v-theme-error));
  margin: 0;
}
.timer-toolbar {
  width: min(560px, calc(100vw - 24px));
}
.timer-toolbar .timer-settings-hint,
.timer-toolbar .timer-run-state {
  display: none;
}
.timer-toolbar .timer-settings {
  grid-template-columns: minmax(110px, 1fr) auto;
  align-items: end;
}
.timer-toolbar .timer-action-row {
  flex-wrap: nowrap;
}
.timer-settings-card {
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}
.timer-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.timer-settings-header h2 {
  font-size: 18px;
}
@media (min-width: 960px) {
  .timer-toolbar {
    display: flex;
    align-items: flex-end;
    width: max-content;
    max-width: calc(100vw - 32px);
    gap: 8px;
  }
  .timer-toolbar > .timer-quick-row,
  .timer-toolbar > .timer-settings {
    display: contents;
  }
  .timer-toolbar .timer-player {
    width: 150px;
  }
  .timer-toolbar .timer-duration-row {
    order: 1;
    flex-wrap: nowrap;
  }
  .timer-toolbar .timer-duration,
  .timer-toolbar .timer-custom-duration {
    min-width: 0;
    width: 100px;
    flex: none;
  }
  .timer-toolbar .timer-action-row {
    order: 2;
  }
  .timer-toolbar .timer-next {
    width: 180px;
    order: 3;
  }
  .timer-toolbar .timer-duration-error {
    order: 4;
  }
}
@media (max-width: 959px) {
  .timer-toolbar {
    width: min(360px, calc(100vw - 32px));
  }
  .timer-toolbar > .timer-quick-row {
    grid-template-columns: minmax(0, 1fr) auto 44px;
    align-items: center;
  }
  .timer-toolbar > .timer-settings,
  .timer-toolbar .timer-next-full {
    display: none;
  }
  .timer-toolbar > .timer-quick-row .timer-player > span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .timer-toolbar .timer-next-short {
    display: inline;
  }
  .timer-toolbar .timer-more {
    display: inline-flex;
    width: 44px;
    height: 44px;
    padding: 0;
  }
  .timer-toolbar .timer-player select {
    font-size: 13px;
    padding-inline: 6px;
  }
  .timer-toolbar .timer-next {
    max-width: 150px;
    padding-inline: 10px;
  }
  .timer-settings-dialog :deep(.v-overlay__content) {
    align-self: flex-end;
    width: 100%;
    max-width: 100% !important;
    margin: 0;
  }
  .timer-settings-card {
    border-radius: 14px 14px 0 0;
  }
}
</style>
