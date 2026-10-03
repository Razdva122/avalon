const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync(require.resolve('../src/components/view/board/helpers.ts'), 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const helpers = {};
new Function('require', 'exports', code)(require, helpers);

const attack = { type: 'assassinate', assassinateType: 'merlin', result: 'miss', killedIDs: ['p2'], assassinID: 'p3' };
const declaration = { type: 'announceLoyalty', announcerID: 'p1', targetID: 'p2', announced: 'evil', actual: 'good' };
const game = (history = [], extra = {}) => ({ uuid: 'game-a', stage: 'assassinate', history, players: [], ...extra });

test('only a newly appended live event is queued, once, and survives the final role reveal', () => {
  assert.equal(typeof helpers.createLiveEventTracker, 'function');
  const tracker = helpers.createLiveEventTracker(game());
  tracker.observe(game([attack]), 'live');
  tracker.observe(game([attack], { stage: 'end' }), 'live');
  assert.deepEqual(tracker.take(0), attack);
  assert.equal(tracker.take(0), undefined);
});

test('initial archive, reconnect, catchup, replay and new games never autoplay', () => {
  assert.equal(typeof helpers.createLiveEventTracker, 'function');
  const tracker = helpers.createLiveEventTracker(game([declaration]));
  assert.equal(tracker.take(0), undefined);
  tracker.observe(game([declaration, attack]), 'live', true);
  assert.equal(tracker.take(1), undefined);
  tracker.observe(game([declaration, attack, declaration, attack]), 'live');
  assert.equal(tracker.take(3), undefined);
  tracker.observe(game([declaration, attack, declaration, attack, declaration]), 'history');
  tracker.observe(game([declaration, attack, declaration, attack, declaration]), 'live');
  assert.equal(tracker.take(4), undefined);
  tracker.observe(game([attack], { uuid: 'game-b' }), 'live');
  assert.equal(tracker.take(0), undefined);
});

test('assassination uses revealed end roles, including Merlin Pure, and waits before end', () => {
  assert.equal(typeof helpers.assassinationReveal, 'function');
  const players = [
    { id: 'p1', role: 'merlinPure' },
    { id: 'p2', role: 'percival' },
  ];
  const ended = game([attack], { stage: 'end', result: { winner: 'good', reason: 'missMerlin' }, players });
  assert.deepEqual(helpers.assassinationReveal(ended), {
    role: 'percival',
    targetRole: 'merlinPure',
    selectedID: 'p2',
    targetID: 'p1',
    hit: false,
  });
  assert.equal(helpers.assassinationReveal({ ...ended, stage: 'assassinate' }), undefined);
  assert.equal(
    helpers.assassinationReveal({ ...ended, history: [{ ...attack, assassinateType: 'lovers' }] }),
    undefined,
  );
  const hit = { ...attack, result: 'hit', killedIDs: ['p1'] };
  assert.deepEqual(
    helpers.assassinationReveal({ ...ended, history: [hit], result: { winner: 'evil', reason: 'killMerlin' } }),
    { role: 'merlinPure', targetRole: 'merlinPure', selectedID: 'p1', targetID: 'p1', hit: true },
  );
});

test('Guinevere reveals the chosen player and the actual Guinevere on a miss or a hit', () => {
  const players = [
    { id: 'p1', role: 'guinevere' },
    { id: 'p2', role: 'servant' },
  ];
  for (const hit of [false, true]) {
    const event = {
      ...attack,
      assassinateType: 'guinevere',
      result: hit ? 'hit' : 'miss',
      killedIDs: [hit ? 'p1' : 'p2'],
    };
    const ended = game([event], {
      stage: 'end',
      players,
      result: { winner: hit ? 'evil' : 'good', reason: hit ? 'killGuinevere' : 'missGuinevere' },
    });
    assert.deepEqual(helpers.assassinationReveal(ended), {
      role: hit ? 'guinevere' : 'servant',
      targetRole: 'guinevere',
      selectedID: hit ? 'p1' : 'p2',
      targetID: 'p1',
      hit,
    });
  }
});

test('two-stage Cleric and Lovers assassinations do not use the single-card animation', () => {
  const players = [
    { id: 'p1', role: 'merlin' },
    { id: 'p2', role: 'cleric' },
  ];
  for (const assassinateType of ['cleric', 'lovers']) {
    const event = { ...attack, assassinateType, killedIDs: ['p2'] };
    assert.equal(
      helpers.assassinationReveal(game([event], { stage: 'end', players, result: { reason: 'killMerlin' } })),
      undefined,
    );
  }
});

test('team badge follows the public claim, including a lie, without reading actual loyalty', () => {
  assert.equal(typeof helpers.loyaltyBadge, 'function');
  assert.deepEqual(helpers.loyaltyBadge(declaration), { team: 'evil', sourceID: 'p1', targetID: 'p2' });
  assert.equal(helpers.loyaltyBadge({ ...declaration, announced: 'merlin' }), undefined);
  assert.equal(helpers.loyaltyBadge({ type: 'hidden' }), undefined);
});

test('a still-visible old declaration cannot consume a newer assassination', () => {
  const tracker = helpers.createLiveEventTracker(game());
  tracker.observe(game([declaration]), 'live');
  assert.deepEqual(tracker.take(0), declaration);
  tracker.observe(game([declaration, attack]), 'live');
  assert.equal(tracker.take(0), undefined);
  tracker.observe(game([declaration, attack], { stage: 'end' }), 'live');
  assert.deepEqual(tracker.take(1), attack);
});
