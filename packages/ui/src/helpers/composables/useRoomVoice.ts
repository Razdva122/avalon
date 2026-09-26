import { ref } from 'vue';

export type VoiceState = { available: boolean; enabled: boolean; canJoin: boolean; canManage: boolean };
export type VoiceResult<T> = T | { error: string };
export type VoiceAdmission = { url: string; token: string; sessionID: string };
export type VoiceParticipant = { sessionID: string; userID: string; volume: number; muted: boolean };
export type VoiceClientEvents = {
  onParticipant: (participant: { sessionID: string; userID: string }) => void;
  onParticipantLeft: (sessionID: string) => void;
  onDisconnected: () => void;
  onPlaybackBlocked: () => void;
};
export type VoiceClient = {
  connect: (url: string, token: string, events: VoiceClientEvents) => Promise<void>;
  disconnect: () => void;
  setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
  setPlaybackVolume: (sessionID: string, volume: number) => void;
  startAudio?: () => Promise<void>;
};
export type VoiceTransport = {
  getVoiceState: (roomID: string) => Promise<VoiceResult<VoiceState>>;
  setVoiceEnabled: (roomID: string, enabled: boolean) => Promise<VoiceResult<VoiceState>>;
  joinVoice: (roomID: string) => Promise<VoiceResult<VoiceAdmission>>;
  leaveVoice: (sessionID: string) => Promise<VoiceResult<true>>;
};
export type VoicePreferenceStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type Preferences = { masterVolume: number; users: Record<string, { volume: number; muted: boolean }> };
const preferenceKey = 'avalon.voice.preferences.v1';
const emptyState: VoiceState = { available: false, enabled: false, canJoin: false, canManage: false };
const clamp = (value: number) => (Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 100);
const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

function loadPreferences(persistence?: Pick<VoicePreferenceStore, 'getItem' | 'setItem'>): Preferences {
  try {
    const raw = persistence?.getItem(preferenceKey);
    const stored = raw ? JSON.parse(raw) : undefined;
    const users: Preferences['users'] = {};
    if (stored?.users && typeof stored.users === 'object') {
      for (const [id, value] of Object.entries(stored.users)) {
        if (value && typeof value === 'object') {
          const user = value as { volume?: unknown; muted?: unknown };
          users[id] = {
            volume: typeof user.volume === 'number' ? clamp(user.volume) : 100,
            muted: user.muted === true,
          };
        }
      }
    }
    return { masterVolume: typeof stored?.masterVolume === 'number' ? clamp(stored.masterVolume) : 100, users };
  } catch {
    return { masterVolume: 100, users: {} };
  }
}

export function createRoomVoice(
  initialRoomID: string,
  transport: VoiceTransport,
  loadClient: () => Promise<VoiceClient>,
  persistence?: Pick<VoicePreferenceStore, 'getItem' | 'setItem'>,
) {
  let roomID = initialRoomID;
  let generation = 0;
  let client: VoiceClient | undefined;
  let sessionID: string | undefined;
  let preferences = loadPreferences(persistence);
  const state = ref<VoiceState>({ ...emptyState });
  const status = ref<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const error = ref<string>();
  const playbackBlocked = ref(false);
  const microphoneEnabled = ref(false);
  const microphonePending = ref(false);
  const participants = ref<VoiceParticipant[]>([]);
  const masterVolume = ref(preferences.masterVolume);
  const persist = () => {
    try {
      persistence?.setItem(preferenceKey, JSON.stringify(preferences));
    } catch {
      /* persistence can be disabled */
    }
  };
  const gain = (participant: VoiceParticipant) =>
    participant.muted ? 0 : (masterVolume.value * participant.volume) / 10000;
  const updateGain = (participant: VoiceParticipant) =>
    client?.setPlaybackVolume(participant.sessionID, gain(participant));
  const setMasterVolume = (value: number) => {
    masterVolume.value = clamp(value);
    preferences.masterVolume = masterVolume.value;
    persist();
    participants.value.forEach(updateGain);
  };
  const setUserVolume = (userID: string, value: number) => {
    const user = preferences.users[userID] ?? { volume: 100, muted: false };
    user.volume = clamp(value);
    preferences.users[userID] = user;
    persist();
    participants.value
      .filter((participant) => participant.userID === userID)
      .forEach((participant) => {
        participant.volume = user.volume;
        updateGain(participant);
      });
  };
  const setUserMuted = (userID: string, muted: boolean) => {
    const user = preferences.users[userID] ?? { volume: 100, muted: false };
    user.muted = muted;
    preferences.users[userID] = user;
    persist();
    participants.value
      .filter((participant) => participant.userID === userID)
      .forEach((participant) => {
        participant.muted = muted;
        updateGain(participant);
      });
  };
  const stop = (notifyServer = true) => {
    generation++;
    const previousClient = client;
    const previousSession = sessionID;
    client = undefined;
    sessionID = undefined;
    microphoneEnabled.value = false;
    microphonePending.value = false;
    playbackBlocked.value = false;
    participants.value = [];
    status.value = 'idle';
    if (previousClient) {
      void previousClient.setMicrophoneEnabled(false).catch(() => undefined);
      previousClient.disconnect();
    }
    if (previousSession && notifyServer) void transport.leaveVoice(previousSession).catch(() => undefined);
  };
  const leave = async () => {
    stop();
  };
  const refresh = async () => {
    const current = generation;
    const currentRoom = roomID;
    try {
      const result = await transport.getVoiceState(currentRoom);
      if (current !== generation || currentRoom !== roomID) return;
      if ('error' in result) {
        if (result.error === 'forbidden' || result.error === 'unavailable') {
          state.value = { ...emptyState };
          if (sessionID) stop(false);
        }
        error.value = result.error;
        return;
      }
      state.value = result;
      if ((!result.enabled || !result.available || !result.canJoin) && sessionID) stop();
    } catch (cause) {
      if (current === generation) error.value = message(cause);
    }
  };
  const setEnabled = async (enabled: boolean) => {
    if (!state.value.canManage) return;
    const currentRoom = roomID;
    try {
      const result = await transport.setVoiceEnabled(currentRoom, enabled);
      if (currentRoom !== roomID) return;
      if ('error' in result) {
        error.value = result.error;
        return;
      }
      state.value = result;
      error.value = undefined;
      if (!result.enabled) stop();
    } catch (cause) {
      error.value = message(cause);
    }
  };
  const join = async () => {
    if (
      status.value === 'connecting' ||
      status.value === 'connected' ||
      !state.value.canJoin ||
      !state.value.enabled ||
      !state.value.available
    )
      return;
    const current = ++generation;
    const currentRoom = roomID;
    status.value = 'connecting';
    error.value = undefined;
    let admission: VoiceAdmission | undefined;
    let pendingClient: VoiceClient | undefined;
    try {
      const result = await transport.joinVoice(currentRoom);
      if ('error' in result) throw new Error(result.error);
      admission = result;
      if (current !== generation || currentRoom !== roomID) return;
      pendingClient = await loadClient();
      if (current !== generation || currentRoom !== roomID) return;
      client = pendingClient;
      sessionID = admission.sessionID;
      const events: VoiceClientEvents = {
        onParticipant: ({ sessionID: id, userID }) => {
          if (current !== generation || !userID) return;
          const saved = preferences.users[userID] ?? { volume: 100, muted: false };
          const participant = { sessionID: id, userID, volume: saved.volume, muted: saved.muted };
          participants.value = [...participants.value.filter((entry) => entry.sessionID !== id), participant];
          updateGain(participant);
        },
        onParticipantLeft: (id) => {
          if (current === generation) participants.value = participants.value.filter((entry) => entry.sessionID !== id);
        },
        onDisconnected: () => {
          if (current === generation) {
            stop();
            status.value = 'error';
            error.value = 'disconnected';
          }
        },
        onPlaybackBlocked: () => {
          if (current === generation) playbackBlocked.value = true;
        },
      };
      await pendingClient.connect(admission.url, admission.token, events);
      if (current !== generation || currentRoom !== roomID) return;
      await pendingClient.setMicrophoneEnabled(false);
      if (current !== generation || currentRoom !== roomID) return;
      status.value = 'connected';
    } catch (cause) {
      if (current === generation) {
        stop();
        status.value = 'error';
        error.value = message(cause);
      }
    } finally {
      if (current !== generation) {
        if (pendingClient && pendingClient !== client) pendingClient.disconnect();
        if (admission && admission.sessionID !== sessionID)
          void transport.leaveVoice(admission.sessionID).catch(() => undefined);
      }
    }
  };
  const setMicrophoneEnabled = async (enabled: boolean) => {
    if (!client || status.value !== 'connected' || microphonePending.value) return;
    const target = client;
    const current = generation;
    microphonePending.value = true;
    try {
      await target.setMicrophoneEnabled(enabled);
      if (current === generation) {
        microphoneEnabled.value = enabled;
        error.value = undefined;
      } else if (enabled) void target.setMicrophoneEnabled(false).catch(() => undefined);
    } catch (cause) {
      if (current === generation) error.value = message(cause);
    } finally {
      if (current === generation) microphonePending.value = false;
    }
  };
  const startAudio = async () => {
    try {
      await client?.startAudio?.();
      playbackBlocked.value = false;
    } catch (cause) {
      error.value = message(cause);
    }
  };
  const revoke = async (id: string) => {
    if (id === sessionID) stop(false);
  };
  const disconnected = () => {
    if (status.value === 'connected' || status.value === 'connecting') {
      stop(false);
      status.value = 'error';
      error.value = 'disconnected';
    }
  };
  const setRoom = async (nextRoomID: string) => {
    if (nextRoomID === roomID) return;
    stop();
    roomID = nextRoomID;
    state.value = { ...emptyState };
    error.value = undefined;
    await refresh();
  };
  const dispose = () => stop();
  return {
    state,
    status,
    error,
    playbackBlocked,
    microphoneEnabled,
    microphonePending,
    participants,
    masterVolume,
    refresh,
    setEnabled,
    join,
    leave,
    revoke,
    disconnected,
    setRoom,
    dispose,
    setMicrophoneEnabled,
    setMasterVolume,
    setUserVolume,
    setUserMuted,
    startAudio,
  };
}
