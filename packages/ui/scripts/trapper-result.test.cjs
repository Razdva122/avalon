const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { privateTrapperCard } = require('../src/helpers/trapper-result.ts');

test('Trapper result is a private reveal for the committing leader, never a spectator or target', () => {
  const game = {
    uuid: 'room',
    stage: 'selectTeam',
    history: [{ type: 'discardMissionCard', leaderID: 'leader', targetID: 'target', result: 'fail' }],
  };
  assert.equal(privateTrapperCard(game, 'leader')?.event.result, 'fail');
  assert.equal(privateTrapperCard(game, 'target'), undefined);
  assert.equal(privateTrapperCard(game), undefined);
  assert.equal(
    privateTrapperCard({ ...game, history: [{ ...game.history[0], result: undefined }] }, 'leader'),
    undefined,
  );
  assert.equal(privateTrapperCard({ ...game, stage: 'end' }, 'leader'), undefined);
});

test('A restored snapshot finds the latest own result behind newer mission events', () => {
  const history = [
    { type: 'discardMissionCard', leaderID: 'leader', targetID: 'a', result: 'fail' },
    { type: 'mission' },
    { type: 'discardMissionCard', leaderID: 'leader', targetID: 'b', result: 'success' },
    { type: 'mission' },
  ];
  const reveal = privateTrapperCard({ uuid: 'room', stage: 'selectTeam', history }, 'leader');
  assert.equal(reveal?.event.targetID, 'b');
  assert.equal(reveal.key, 'room:2');
});

const { missionReveal } = require('../src/components/view/board/helpers.ts');
test('Mission reveal shows only remaining cards, even when the excluded action is hidden', () => {
  const event = {
    type: 'mission',
    index: 3,
    settings: { players: 6 },
    excludedPlayerID: 'target',
    actions: [],
    hidden: false,
    fails: 1,
    result: 'success',
  };
  assert.equal(missionReveal(event)?.players, 5);
  assert.equal(missionReveal({ ...event, hidden: true })?.players, 5);
});
