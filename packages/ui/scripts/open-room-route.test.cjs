const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { createRouter, createMemoryHistory } = require('vue-router');

function load() {
  const path = require('node:path').join(__dirname, '../src/helpers/open-room-route.ts');
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function('exports', code)(exports);
  return exports;
}

async function fixture() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/profile', name: 'profile', component: {} },
      { path: '/room/:uuid', name: 'room', component: {} },
      { path: '/groups', name: 'groups', component: {} },
    ],
  });
  await router.push('/profile');
  let release;
  let entered;
  const paused = new Promise((resolve) => {
    entered = resolve;
  });
  const remove = router.beforeResolve((to) => {
    if (to.name === 'room') {
      entered();
      return new Promise((resolve) => {
        release = resolve;
      });
    }
  });
  return { router, paused, resume: () => release(), remove };
}

test('closing while room navigation is resolving keeps the current page', async () => {
  const room = await fixture();
  let active = true;
  const pending = load().openRoomRoute(room.router, 'new-room', () => active);
  await room.paused;
  active = false;
  room.resume();
  assert.equal(await pending, false);
  assert.equal(room.router.currentRoute.value.path, '/profile');
  room.remove();
  await room.router.push('/room/new-room');
  assert.equal(room.router.currentRoute.value.path, '/room/new-room', 'temporary guard is removed after cancellation');
});

test('cancelling a room transition does not block navigation to another page', async () => {
  const room = await fixture();
  let active = true;
  const pending = load().openRoomRoute(room.router, 'new-room', () => active);
  await room.paused;
  active = false;
  await room.router.push('/groups');
  room.resume();
  assert.equal(await pending, false);
  assert.equal(room.router.currentRoute.value.path, '/groups');
});

test('active room navigation succeeds and releases its temporary guard', async () => {
  const room = await fixture();
  const pending = load().openRoomRoute(room.router, 'new-room', () => true);
  await room.paused;
  room.resume();
  assert.equal(await pending, true);
  assert.equal(room.router.currentRoute.value.path, '/room/new-room');
});
