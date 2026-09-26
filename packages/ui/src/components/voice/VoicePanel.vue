<template>
  <aside class="room-voice" :aria-label="$t('voice.title')">
    <div class="voice-dock" :class="{ 'is-connected': isConnected }">
      <button
        ref="launcher"
        class="voice-launcher"
        type="button"
        :aria-expanded="open"
        :aria-controls="panelID"
        @click="open = !open"
      >
        <VoiceIcon name="headphones" />
        <span class="voice-dock-label">{{ $t('voice.shortTitle') }} <small>beta</small></span>
        <span
          v-if="isConnected"
          class="voice-count"
          :aria-label="`${$t('voice.participants')}: ${voice.participants.value.length + 1}`"
        >
          <i class="voice-dot" />{{ voice.participants.value.length + 1 }}
        </span>
        <VoiceIcon :name="open ? 'chevronDown' : 'chevronUp'" class="voice-chevron" />
      </button>
      <button
        v-if="isConnected"
        type="button"
        class="voice-quick-mic"
        :class="{ 'is-muted': !voice.microphoneEnabled.value }"
        :title="micLabel"
        :aria-label="micLabel"
        :aria-pressed="voice.microphoneEnabled.value"
        :disabled="voice.microphonePending.value"
        @click="toggleMic"
      >
        <VoiceIcon :name="voice.microphoneEnabled.value ? 'mic' : 'micOff'" />
      </button>
    </div>
    <Transition name="voice-reveal">
      <section
        v-if="open"
        :id="panelID"
        ref="panel"
        class="voice-panel"
        tabindex="-1"
        :aria-label="$t('voice.title')"
        @keydown.esc.stop.prevent="closePanel"
      >
        <header class="voice-heading">
          <div class="voice-heading-copy">
            <div class="voice-title">
              <h2>{{ $t('voice.panelTitle') }}</h2>
              <span class="voice-beta">beta</span>
            </div>
            <p class="voice-status" role="status"><i v-if="isConnected" class="voice-dot" />{{ connectionLabel }}</p>
          </div>
          <button
            v-if="voice.state.value.canManage"
            type="button"
            class="voice-icon-button"
            :class="{ 'is-selected': settingsOpen }"
            :aria-label="$t('voice.roomSettings')"
            :title="$t('voice.roomSettings')"
            :aria-expanded="settingsOpen"
            :aria-controls="`${panelID}-settings`"
            @click="settingsOpen = !settingsOpen"
          >
            <VoiceIcon name="settings" />
          </button>
          <button
            type="button"
            class="voice-icon-button"
            :aria-label="$t('voice.close')"
            :title="$t('voice.close')"
            @click="closePanel"
          >
            <VoiceIcon name="close" />
          </button>
        </header>
        <div v-if="settingsOpen && voice.state.value.canManage" :id="`${panelID}-settings`" class="voice-room-settings">
          <label class="voice-setting">
            <span>{{ $t('voice.roomSetting') }}</span>
            <span class="voice-switch"
              ><input
                type="checkbox"
                role="switch"
                :checked="voice.state.value.enabled"
                :disabled="!voice.state.value.available"
                @change="toggleRoom" /><span aria-hidden="true"
            /></span>
          </label>
          <p class="voice-hint">{{ $t('voice.privacy') }}</p>
        </div>
        <div class="voice-body">
          <p v-if="voice.error.value" class="voice-error" role="alert"><VoiceIcon name="info" />{{ errorText }}</p>
          <template v-if="voice.state.value.available && voice.state.value.enabled && voice.state.value.canJoin">
            <template v-if="isConnected">
              <button
                type="button"
                class="voice-microphone"
                :class="{ 'is-muted': !voice.microphoneEnabled.value }"
                :aria-label="micLabel"
                :aria-pressed="voice.microphoneEnabled.value"
                :disabled="voice.microphonePending.value"
                @click="toggleMic"
              >
                <span class="voice-microphone-icon"
                  ><VoiceIcon :name="voice.microphoneEnabled.value ? 'mic' : 'micOff'"
                /></span>
                <span class="voice-microphone-copy"
                  ><strong>{{ $t('voice.microphone') }}</strong
                  ><span>{{ $t(voice.microphoneEnabled.value ? 'voice.micOn' : 'voice.micOff') }}</span></span
                >
                <span class="voice-microphone-action">{{
                  $t(voice.microphoneEnabled.value ? 'voice.turnOff' : 'voice.turnOn')
                }}</span>
              </button>
              <div
                v-if="micHelpOpen || voice.microphoneError.value || voice.microphonePending.value"
                class="voice-mic-help"
                aria-live="polite"
                :aria-busy="voice.microphonePending.value"
              >
                <strong>{{
                  $t(
                    voice.microphonePending.value
                      ? 'voice.micWaiting'
                      : voice.microphoneError.value
                        ? 'voice.micNeedsAttention'
                        : 'voice.micPermissionTitle',
                  )
                }}</strong>
                <p>{{ micHelpText }}</p>
                <p v-if="voice.microphoneError.value === 'permission'" class="voice-hint">
                  {{ $t('voice.micSystemHelp') }}
                </p>
                <div class="voice-mic-help-actions">
                  <button
                    type="button"
                    class="voice-primary"
                    :disabled="voice.microphonePending.value"
                    @click="requestMicrophone"
                  >
                    {{
                      $t(
                        voice.microphonePending.value
                          ? 'voice.micWaiting'
                          : voice.microphoneError.value
                            ? 'voice.micRetry'
                            : 'voice.micRequest',
                      )
                    }}
                  </button>
                  <button
                    v-if="!voice.microphonePending.value && !voice.microphoneError.value"
                    type="button"
                    class="voice-icon-button voice-listen-only"
                    @click="micHelpOpen = false"
                  >
                    {{ $t('voice.micListenOnly') }}
                  </button>
                </div>
              </div>
              <div class="voice-roster-heading">
                <h3>{{ $t('voice.participants') }}</h3>
                <span>{{ voice.participants.value.length + 1 }}</span>
              </div>
              <ul class="voice-roster">
                <li class="voice-person voice-self">
                  <VoiceStatus :status="userStatus(ownUserID)" :name="$t('voice.you')" own />
                  <div class="voice-person-controls">
                    <strong>{{ $t('voice.you') }}</strong>
                    <span class="voice-person-state">{{
                      $t(
                        userStatus(ownUserID) === 'selfMuted'
                          ? 'voice.statusSelfMutedOwn'
                          : `voice.status_${userStatus(ownUserID)}`,
                      )
                    }}</span>
                  </div>
                </li>
                <li
                  v-for="participant in voice.participants.value"
                  :key="participant.sessionID"
                  class="voice-person"
                  :class="{ 'is-muted': participant.muted }"
                >
                  <VoiceStatus :status="userStatus(participant.userID)" :name="displayName(participant.userID)" />
                  <div class="voice-person-controls">
                    <div class="voice-person-label">
                      <strong :title="displayName(participant.userID)">{{ displayName(participant.userID) }}</strong
                      ><span>{{ participant.volume }}%</span>
                    </div>
                    <span class="voice-person-state">{{ $t(`voice.status_${userStatus(participant.userID)}`) }}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      :value="participant.volume"
                      :disabled="participant.muted"
                      :aria-label="$t('voice.personVolume', { name: displayName(participant.userID) })"
                      @input="setUserVolume(participant.userID, $event)"
                    />
                  </div>
                  <button
                    type="button"
                    class="voice-icon-button"
                    :aria-label="`${$t(participant.muted ? 'voice.unmutePerson' : 'voice.mutePerson')}: ${displayName(participant.userID)}`"
                    :title="$t(participant.muted ? 'voice.unmutePerson' : 'voice.mutePerson')"
                    :aria-pressed="participant.muted"
                    @click="voice.setUserMuted(participant.userID, !participant.muted)"
                  >
                    <VoiceIcon :name="participant.muted ? 'volumeOff' : 'volume'" />
                  </button>
                </li>
              </ul>
              <p class="voice-hint">{{ $t(voice.participants.value.length ? 'voice.localOnly' : 'voice.noOthers') }}</p>
            </template>
            <div v-else class="voice-welcome">
              <span class="voice-welcome-icon"><VoiceIcon name="headphones" /></span>
              <p>{{ $t('voice.privacy') }}</p>
              <button
                type="button"
                class="voice-primary"
                :disabled="voice.status.value === 'connecting'"
                @click="voice.join"
              >
                <VoiceIcon name="headphones" />{{
                  $t(
                    voice.status.value === 'connecting'
                      ? 'voice.connecting'
                      : voice.status.value === 'error'
                        ? 'voice.retry'
                        : 'voice.join',
                  )
                }}
              </button>
              <p class="voice-hint">{{ $t('voice.listenHint') }}</p>
            </div>
          </template>
          <div v-else class="voice-empty">
            <VoiceIcon name="headphones" />
            <p>
              {{
                $t(
                  !voice.state.value.available
                    ? 'voice.unavailable'
                    : !voice.state.value.enabled
                      ? 'voice.disabled'
                      : 'voice.spectator',
                )
              }}
            </p>
            <button
              v-if="voice.state.value.available && !voice.state.value.enabled && voice.state.value.canManage"
              type="button"
              class="voice-primary"
              @click="voice.setEnabled(true)"
            >
              {{ $t('voice.enableRoom') }}
            </button>
          </div>
          <button v-if="voice.playbackBlocked.value" type="button" class="voice-primary" @click="voice.startAudio">
            <VoiceIcon name="volume" />{{ $t('voice.resumeAudio') }}
          </button>
        </div>
        <footer v-if="isConnected" class="voice-footer">
          <label class="voice-master"
            ><span><VoiceIcon name="volume" />{{ $t('voice.masterVolume') }}</span
            ><output>{{ voice.masterVolume.value }}%</output
            ><input
              type="range"
              min="0"
              max="100"
              :value="voice.masterVolume.value"
              :aria-label="$t('voice.masterVolume')"
              @input="setMasterVolume"
          /></label>
          <button type="button" class="voice-leave" @click="voice.leave">
            <VoiceIcon name="leave" />{{ $t('voice.leave') }}
          </button>
        </footer>
      </section>
    </Transition>
  </aside>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import VoiceIcon from './VoiceIcon.vue';
import VoiceStatus from './VoiceStatus.vue';
import { roomVoiceKey } from '@/helpers/room-voice-context';
import { useI18n } from 'vue-i18n';
import { socket } from '@/api/socket';
import { useStore } from '@/store';
import { createRoomVoice } from '@/helpers/composables/useRoomVoice';
import { loadLiveKitVoiceClient } from '@/helpers/composables/liveKitVoiceClient';

const props = defineProps<{ roomUuid: string; seatIds: string }>();
const store = useStore();
const { t } = useI18n();
const open = ref(false);
const settingsOpen = ref(false);
const launcher = ref<HTMLButtonElement>();
const panel = ref<HTMLElement>();
const panelID = computed(() => `voice-panel-${props.roomUuid}`);
const closePanel = () => {
  open.value = false;
  void nextTick(() => launcher.value?.focus());
};
watch(open, (value) => {
  if (value) void nextTick(() => panel.value?.focus());
});
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
const voiceContext = inject(roomVoiceKey, undefined);
if (voiceContext) voiceContext.value = voice;
onUnmounted(() => {
  if (voiceContext?.value === voice) voiceContext.value = undefined;
});
const ownUserID = computed(() => store.state.profile?.id ?? '');
const userStatus = (id: string) => voice.userStatus(id, ownUserID.value);
const isConnected = computed(() => voice.status.value === 'connected');
const micLabel = computed(() => t(voice.microphoneEnabled.value ? 'voice.disableMic' : 'voice.enableMic'));
const micHelpOpen = ref(false);
const microphoneWasEnabled = ref(false);
const micHelpText = computed(() => {
  const failure = voice.microphoneError.value;
  return t(
    failure === 'permission'
      ? 'voice.micPermissionHelp'
      : failure === 'missing'
        ? 'voice.micMissingHelp'
        : failure === 'busy'
          ? 'voice.micBusyHelp'
          : failure
            ? 'voice.micFailedHelp'
            : 'voice.micPermissionIntro',
  );
});
const requestMicrophone = async () => {
  await voice.setMicrophoneEnabled(true);
  if (voice.microphoneEnabled.value) {
    microphoneWasEnabled.value = true;
    micHelpOpen.value = false;
  }
};
const toggleMic = () => {
  if (voice.microphoneEnabled.value) {
    void voice.setMicrophoneEnabled(false);
  } else if (!microphoneWasEnabled.value || voice.microphoneError.value) {
    open.value = true;
    micHelpOpen.value = true;
  } else {
    void requestMicrophone();
  }
};
watch(voice.microphoneError, (failure) => {
  if (failure) {
    open.value = true;
    micHelpOpen.value = true;
  }
});
watch(isConnected, (connected) => {
  if (!connected) micHelpOpen.value = false;
});
const connectionLabel = computed(() => {
  if (!voice.state.value.available) return t('voice.unavailable');
  if (!voice.state.value.enabled) return t('voice.disabled');
  if (isConnected.value) return t('voice.connected');
  if (voice.status.value === 'connecting') return t('voice.connecting');
  return t('voice.notConnected');
});
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
.voice-mic-help {
  margin-top: 12px;
  padding: 14px;
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.06);
  font-size: 13px;
  line-height: 1.5;
  p {
    margin: 8px 0 12px;
  }
}
.voice-mic-help-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.voice-listen-only {
  width: auto !important;
  padding: 0 10px;
  font-size: 12px;
}

.room-voice {
  position: fixed;
  left: 16px;
  bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 15;
  color: rgb(var(--v-theme-text-primary));
  text-align: left;
  font-size: 14px;
  line-height: 1.45;
}
.room-voice button {
  cursor: pointer;
  transition:
    background-color 140ms ease,
    box-shadow 140ms ease;
}
.room-voice svg {
  flex-shrink: 0;
}
.voice-dock {
  display: flex;
  align-items: center;
  background: rgb(var(--v-theme-inset));
  border: 1px solid rgba(var(--v-theme-text-primary), 0.14);
  border-radius: 16px;
  box-shadow: 0 4px 18px #0002;
  padding: 4px;
}
.voice-launcher {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 10px;
  border-radius: 12px;
}
.voice-dock-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 650;
}
.voice-dock-label small,
.voice-beta {
  font-size: 11px;
  line-height: 20px;
  padding: 0 6px;
  border: 1px solid rgba(var(--v-theme-text-primary), 0.2);
  border-radius: 5px;
  font-weight: 500;
}
.voice-count {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.voice-dot {
  display: inline-block;
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  background: rgb(var(--v-theme-success));
  border-radius: 50%;
}
.voice-chevron {
  width: 16px;
  height: 16px;
}
.voice-quick-mic {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(var(--v-theme-success), 0.12);
}
.voice-quick-mic.is-muted {
  background: rgba(var(--v-theme-text-primary), 0.09);
}
.voice-panel {
  position: absolute;
  bottom: 64px;
  left: 0;
  width: min(384px, calc(100vw - 32px));
  max-height: min(76dvh, 680px);
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-inset));
  border: 1px solid rgba(var(--v-theme-text-primary), 0.16);
  border-radius: 20px;
  box-shadow: 0 16px 56px #0003;
  overflow: hidden;
  outline: none;
}
.voice-heading {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 16px 12px 14px 20px;
}
.voice-heading-copy {
  flex: 1;
  min-width: 0;
}
.voice-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.voice-title h2 {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
  margin: 0;
}
.voice-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin: 5px 0 0;
}
.voice-icon-button {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 12px;
}
.voice-icon-button:hover,
.voice-icon-button.is-selected,
.voice-launcher:hover,
.voice-leave:hover {
  background: rgba(var(--v-theme-text-primary), 0.08);
}
.voice-room-settings {
  padding: 14px 20px;
  border-block: 1px solid rgba(var(--v-theme-text-primary), 0.12);
}
.voice-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-weight: 600;
  min-height: 44px;
  cursor: pointer;
}
.voice-switch {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: grid;
  align-items: center;
}
.voice-switch input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  z-index: 1;
  cursor: pointer;
}
.voice-switch > span {
  height: 24px;
  border-radius: 20px;
  background: rgba(var(--v-theme-text-primary), 0.32);
  padding: 3px;
}
.voice-switch > span::after {
  content: '';
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: transform 160ms ease;
}
.voice-switch input:checked + span {
  background: rgb(var(--v-theme-primary));
}
.voice-switch input:checked + span::after {
  transform: translateX(20px);
}
.voice-body {
  overflow-y: auto;
  overscroll-behavior: contain;
  min-height: 0;
  padding: 0 20px 16px;
}
.voice-microphone {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
  padding: 12px;
  min-height: 76px;
  border: 1px solid rgba(var(--v-theme-success), 0.55);
  border-radius: 14px;
  background: rgba(var(--v-theme-success), 0.09);
  text-align: left;
}
.voice-microphone.is-muted {
  background: rgba(var(--v-theme-text-primary), 0.045);
  border-color: rgba(var(--v-theme-text-primary), 0.18);
}
.voice-microphone:hover {
  box-shadow: inset 0 0 0 1px currentColor;
}
.voice-microphone-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 12px;
  background: rgb(var(--v-theme-inset));
}
.voice-microphone-copy {
  display: grid;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.voice-microphone-copy strong {
  font-size: 14px;
}
.voice-microphone-copy > span {
  font-size: 12px;
}
.voice-microphone-action {
  font-size: 12px;
  font-weight: 650;
}
.voice-roster-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22px;
  margin-bottom: 8px;
}
.voice-roster-heading h3 {
  font-size: 12px;
  font-weight: 650;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.065em;
}
.voice-roster-heading > span {
  font-size: 12px;
  padding: 1px 7px;
  background: rgba(var(--v-theme-text-primary), 0.07);
  border-radius: 6px;
}
.voice-roster {
  list-style: none;
  padding: 0;
  margin: 0;
}
.voice-person {
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 72px;
  padding: 8px 0;
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.1);
}
.voice-person:first-child {
  border: 0;
}
.voice-self {
  min-height: 44px;
}
.voice-self > svg {
  margin: 0 12px;
  width: 18px;
}
.voice-avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(var(--v-theme-text-primary), 0.08);
  font-size: 13px;
  font-weight: 700;
}
.voice-avatar svg {
  width: 18px;
}
.voice-person-name {
  flex: 1;
  font-weight: 600;
}
.voice-person-controls {
  flex: 1;
  min-width: 0;
}
.voice-person-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.voice-person-label strong {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.voice-person-label > span {
  font-size: 12px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.voice-person.is-muted .voice-avatar {
  opacity: 0.55;
}
.voice-person.is-muted .voice-icon-button {
  background: rgba(var(--v-theme-text-primary), 0.1);
}
.room-voice input[type='range'] {
  width: 100%;
  display: block;
  min-width: 0;
  height: 32px;
  accent-color: rgb(var(--v-theme-primary));
  cursor: pointer;
}
.voice-hint {
  font-size: 12px;
  line-height: 1.5;
  margin: 10px 0 0;
}
.voice-footer {
  flex-shrink: 0;
  border-top: 1px solid rgba(var(--v-theme-text-primary), 0.12);
  padding: 16px 20px 8px;
}
.voice-master {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 12px;
  align-items: center;
  font-size: 13px;
}
.voice-master > span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.voice-master svg {
  width: 18px;
}
.voice-master output {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.voice-master input {
  grid-column: 1 / -1;
}
.voice-leave {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  border-radius: 10px;
  font-size: 13px;
  margin-top: 6px;
}
.voice-leave svg {
  width: 18px;
}
.voice-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 10px 16px;
  width: 100%;
  border-radius: 12px;
  background: rgb(var(--v-theme-primary));
  color: white;
  font-size: 14px;
  font-weight: 650;
}
.voice-primary:hover {
  filter: brightness(0.93);
}
.voice-welcome,
.voice-empty {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding: 20px 0 8px;
  text-align: center;
}
.voice-welcome p,
.voice-empty p {
  margin: 0;
}
.voice-welcome-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  background: rgba(var(--v-theme-primary), 0.09);
  border-radius: 20px;
}
.voice-welcome-icon svg {
  width: 30px;
  height: 30px;
}
.voice-empty > svg {
  width: 32px;
  height: 32px;
}
.voice-error {
  display: flex;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(var(--v-theme-error), 0.5);
  border-radius: 10px;
  margin: 0 0 12px;
}
.room-voice button:focus-visible,
.room-voice input:focus-visible,
.voice-switch input:focus-visible + span {
  outline: 3px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}
.room-voice button:disabled,
.room-voice input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.voice-reveal-enter-active,
.voice-reveal-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}
.voice-reveal-enter-from,
.voice-reveal-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
@media (max-width: 600px) {
  .room-voice {
    left: 8px;
    bottom: calc(8px + env(safe-area-inset-bottom));
  }
  .voice-panel {
    position: fixed;
    left: 8px;
    right: 8px;
    bottom: calc(72px + env(safe-area-inset-bottom));
    width: auto;
    max-height: calc(100dvh - 148px - env(safe-area-inset-bottom));
    border-radius: 20px;
  }
  .voice-heading {
    padding-left: 16px;
  }
  .voice-body,
  .voice-footer,
  .voice-room-settings {
    padding-left: 16px;
    padding-right: 16px;
  }
}
@media (max-height: 500px) {
  .voice-panel {
    max-height: calc(100dvh - 88px - env(safe-area-inset-bottom));
    overflow-y: auto;
  }
  .voice-body {
    overflow: visible;
    flex-shrink: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .room-voice *,
  .voice-reveal-enter-active,
  .voice-reveal-leave-active {
    transition: none !important;
  }
}
</style>

<style scoped>
.voice-person-state {
  display: block;
  font-size: 11px;
  line-height: 1.4;
  margin-top: 2px;
  color: rgb(var(--v-theme-text-primary));
  opacity: 0.8;
}
</style>
