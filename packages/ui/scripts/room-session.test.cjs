const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { createRoomSession } = require('../src/helpers/room-session.ts');

function setup() {
  const handlers = {};
  const pending = [];
  const states = [];
  const errors = [];
  const chats = [];
  let redirects = 0;
  let id = 'room';
  const socket = {
    on: (name, handler) => {
      handlers[name] = handler;
    },
    off: (name) => {
      delete handlers[name];
    },
    emitWithAck: (event, roomID) =>
      new Promise((resolve) => {
        pending.push({ event, roomID, resolve });
      }),
  };
  const session = createRoomSession(
    socket,
    () => id,
    (state) => states.push(state),
    (error) => errors.push(error),
    () => redirects++,
    (chat) => chats.push(chat),
  );
  return {
    handlers,
    pending,
    states,
    errors,
    chats,
    session,
    setID: (value) => {
      id = value;
    },
    redirects: () => redirects,
  };
}

test('room expiry reloads the archive and keeps the chat page open', async () => {
  const f = setup();
  const expiry = f.handlers.destroyRoom('room');
  f.pending[0].resolve({ roomID: 'room', archived: true, chat: [{ message: 'saved' }] });
  await expiry;
  assert.equal(f.redirects(), 0);
  assert.equal(f.states[0].chat[0].message, 'saved');
  assert.equal(f.states[0].archived, true);
});

test('only a missing expired room redirects; a database failure keeps the page recoverable', async () => {
  const f = setup();
  const first = f.handlers.destroyRoom('room');
  f.pending[0].resolve({ error: 'requestFailed' });
  await first;
  assert.equal(f.redirects(), 0);
  assert.equal(f.errors[0].error, 'requestFailed');
  const second = f.handlers.destroyRoom('room');
  f.pending[1].resolve({ error: 'errorNotFound' });
  await second;
  assert.equal(f.redirects(), 1);
});

test('reconnect rejoins, ignores stale loads, and retains a broadcast newer than the join snapshot', async () => {
  const f = setup();
  const first = f.session.load('room');
  f.setID('other');
  const second = f.handlers.connect();
  f.pending[0].resolve({ roomID: 'room', chat: [] });
  f.handlers.roomUpdated({ roomID: 'other', chat: [{ message: 'new' }] });
  f.pending[1].resolve({ roomID: 'other', chat: [] });
  await Promise.all([first, second]);
  assert.deepEqual(f.states, [{ roomID: 'other', chat: [{ message: 'new' }] }]);
  f.session.dispose();
  assert.deepEqual(Object.keys(f.handlers), []);
});

test('a buffered lobby update cannot replace a newer started-game acknowledgement', async () => {
  const f = setup();
  const loading = f.session.load('room');
  f.handlers.roomUpdated({ roomID: 'room', stage: 'locked', chat: [] });
  f.pending[0].resolve({ roomID: 'room', stage: 'started', game: { stage: 'selectTeam' }, chat: [] });
  await loading;
  assert.equal(f.states[0].stage, 'started');
  assert.equal(f.states[0].game.stage, 'selectTeam');
});

test('chat-only broadcasts update messages without rebuilding the game replay', () => {
  const f = setup();
  f.handlers.roomUpdated({ roomID: 'room', chat: [{ id: 'new', message: 'hello' }] }, true);
  assert.deepEqual(f.states, []);
  assert.deepEqual(f.chats, [[{ id: 'new', message: 'hello' }]]);
});
