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

test('Lovers reveals two selected cards only after end roles are public', () => {
  const event = { ...attack, assassinateType: 'lovers', result: 'hit', killedIDs: ['p1', 'p2'] };
  const ended = game([event], {
    stage: 'end',
    result: { reason: 'killLovers' },
    players: [
      { id: 'p1', role: 'tristan' },
      { id: 'p2', role: 'isolde' },
    ],
  });
  const reveal = helpers.assassinationReveal(ended);
  assert.equal(reveal.variant, 'cut');
  assert.deepEqual(reveal.cards, [
    { id: 'p1', role: 'tristan', hit: true },
    { id: 'p2', role: 'isolde', hit: true },
  ]);
  assert.equal(helpers.assassinationReveal({ ...ended, stage: 'assassinate' }), undefined);
  assert.equal(
    helpers.assassinationReveal({
      ...ended,
      players: [
        { id: 'p1', role: 'unknown' },
        { id: 'p2', role: 'isolde' },
      ],
    }),
    undefined,
  );
  const miss = helpers.assassinationReveal({
    ...ended,
    history: [{ ...event, result: 'miss' }],
    result: { reason: 'missLovers' },
  });
  assert.ok(miss.cards.every((card) => !card.hit));
});

test('Cleric verdict follows public first-stage reveal and final second-stage outcome', () => {
  const first = { ...attack, assassinateType: 'cleric', result: 'hit', killedIDs: ['p1'] };
  const players = [
    { id: 'p1', role: 'cleric' },
    { id: 'p2', role: 'percival' },
  ];
  const pending = game([first], { players, addonsData: { assassin: { progressData: { type: 'cleric', stage: 1 } } } });
  const reveal = helpers.assassinationReveal(pending);
  assert.equal(reveal.pending, true);
  assert.deepEqual(reveal.cards, [{ id: 'p1', role: 'cleric', hit: true }]);
  const second = { ...first, result: 'miss', killedIDs: ['p2'] };
  const ended = game([first, second], { players, stage: 'end', result: { reason: 'missCleric' } });
  assert.deepEqual(helpers.assassinationReveal(ended).cards, [
    { id: 'p1', role: 'cleric', hit: true },
    { id: 'p2', role: 'percival', hit: false },
  ]);
  assert.deepEqual(helpers.assassinationReveal({ ...ended, history: [second] }).cards, [
    { id: 'p2', role: 'percival', hit: false },
  ]);
  assert.equal(helpers.assassinationReveal({ ...pending, players: [{ id: 'p1', role: 'unknown' }] }), undefined);
  assert.equal(helpers.assassinationReveal({ ...pending, addonsData: {} }), undefined);
});

test('a second Cleric guess on the same player preserves both stage verdicts', () => {
  const first = { ...attack, assassinateType: 'cleric', result: 'hit', killedIDs: ['p1'] };
  const second = { ...first, result: 'miss' };
  const ended = game([first, second], {
    stage: 'end',
    result: { reason: 'missCleric' },
    players: [{ id: 'p1', role: 'cleric' }],
  });
  assert.deepEqual(helpers.assassinationReveal(ended).cards, [
    { id: 'p1', role: 'cleric', hit: true },
    { id: 'p1', role: 'cleric', hit: false },
  ]);
});

test('mission reveal uses only public counts and the published result', () => {
  const mission = {
    type: 'mission',
    index: 3,
    settings: { players: 4, failsRequired: 2 },
    fails: 1,
    result: 'success',
    actions: [{ playerID: 'secret', result: 'fail' }],
  };
  assert.deepEqual(helpers.missionReveal(mission), { index: 3, players: 4, fails: 1, result: 'success' });
  assert.deepEqual(helpers.missionReveal({ ...mission, hidden: true }), { index: 3, players: 4, hidden: true });
  assert.equal(helpers.missionReveal({ ...mission, fails: undefined }), undefined);
  assert.equal(helpers.missionReveal({ ...mission, fails: 5 }), undefined);
  assert.equal(helpers.missionReveal({ ...mission, result: undefined }), undefined);
});
