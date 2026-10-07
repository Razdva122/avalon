const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { parse } = require('@vue/compiler-sfc');
const { ref } = require('vue');

test('AI room snapshots and updates preserve the user-selected chat visibility', () => {
  const filename = require.resolve('../src/pages/room/Room.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'));
  const source = ts.createSourceFile(filename, descriptor.script.content, ts.ScriptTarget.Latest, true);
  let receive;
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'createRoomSession') {
      receive = node.arguments[2].getText(source);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.ok(receive, 'room session state receiver exists');
  const chatOpen = ref(false);
  const callback = new Function('chatOpen', 'errorMessage', 'stateManager', 'userID', `return (${receive});`)(
    chatOpen,
    ref(),
    { mutateRoomState() {} },
    ref('spectator'),
  );

  callback({ ai: {} }, 'snapshot');
  assert.equal(chatOpen.value, false, 'joining an AI room keeps chat closed');
  chatOpen.value = true;
  callback({ ai: {} }, 'update');
  assert.equal(chatOpen.value, true, 'updates preserve manually opened chat');
  chatOpen.value = false;
  callback({ ai: {} }, 'update');
  assert.equal(chatOpen.value, false, 'updates do not reopen dismissed chat');
  callback({ ai: {} }, 'snapshot');
  assert.equal(chatOpen.value, false, 'reconnecting does not reopen dismissed chat');
});

test('human discussion snapshots preserve manually selected chat visibility', () => {
  const filename = require.resolve('../src/pages/room/Room.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'));
  const source = ts.createSourceFile(filename, descriptor.script.content, ts.ScriptTarget.Latest, true);
  let opensChatOnTurn = false;
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(source) === 'watch' &&
      node.arguments[0].getText(source).includes('waitingForDiscussion')
    )
      opensChatOnTurn = true;
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.equal(opensChatOnTurn, false, 'speaking turn must not force chat open');
});
