const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { createRoomVoice } = require('../src/helpers/composables/useRoomVoice.ts');
const { createLiveKitVoiceClient } = require('../src/helpers/composables/liveKitVoiceClient.ts');

const state = { available: true, enabled: true, canJoin: true, canManage: false };
const tick = () => new Promise((resolve) => setImmediate(resolve));
function fixture() {
  const calls = [];
  const listeners = {};
  const values = new Map();
  let resolveConnect;
  const client = {
    connect: (url, token, callbacks) => {
      calls.push(['connect', url, token]);
      Object.assign(listeners, callbacks);
      return new Promise((resolve) => (resolveConnect = resolve));
    },
    disconnect: () => calls.push(['disconnect']),
    setMicrophoneEnabled: async (enabled) => calls.push(['mic', enabled]),
    setPlaybackVolume: (id, volume) => calls.push(['volume', id, volume]),
  };
  const transport = {
    getVoiceState: async () => state,
    setVoiceEnabled: async () => state,
    joinVoice: async () => ({ url: 'wss://voice', token: 'secret', sessionID: 'session-1' }),
    leaveVoice: async (id) => {
      calls.push(['leave', id]);
      return true;
    },
  };
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const voice = createRoomVoice('room-1', transport, async () => client, storage);
  return { voice, client, calls, listeners, connect: () => resolveConnect(), values, transport };
}

test('late connection after leaving is closed and never enables the microphone', async () => {
  const f = fixture();
  await f.voice.refresh();
  const joining = f.voice.join();
  await tick();
  await f.voice.leave();
  f.connect();
  await joining;
  assert.equal(f.voice.status.value, 'idle');
  assert.equal(
    f.calls.some((call) => call[0] === 'mic' && call[1]),
    false,
  );
  assert.equal(
    f.calls.some((call) => call[0] === 'disconnect'),
    true,
  );
  assert.equal(
    f.calls.some((call) => call[0] === 'leave' && call[1] === 'session-1'),
    true,
  );
});

test('participant gain combines master and account volume; local mute keeps saved level', async () => {
  const f = fixture();
  await f.voice.refresh();
  const joining = f.voice.join();
  await tick();
  f.connect();
  await joining;
  f.listeners.onParticipant({ sessionID: 's2', userID: 'alice' });
  f.voice.setMasterVolume(50);
  f.voice.setUserVolume('alice', 40);
  assert.deepEqual(f.calls.at(-1), ['volume', 's2', 0.2]);
  f.voice.setUserMuted('alice', true);
  assert.deepEqual(f.calls.at(-1), ['volume', 's2', 0]);
  f.voice.setUserMuted('alice', false);
  assert.deepEqual(f.calls.at(-1), ['volume', 's2', 0.2]);
  assert.equal(f.values.get('avalon.voice.preferences.v1').includes('secret'), false);
});

test('room replacement stops the old microphone and requires an explicit new join', async () => {
  const f = fixture();
  await f.voice.refresh();
  const joining = f.voice.join();
  await tick();
  f.connect();
  await joining;
  await f.voice.setMicrophoneEnabled(true);
  await f.voice.setRoom('room-2');
  assert.equal(f.voice.microphoneEnabled.value, false);
  assert.equal(f.voice.status.value, 'idle');
  assert.deepEqual(
    f.calls.filter((call) => call[0] === 'mic'),
    [
      ['mic', false],
      ['mic', true],
      ['mic', false],
    ],
  );
});

test('revocation and server state loss close media immediately', async () => {
  const f = fixture();
  await f.voice.refresh();
  const joining = f.voice.join();
  await tick();
  f.connect();
  await joining;
  await f.voice.revoke('session-1');
  assert.equal(f.voice.status.value, 'idle');
  assert.equal(
    f.calls.some((call) => call[0] === 'disconnect'),
    true,
  );
});

test('revocation while a microphone request is pending leaves capture off', async () => {
  const f = fixture();
  await f.voice.refresh();
  const joining = f.voice.join();
  await tick();
  f.connect();
  await joining;
  let resolveMic;
  f.client.setMicrophoneEnabled = async (enabled) => {
    f.calls.push(['mic', enabled]);
    if (enabled) await new Promise((resolve) => (resolveMic = resolve));
  };
  const enabling = f.voice.setMicrophoneEnabled(true);
  await f.voice.setMicrophoneEnabled(true);
  assert.equal(f.calls.filter((call) => call[0] === 'mic' && call[1]).length, 1);
  await f.voice.revoke('session-1');
  resolveMic();
  await enabling;
  assert.equal(f.voice.microphoneEnabled.value, false);
  assert.deepEqual(f.calls.filter((call) => call[0] === 'mic').slice(-3), [
    ['mic', true],
    ['mic', false],
    ['mic', false],
  ]);
});

test('LiveKit adapter routes per-person gain through Web Audio and detaches on exit', async () => {
  let instance;
  const element = {
    style: {},
    remove() {
      this.removed = true;
    },
    set volume(_) {
      throw Error('HTML volume used');
    },
  };
  const track = {
    kind: 'audio',
    attach: () => {
      assert.deepEqual(levels.at(-1), [0.25, 'microphone']);
      return element;
    },
    detach: () => {
      track.detached = true;
      return [element];
    },
  };
  const levels = [];
  const participant = {
    identity: 's2',
    metadata: '{"userID":"alice"}',
    setVolume: (value, source) => levels.push([value, source]),
  };
  class FakeRoom {
    constructor(options) {
      this.options = options;
      this.events = {};
      this.remoteParticipants = new Map([['s2', participant]]);
      this.localParticipant = { setMicrophoneEnabled: async () => undefined };
      instance = this;
    }
    on(name, callback) {
      this.events[name] = callback;
    }
    async connect() {
      this.events.trackSubscribed(track, {}, participant);
    }
    async disconnect() {
      this.disconnected = true;
    }
  }
  const sdk = {
    Room: FakeRoom,
    RoomEvent: {
      ParticipantConnected: 'participantConnected',
      ParticipantMetadataChanged: 'metadata',
      ParticipantDisconnected: 'participantDisconnected',
      TrackSubscribed: 'trackSubscribed',
      TrackUnsubscribed: 'trackUnsubscribed',
      AudioPlaybackStatusChanged: 'playback',
      Disconnected: 'disconnected',
    },
    Track: { Kind: { Audio: 'audio' }, Source: { Microphone: 'microphone' } },
  };
  const oldDocument = global.document;
  global.document = { body: { appendChild() {} } };
  try {
    const client = createLiveKitVoiceClient(sdk);
    await client.connect('wss://voice', 'token', {
      onParticipant(info) {
        client.setPlaybackVolume(info.sessionID, 0.25);
      },
      onParticipantLeft() {},
      onDisconnected() {},
      onPlaybackBlocked() {},
    });
    assert.equal(instance.options.webAudioMix, true);
    assert.deepEqual(levels, [
      [0.25, 'microphone'],
      [0.25, 'microphone'],
      [0.25, 'microphone'],
    ]);
    client.disconnect();
    assert.equal(track.detached, true);
    assert.equal(element.removed, true);
  } finally {
    global.document = oldDocument;
  }
});

for (const [name, expected] of [
  ['NotAllowedError', 'permission'],
  ['NotFoundError', 'missing'],
  ['NotReadableError', 'busy'],
  ['Error', 'failed'],
]) {
  test(`microphone ${name} keeps listening available and recovers on retry`, async () => {
    const f = fixture();
    await f.voice.refresh();
    const joining = f.voice.join();
    await tick();
    f.connect();
    await joining;
    f.client.setMicrophoneEnabled = async () => {
      throw Object.assign(new Error('browser message'), { name });
    };
    await f.voice.setMicrophoneEnabled(true);
    assert.equal(f.voice.microphoneError.value, expected);
    assert.equal(f.voice.error.value, undefined);
    assert.equal(f.voice.status.value, 'connected');
    assert.equal(f.voice.microphoneEnabled.value, false);
    assert.equal(f.voice.microphonePending.value, false);
    f.client.setMicrophoneEnabled = async () => {};
    await f.voice.setMicrophoneEnabled(true);
    assert.equal(f.voice.microphoneError.value, undefined);
    assert.equal(f.voice.microphoneEnabled.value, true);
    await f.voice.leave();
  });
}

test('late microphone rejection after leaving cannot restore an error', async () => {
  const f = fixture();
  await f.voice.refresh();
  const joining = f.voice.join();
  await tick();
  f.connect();
  await joining;
  let reject;
  f.client.setMicrophoneEnabled = (enabled) =>
    enabled
      ? new Promise((_, fail) => {
          reject = fail;
        })
      : Promise.resolve();
  const enabling = f.voice.setMicrophoneEnabled(true);
  await f.voice.leave();
  reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' }));
  await enabling;
  assert.equal(f.voice.microphoneError.value, undefined);
  assert.equal(f.voice.microphonePending.value, false);
});

test('voice indicators distinguish local mute, sender mute and live speech without leaking stale room state', async () => {
  const f = fixture();
  await f.voice.refresh();
  const joining = f.voice.join();
  await tick();
  f.connect();
  await joining;
  f.listeners.onParticipant({ sessionID: 's2', userID: 'alice', microphoneEnabled: false, speaking: false });
  assert.equal(f.voice.userStatus('alice', 'me'), 'selfMuted');
  f.listeners.onParticipantAudio('s2', { microphoneEnabled: true, speaking: true });
  assert.equal(f.voice.userStatus('alice', 'me'), 'speaking');
  f.voice.setUserMuted('alice', true);
  assert.equal(f.voice.userStatus('alice', 'me'), 'localMuted');
  f.listeners.onParticipantAudio('s2', { microphoneEnabled: false, speaking: false });
  f.voice.setUserMuted('alice', false);
  assert.equal(f.voice.userStatus('alice', 'me'), 'selfMuted');
  f.listeners.onLocalAudio({ microphoneEnabled: true, speaking: true });
  assert.equal(f.voice.userStatus('me', 'me'), 'speaking');
  f.listeners.onReconnecting(true);
  assert.equal(f.voice.userStatus('alice', 'me'), 'unknown');
  f.listeners.onReconnecting(false);
  assert.equal(f.voice.userStatus('missing', 'me'), 'offline');
  await f.voice.leave();
  f.listeners.onParticipantAudio('s2', { microphoneEnabled: true, speaking: true });
  f.listeners.onLocalAudio({ microphoneEnabled: true, speaking: true });
  assert.equal(f.voice.userStatus('alice', 'me'), 'unknown');
  assert.equal(f.voice.microphoneEnabled.value, false);
  assert.equal(f.voice.speaking.value, false);
});

test('multiple sessions for one player show speech if any unmuted microphone is speaking', async () => {
  const f = fixture();
  await f.voice.refresh();
  const joining = f.voice.join();
  await tick();
  f.connect();
  await joining;
  f.listeners.onParticipant({ sessionID: 's2', userID: 'alice', microphoneEnabled: false, speaking: false });
  f.listeners.onParticipant({ sessionID: 's3', userID: 'alice', microphoneEnabled: true, speaking: true });
  assert.equal(f.voice.userStatus('alice', 'me'), 'speaking');
  f.listeners.onParticipantLeft('s3');
  assert.equal(f.voice.userStatus('alice', 'me'), 'selfMuted');
  await f.voice.leave();
});

test('SDK forwards microphone and speaker changes for local and remote participants', async () => {
  let instance;
  const remote = { identity: 's2', metadata: '{"userID":"alice"}', isMicrophoneEnabled: false, isSpeaking: false };
  class FakeRoom {
    constructor() {
      instance = this;
      this.events = {};
      this.remoteParticipants = new Map([['s2', remote]]);
      this.localParticipant = {
        identity: 'self',
        isMicrophoneEnabled: false,
        isSpeaking: false,
        setMicrophoneEnabled: async () => {},
      };
    }
    on(name, fn) {
      this.events[name] = fn;
    }
    async connect() {}
    async disconnect() {}
  }
  const names = [
    'ParticipantConnected',
    'ParticipantMetadataChanged',
    'ParticipantDisconnected',
    'TrackSubscribed',
    'TrackUnsubscribed',
    'AudioPlaybackStatusChanged',
    'Disconnected',
    'TrackMuted',
    'TrackUnmuted',
    'TrackPublished',
    'TrackUnpublished',
    'LocalTrackPublished',
    'LocalTrackUnpublished',
    'ActiveSpeakersChanged',
    'Reconnecting',
    'Reconnected',
  ];
  const changes = [];
  const local = [];
  const client = createLiveKitVoiceClient({
    Room: FakeRoom,
    RoomEvent: Object.fromEntries(names.map((n) => [n, n])),
    Track: { Kind: { Audio: 'audio' }, Source: { Microphone: 'microphone' } },
  });
  await client.connect('wss://voice', 'test', {
    onParticipant() {},
    onParticipantLeft() {},
    onDisconnected() {},
    onPlaybackBlocked() {},
    onParticipantAudio: (id, s) => changes.push([id, s]),
    onLocalAudio: (s) => local.push(s),
    onReconnecting() {},
  });
  remote.isMicrophoneEnabled = true;
  remote.isSpeaking = true;
  instance.localParticipant.isMicrophoneEnabled = true;
  instance.localParticipant.isSpeaking = true;
  instance.events.ActiveSpeakersChanged([remote, instance.localParticipant]);
  assert.deepEqual(changes.at(-1), ['s2', { microphoneEnabled: true, speaking: true }]);
  assert.deepEqual(local.at(-1), { microphoneEnabled: true, speaking: true });
  remote.isMicrophoneEnabled = false;
  instance.events.TrackMuted({}, remote);
  assert.deepEqual(changes.at(-1), ['s2', { microphoneEnabled: false, speaking: false }]);
  client.disconnect();
  const count = changes.length;
  instance.events.ActiveSpeakersChanged([]);
  assert.equal(changes.length, count);
});
