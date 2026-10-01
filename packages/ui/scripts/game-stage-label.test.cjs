const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { gameStageLabel } = require('../src/helpers/game-stage-label.ts');
test('decision and board stages share translated game labels', () => {
  assert.equal(gameStageLabel('selectTeam'), 'team building');
  assert.equal(gameStageLabel('votingForTeam'), 'voting');
  assert.equal(gameStageLabel('onMission'), 'mission');
  assert.equal(gameStageLabel('checkLoyalty'), 'check loyalty');
  assert.equal(gameStageLabel('unrecognized'), 'stage');
});
