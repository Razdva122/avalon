import type { VoiceClient, VoiceClientEvents } from './useRoomVoice';

/** The SDK is loaded only after an explicit Join action. */
export async function loadLiveKitVoiceClient(): Promise<VoiceClient> {
  return createLiveKitVoiceClient(await import('livekit-client'));
}

export function createLiveKitVoiceClient({ Room, RoomEvent, Track }: typeof import('livekit-client')): VoiceClient {
  // Web Audio gain works on iOS Safari, where HTMLMediaElement.volume is ignored.
  const room = new Room({ adaptiveStream: true, dynacast: false, webAudioMix: true });
  const elements = new Map<string, Set<HTMLMediaElement>>();
  const detachAudio = new Map<HTMLMediaElement, () => void>();
  const volumes = new Map<string, number>();
  let closed = false;

  const removeAudio = (sessionID: string) => {
    for (const element of elements.get(sessionID) ?? []) {
      detachAudio.get(element)?.();
      detachAudio.delete(element);
      element.remove();
    }
    elements.delete(sessionID);
  };
  const participantInfo = (participant: { identity: string; metadata?: string }) => {
    try {
      const metadata = JSON.parse(participant.metadata ?? '{}');
      return typeof metadata.userID === 'string' && metadata.userID
        ? { sessionID: participant.identity, userID: metadata.userID }
        : undefined;
    } catch {
      return undefined;
    }
  };
  return {
    async connect(url: string, token: string, events: VoiceClientEvents) {
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        const info = participantInfo(participant);
        if (!closed && info) events.onParticipant(info);
      });
      room.on(RoomEvent.ParticipantMetadataChanged, (_metadata, participant) => {
        const info = participantInfo(participant);
        if (!closed && info) events.onParticipant(info);
      });
      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        removeAudio(participant.identity);
        if (!closed) events.onParticipantLeft(participant.identity);
      });
      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        const info = participantInfo(participant);
        if (closed || track.kind !== Track.Kind.Audio || !info) return;
        // Install persisted local gain/mute before the element can play.
        events.onParticipant(info);
        const element = track.attach();
        element.autoplay = true;
        element.style.display = 'none';
        document.body.appendChild(element);
        detachAudio.set(element, () => {
          track.detach(element);
        });
        if (!elements.has(participant.identity)) elements.set(participant.identity, new Set());
        elements.get(participant.identity)!.add(element);
        participant.setVolume(volumes.get(participant.identity) ?? 1, Track.Source.Microphone);
      });
      room.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
        for (const element of track.detach()) {
          element.remove();
          detachAudio.delete(element);
          elements.get(participant.identity)?.delete(element);
        }
      });
      room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        if (!closed && !room.canPlaybackAudio) events.onPlaybackBlocked();
      });
      room.on(RoomEvent.Disconnected, () => {
        if (!closed) events.onDisconnected();
      });
      await room.connect(url, token, { autoSubscribe: true });
      if (closed) return;
      for (const participant of room.remoteParticipants.values()) {
        const info = participantInfo(participant);
        if (info) events.onParticipant(info);
      }
    },
    disconnect() {
      closed = true;
      for (const id of elements.keys()) removeAudio(id);
      void room.disconnect();
    },
    async setMicrophoneEnabled(enabled: boolean) {
      if (closed) return;
      await room.localParticipant.setMicrophoneEnabled(enabled);
      if (closed && enabled) {
        await room.localParticipant.setMicrophoneEnabled(false).catch(() => undefined);
        await room.disconnect();
      }
    },
    setPlaybackVolume(sessionID: string, volume: number) {
      const level = Math.max(0, Math.min(1, volume));
      volumes.set(sessionID, level);
      room.remoteParticipants.get(sessionID)?.setVolume(level, Track.Source.Microphone);
    },
    startAudio: () => room.startAudio(),
  };
}
