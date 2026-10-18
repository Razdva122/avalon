const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
const source = fs.readFileSync(require.resolve('../src/helpers/beginner-tips.ts'), 'utf8');
new Function(
  'require',
  'module',
  'exports',
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
)(require, moduleUnderTest, moduleUnderTest.exports);
const { beginnerTip, tipsDisabled, saveTipsDisabled } = moduleUnderTest.exports;
const ai = { beginner: true, status: 'running', humanPlayerID: 'human' };
function game(stage, features = {}, extra = {}) {
  return {
    stage,
    vote: 0,
    mission: 0,
    history: [],
    settings: { roles: { good: ['servant'], evil: ['minion'] } },
    players: [
      {
        id: 'human',
        role: 'servant',
        features: { waitForAction: true, ...features },
        validMissionsResult: ['success'],
      },
    ],
    ...extra,
  };
}
test('tips are restricted to a beginner participant, including finished games', () => {
  assert.equal(beginnerTip(game('selectTeam', { isLeader: true }), ai, 'human'), 'selectLeader');
  assert.equal(beginnerTip(game('selectTeam'), { ...ai, beginner: false }, 'human'), null);
  assert.equal(beginnerTip(game('selectTeam'), ai, 'spectator'), null);
  assert.equal(beginnerTip(game('selectTeam'), ai, undefined), null);
  assert.equal(beginnerTip(game('end'), { ...ai, status: 'finished' }, 'human'), 'end');
});
test('the fifth proposal skips voting and advises the leader and waiting player', () => {
  assert.equal(beginnerTip(game('selectTeam', { isLeader: true }, { vote: 3 }), ai, 'human'), 'selectLeader');
  assert.equal(beginnerTip(game('selectTeam', { isLeader: true }, { vote: 4 }), ai, 'human'), 'fifthLeader');
  assert.equal(beginnerTip(game('selectTeam', {}, { vote: 4 }), ai, 'human'), 'fifthWait');
});
test('discussion precedes selection instructions and actions reflect whether the player already acted', () => {
  assert.equal(
    beginnerTip(game('selectTeam', { isLeader: true }), { ...ai, waitingForDiscussion: true }, 'human'),
    'discussion',
  );
  assert.equal(beginnerTip(game('selectTeam'), { ...ai, discussionPending: true }, 'human'), 'discussionWait');
  assert.equal(beginnerTip(game('votingForTeam'), ai, 'human'), 'vote');
  assert.equal(beginnerTip(game('votingForTeam', { waitForAction: false }), ai, 'human'), 'voteWait');
  assert.equal(beginnerTip(game('onMission', { isSent: true }), ai, 'human'), 'missionGood');
  assert.equal(
    beginnerTip(
      game(
        'onMission',
        { isSent: true },
        {
          players: [
            {
              id: 'human',
              role: 'minion',
              features: { isSent: true, waitForAction: true },
              validMissionsResult: ['success', 'fail'],
            },
          ],
        },
      ),
      ai,
      'human',
    ),
    'missionEvil',
  );
  assert.equal(beginnerTip(game('onMission'), ai, 'human'), 'missionWait');
  assert.equal(beginnerTip(game('onMission', { isSent: true, waitForAction: false }), ai, 'human'), 'missionWait');
});
test('mission results use public history and assassination advice is limited to the assassin', () => {
  assert.equal(
    beginnerTip(game('selectTeam', {}, { history: [{ type: 'mission', result: 'fail' }] }), ai, 'human'),
    'resultFail',
  );
  assert.equal(
    beginnerTip(game('selectTeam', {}, { history: [{ type: 'mission', result: 'success' }] }), ai, 'human'),
    'resultSuccess',
  );
  assert.equal(beginnerTip(game('assassinate', { isAssassin: true }), ai, 'human'), 'assassin');
  assert.equal(beginnerTip(game('assassinate'), ai, 'human'), 'assassinWait');
});
test('hidden quest results are never described as successful', () => {
  assert.equal(
    beginnerTip(game('selectTeam', {}, { history: [{ type: 'mission', hidden: true }] }), ai, 'human'),
    'selectWait',
  );
});
test('final Evil council never receives quest team discussion advice', () => {
  assert.equal(
    beginnerTip(game('assassinate', { isAssassin: true }), { ...ai, waitingForDiscussion: true }, 'human'),
    'assassin',
  );
  assert.equal(beginnerTip(game('assassinate'), { ...ai, discussionPending: true }, 'human'), 'assassinWait');
});
test('disabling survives a reload, stays scoped to this player and party, and can be reversed', () => {
  const entries = new Map();
  const storage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
  assert.equal(tipsDisabled(storage, 'room-a', 'human'), false);
  saveTipsDisabled(storage, 'room-a', 'human', true);
  assert.equal(tipsDisabled(storage, 'room-a', 'human'), true);
  assert.equal(tipsDisabled(storage, 'room-b', 'human'), false);
  assert.equal(tipsDisabled(storage, 'room-a', 'other'), false);
  saveTipsDisabled(storage, 'room-a', 'human', false);
  assert.equal(tipsDisabled(storage, 'room-a', 'human'), false);
});
test('unavailable browser storage does not prevent playing or disabling for this session', () => {
  const storage = {
    getItem() {
      throw Error('blocked');
    },
    setItem() {
      throw Error('quota');
    },
    removeItem() {
      throw Error('blocked');
    },
  };
  assert.equal(tipsDisabled(storage, 'room', 'human'), false);
  assert.doesNotThrow(() => saveTipsDisabled(storage, 'room', 'human', true));
  assert.doesNotThrow(() => saveTipsDisabled(storage, 'room', 'human', false));
});
