const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { useRoomChat, messageKey, groupMessages } = require('../src/helpers/composables/useRoomChat.ts');
const message = (id, userID = 'bob') => ({ id, userID, message: id, timestamp: 1000 });
test('counts only new incoming messages and marks only visible entries read', () => {
  const chat = useRoomChat(
    () => 'alice',
    async () => ({ error: 'notInRoom' }),
  );
  chat.receive([message('old')]);
  chat.receive([message('old'), message('1'), message('2', 'alice'), message('3')]);
  assert.equal(chat.unread.value.length, 2);
  chat.markRead(['1']);
  assert.deepEqual(chat.unread.value, ['3']);
  chat.receive([message('old'), message('1'), message('2', 'alice'), message('3')]);
  assert.deepEqual(chat.unread.value, ['3']);
});
test('retry keeps the same request ID and successful ack reconciles broadcast', async () => {
  const calls = [];
  let fail = true;
  const chat = useRoomChat(
    () => 'alice',
    async (text, id) => {
      calls.push(id);
      if (fail) throw Error('offline');
      return { message: { ...message('server', 'alice'), requestID: id, message: text } };
    },
  );
  await chat.send(' hello ');
  assert.equal(chat.outbox.value[0].status, 'failed');
  const id = chat.outbox.value[0].requestID;
  fail = false;
  await chat.retry(id);
  assert.deepEqual(calls, [id, id]);
  assert.equal(chat.outbox.value[0].status, 'sent');
  chat.receive([{ ...message('server', 'alice'), requestID: id, message: 'hello' }]);
  assert.equal(chat.outbox.value.length, 0);
});
test('room reset ignores late delivery responses', async () => {
  let resolve;
  const chat = useRoomChat(
    () => 'alice',
    () => new Promise((r) => (resolve = r)),
  );
  const sending = chat.send('hello');
  chat.reset();
  resolve({ message: message('late') });
  await sending;
  assert.equal(chat.outbox.value.length, 0);
  assert.equal(chat.unread.value.length, 0);
});
test('groups nearby same-author messages but preserves the unread boundary', () => {
  const msgs = [message('1'), message('2'), message('3', 'alice')];
  assert.equal(groupMessages(msgs).length, 2);
  assert.equal(groupMessages(msgs, '2').length, 3);
  assert.notEqual(messageKey({ ...message('x'), id: undefined }, 0), messageKey({ ...message('x'), id: undefined }, 1));
});
