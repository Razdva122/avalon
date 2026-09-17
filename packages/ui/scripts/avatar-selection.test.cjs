const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { useAvatarSelection } = require('../src/helpers/composables/useAvatarSelection.ts');
const available = { id: 'merlin', available: true };
const locked = { id: 'oberon', available: false };
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function create(load = async () => [locked, available], save = async () => true) {
  return useAvatarSelection({ load, save, current: () => 'servant' });
}
test('opening loads available avatars first and recovers from a failed load', async () => {
  let fail = true;
  const picker = create(async () => {
    if (fail) throw Error('offline');
    return [locked, available];
  });
  await picker.open();
  assert.equal(picker.loadFailed.value, true);
  assert.equal(picker.loading.value, false);
  fail = false;
  await picker.open();
  assert.equal(picker.loadFailed.value, false);
  assert.deepEqual(
    picker.avatars.value.map((a) => a.id),
    ['merlin', 'oberon'],
  );
});
test('locked avatars explain requirements without saving or raising an error', async () => {
  const picker = create(undefined, async () => assert.fail('locked avatar must not be saved'));
  await picker.select(locked);
  assert.equal(picker.inspected.value.id, 'oberon');
  assert.equal(picker.saveFailed.value, false);
  assert.equal(picker.savingId.value, null);
});
test('serializes saves and reports success only after the server acknowledges', async () => {
  const request = deferred();
  const saved = [];
  const picker = create(undefined, async (id) => {
    saved.push(id);
    return request.promise;
  });
  const pending = picker.select(available);
  assert.equal(picker.savingId.value, 'merlin');
  assert.equal(picker.saved.value, false);
  await picker.select({ id: 'good', available: true });
  assert.deepEqual(saved, ['merlin']);
  request.resolve(true);
  await pending;
  assert.equal(picker.savingId.value, null);
  assert.equal(picker.saved.value, true);
});
test('failed saves allow retry without claiming success', async () => {
  let fail = true;
  const picker = create(undefined, async () => {
    if (fail) throw Error('timeout');
    return true;
  });
  await picker.select(available);
  assert.equal(picker.saveFailed.value, true);
  assert.equal(picker.saved.value, false);
  assert.equal(picker.savingId.value, null);
  fail = false;
  await picker.select(available);
  assert.equal(picker.saveFailed.value, false);
  assert.equal(picker.saved.value, true);
});
test('server rejection is reported as a save failure', async () => {
  const picker = create(undefined, async () => ({ error: 'avatarNotAvailable' }));
  await picker.select(available);
  assert.equal(picker.saveFailed.value, true);
  assert.equal(picker.saved.value, false);
});
test('selecting current avatar does not send a redundant save', async () => {
  const picker = create(undefined, async () => assert.fail('current avatar must not be saved'));
  await picker.select({ id: 'servant', available: true });
  assert.equal(picker.saved.value, false);
});
test('a late load cannot replace a newer session', async () => {
  const old = deferred();
  let calls = 0;
  const picker = create(() => (++calls === 1 ? old.promise : Promise.resolve([available])));
  const first = picker.open();
  picker.close();
  await picker.open();
  old.resolve([locked]);
  await first;
  assert.deepEqual(
    picker.avatars.value.map((a) => a.id),
    ['merlin'],
  );
});
test('reopening keeps a pending save attached to its avatar and reports failure with retry', async () => {
  const request = deferred();
  const picker = create(undefined, () => request.promise);
  const pending = picker.select(available);
  picker.close();
  await picker.open();
  assert.equal(picker.inspected.value?.id, 'merlin');
  assert.equal(picker.savingId.value, 'merlin');
  request.reject(Error('offline'));
  await pending;
  assert.equal(picker.saveFailed.value, true);
  assert.equal(picker.savingId.value, null);
});
test('reopening after a completed save clears old feedback', async () => {
  const picker = create();
  await picker.select(available);
  picker.close();
  await picker.open();
  assert.equal(picker.saved.value, false);
  assert.equal(picker.inspected.value, null);
});
