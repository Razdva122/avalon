<template>
  <aside class="room-voice" :aria-label="$t('voice.title')">
    <button class="voice-launcher" type="button" :aria-expanded="open" @click="open = !open">
      <span class="voice-symbol" aria-hidden="true">◖))</span>
      <span>{{ $t('voice.title') }}</span>
      <span v-if="voice.status.value === 'connected'" class="voice-live" aria-hidden="true" />
    </button>
    <div v-if="open" class="voice-panel">
      <header class="voice-heading">
        <strong>{{ $t('voice.title') }}</strong>
        <button type="button" :aria-label="$t('voice.close')" @click="open = false">×</button>
      </header>
      <div class="voice-body">
        <label v-if="voice.state.value.canManage" class="voice-setting">
          <span>{{ $t('voice.roomSetting') }}</span>
          <input
            type="checkbox"
            :checked="voice.state.value.enabled"
            :disabled="!voice.state.value.available"
            @change="toggleRoom"
          />
        </label>
        <p v-if="!voice.state.value.available" class="voice-note">{{ $t('voice.unavailable') }}</p>
        <p v-else-if="!voice.state.value.enabled" class="voice-note">{{ $t('voice.disabled') }}</p>
        <p v-else-if="!voice.state.value.canJoin" class="voice-note">{{ $t('voice.spectator') }}</p>
        <template v-else>
          <p v-if="voice.error.value" class="voice-error" role="alert">{{ errorText }}</p>
          <div class="voice-actions">
            <button
              v-if="voice.status.value === 'idle' || voice.status.value === 'error'"
              type="button"
              @click="voice.join"
            >
              {{ voice.status.value === 'error' ? $t('voice.retry') : $t('voice.join') }}
            </button>
            <span v-if="voice.status.value === 'connecting'" role="status">{{ $t('voice.connecting') }}</span>
            <template v-if="voice.status.value === 'connected'">
              <button
                type="button"
                :disabled="voice.microphonePending.value"
                @click="voice.setMicrophoneEnabled(!voice.microphoneEnabled.value)"
              >
                {{ voice.microphoneEnabled.value ? $t('voice.micOn') : $t('voice.micOff') }}
              </button>
              <button type="button" class="voice-secondary" @click="voice.leave">{{ $t('voice.leave') }}</button>
            </template>
          </div>
          <button v-if="voice.playbackBlocked.value" type="button" class="voice-secondary" @click="voice.startAudio">
            {{ $t('voice.resumeAudio') }}
          </button>
          <template v-if="voice.status.value === 'connected'">
            <label class="voice-volume">
              <span>{{ $t('voice.masterVolume') }}</span
              ><span>{{ voice.masterVolume.value }}%</span>
              <input type="range" min="0" max="100" :value="voice.masterVolume.value" @input="setMasterVolume" />
            </label>
            <p class="voice-roster-title">{{ $t('voice.participants') }}</p>
            <p class="voice-self">
              {{ $t('voice.you') }} · {{ voice.microphoneEnabled.value ? $t('voice.micOn') : $t('voice.micOff') }}
            </p>
            <p v-if="!voice.participants.value.length" class="voice-note">{{ $t('voice.noOthers') }}</p>
            <div v-for="participant in voice.participants.value" :key="participant.sessionID" class="voice-person">
              <strong>{{ displayName(participant.userID) }}</strong>
              <label class="voice-volume">
                <span>{{ $t('voice.personVolume', { name: displayName(participant.userID) }) }}</span>
                <span>{{ participant.volume }}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  :value="participant.volume"
                  @input="setUserVolume(participant.userID, $event)"
                />
              </label>
              <button
                type="button"
                class="voice-secondary"
                :aria-pressed="participant.muted"
                @click="voice.setUserMuted(participant.userID, !participant.muted)"
              >
                {{ participant.muted ? $t('voice.unmutePerson') : $t('voice.mutePerson') }}
              </button>
            </div>
          </template>
        </template>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { createRoomVoice } from '@/helpers/composables/useRoomVoice';
import { loadLiveKitVoiceClient } from '@/helpers/composables/liveKitVoiceClient';

const props = defineProps<{ roomUuid: string; seatIds: string }>();
const store = useStore();
const { t } = useI18n();
const open = ref(false);
const preferenceStore = (() => {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
})();
const voice = createRoomVoice(
  props.roomUuid,
  {
    getVoiceState: (roomID) => socket.timeout(10000).emitWithAck('getVoiceState', roomID),
    setVoiceEnabled: (roomID, enabled) => socket.timeout(10000).emitWithAck('setVoiceEnabled', roomID, enabled),
    joinVoice: (roomID) => socket.timeout(10000).emitWithAck('joinVoice', roomID),
    leaveVoice: (sessionID) => socket.timeout(10000).emitWithAck('leaveVoice', sessionID),
  },
  loadLiveKitVoiceClient,
  preferenceStore,
);
const errorText = computed(() => {
  const code = voice.error.value;
  if (code === 'disconnected') return t('voice.disconnected');
  if (code === 'forbidden') return t('voice.forbidden');
  if (code === 'unavailable') return t('voice.unavailable');
  if (code === 'rateLimited') return t('voice.rateLimited');
  return t('voice.failed');
});
const displayName = (userID: string) => {
  const user = store.state.users[userID];
  return user?.status === 'ready' ? user.profile.name : userID.slice(0, 8);
};
const toggleRoom = (event: Event) => void voice.setEnabled((event.target as HTMLInputElement).checked);
const setMasterVolume = (event: Event) => voice.setMasterVolume(Number((event.target as HTMLInputElement).value));
const setUserVolume = (userID: string, event: Event) =>
  voice.setUserVolume(userID, Number((event.target as HTMLInputElement).value));
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let lastRefresh = 0;
const refresh = () => {
  lastRefresh = Date.now();
  void voice.refresh();
};
const scheduleRefresh = () => {
  if (refreshTimer) return;
  refreshTimer = setTimeout(
    () => {
      refreshTimer = undefined;
      refresh();
    },
    Math.max(0, 2000 - (Date.now() - lastRefresh)),
  );
};
const stateChanged = (roomID: string) => {
  if (roomID === props.roomUuid) scheduleRefresh();
};
const revoked = (sessionID: string) => void voice.revoke(sessionID);
const disconnected = () => voice.disconnected();
const connected = () => scheduleRefresh();
watch(
  () => props.roomUuid,
  (roomID) => {
    clearTimeout(refreshTimer);
    refreshTimer = undefined;
    lastRefresh = Date.now();
    void voice.setRoom(roomID);
  },
  { flush: 'sync' },
);
watch(() => props.seatIds, scheduleRefresh);
watch(
  () => voice.participants.value.map((participant) => participant.userID).join(','),
  () => {
    for (const participant of voice.participants.value)
      void store.dispatch('getUserPublicProfile', { uuid: participant.userID });
  },
);
onMounted(() => {
  socket.on('voiceStateChanged', stateChanged);
  socket.on('voiceRevoked', revoked);
  socket.on('disconnect', disconnected);
  socket.on('connect', connected);
  refresh();
});
onUnmounted(() => {
  socket.off('voiceStateChanged', stateChanged);
  socket.off('voiceRevoked', revoked);
  socket.off('disconnect', disconnected);
  socket.off('connect', connected);
  clearTimeout(refreshTimer);
  voice.dispose();
});
</script>

<style scoped lang="scss">
.room-voice {
  position: fixed;
  left: 12px;
  bottom: 16px;
  z-index: 15;
  color: rgb(var(--v-theme-text-primary));
  text-align: left;
}
.voice-launcher {
  min-height: 48px;
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 0 14px;
  border-radius: 14px;
  background: rgb(var(--v-theme-inset));
  box-shadow: 0 2px 12px #0003;
  font-weight: 650;
}
.voice-symbol {
  font-size: 17px;
  letter-spacing: -2px;
}
.voice-live {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--v-theme-success));
}
.voice-panel {
  position: absolute;
  bottom: 56px;
  left: 0;
  width: min(340px, calc(100vw - 24px));
  max-height: min(68dvh, 570px);
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-text-primary), 0.18);
  border-radius: 16px;
  box-shadow: 0 8px 32px #0004;
  overflow: hidden;
}
.voice-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(var(--v-theme-text-primary), 0.13);
}
.voice-heading button {
  width: 44px;
  height: 44px;
  font-size: 25px;
}
.voice-body {
  overflow-y: auto;
  padding: 14px;
  display: grid;
  gap: 14px;
}
.voice-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 600;
}
.voice-setting input {
  width: 22px;
  height: 22px;
  accent-color: rgb(var(--v-theme-primary));
}
.voice-note {
  margin: 0;
  opacity: 0.8;
  line-height: 1.45;
}
.voice-error {
  margin: 0;
  color: rgb(var(--v-theme-error));
  line-height: 1.45;
}
.voice-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.voice-actions button {
  min-height: 44px;
  padding: 0 12px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-radius: 9px;
}
.voice-actions .voice-secondary,
.voice-secondary {
  min-height: 40px;
  padding: 0 8px;
  background: rgb(var(--v-theme-inset));
  color: rgb(var(--v-theme-text-primary));
  border-radius: 8px;
}
.voice-volume {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 5px;
  font-size: 13px;
}
.voice-volume input {
  grid-column: 1 / -1;
  width: 100%;
  min-height: 28px;
  accent-color: rgb(var(--v-theme-primary));
}
.voice-roster-title {
  margin: 4px 0 0;
  font-weight: 650;
}
.voice-self {
  margin: 0;
  font-size: 14px;
}
.voice-person {
  display: grid;
  gap: 6px;
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.13);
  padding-top: 12px;
}
.voice-person strong {
  overflow-wrap: anywhere;
}
.voice-person button {
  justify-self: start;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
button:disabled {
  cursor: wait;
  opacity: 0.65;
}
@media (max-width: 600px) {
  .room-voice {
    left: 8px;
    bottom: calc(8px + env(safe-area-inset-bottom));
  }
  .voice-panel {
    width: min(340px, calc(100vw - 16px));
  }
}
</style>
