const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const file = path.join(__dirname, '../src/components/playground/excaliburJump.ts');
const game = {};
if (fs.existsSync(file)) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('exports', code)(game);
}

test('Excalibur climbs from one ledge to the next and gains height', () => {
  assert.equal(typeof game.createRun, 'function', 'engine creates a fresh run');
  const run = game.createRun(() => 0.5);
  const next = run.ledges[1];
  for (let frame = 0; frame < 60; frame++) {
    const distance = next.x + next.width / 2 - run.x;
    game.advance(run, 1 / 120, Math.abs(distance) > 2 ? Math.sign(distance) : 0);
  }
  assert.ok(run.y > next.y);
  for (let frame = 0; frame < 60; frame++) game.advance(run, 1 / 120, 0);
  assert.ok(run.y > next.y + 25, 'the first successful landing launches another jump');
  assert.ok(game.height(run) >= 15);
  assert.equal(run.over, false);
});

test('bouncing on the starting stone or falling away from it does not count as climbing', () => {
  const idle = game.createRun(() => 0.5);
  for (let frame = 0; frame < 360; frame++) game.advance(idle, 1 / 120, 0);
  assert.equal(game.height(idle), 0);
  assert.equal(idle.over, false);

  const fallen = game.createRun(() => 0.5);
  for (let frame = 0; frame < 240; frame++) game.advance(fallen, 1 / 120, -1);
  assert.equal(game.height(fallen), 0);
  assert.equal(fallen.over, true);
});

test('a landing preview follows the first reachable surface and vanishes on a miss', () => {
  assert.equal(typeof game.landingPreview, 'function');
  const run = game.createRun(() => 0.5);
  const ledge = run.ledges[1];
  run.x = ledge.x + ledge.width / 2;
  run.y = ledge.y + 32;
  run.vy = -125;
  assert.equal(game.landingPreview(run), ledge);
  run.x = 25;
  assert.equal(game.landingPreview(run), undefined);
  run.x = ledge.x + ledge.width / 2;
  run.vy = 125;
  assert.equal(game.landingPreview(run), undefined);
});

test('the moving edge of a lily cannot promise a landing the physics will miss', () => {
  const run = game.createRun(() => 0.5);
  const lily = { x: 103, y: 1220, width: 54, kind: 'lily', swing: 24 };
  Object.assign(run, {
    ledges: [lily],
    scrollY: 1150,
    peak: 1350,
    x: 77.00894,
    y: 1250.7863,
    vy: -298.1269,
    elapsed: 27.372735,
  });
  const predicted = game.landingPreview(run);
  while (run.y >= lily.y && run.vy < 0) game.advance(run, 1 / 120, 0);
  assert.ok(run.y < lily.y, 'the sword fell past the lily');
  assert.equal(predicted, undefined);
});

test('a rare rune reverses a fall immediately and delivers a sustained climb', () => {
  const run = game.createRun(() => 0.5);
  const next = run.ledges.find((ledge) => ledge.rune);
  run.x = next.rune.x;
  run.y = next.rune.y - 16;
  run.vy = -240;
  const pickupHeight = run.y;
  game.advance(run, 1 / 120, 0);
  assert.ok(run.vy >= 1040, 'pickup launches the sword before it touches a ledge');
  assert.ok(run.surge > 0, 'pickup triggers the trail');
  assert.equal(next.rune, undefined);
  for (let frame = 0; frame < 108; frame++) game.advance(run, 1 / 120, 0);
  assert.ok(run.y > pickupHeight + 450, 'the boost skips several platforms');
});

test('the first screen teaches stone landings before introducing one mechanic at a time', () => {
  const run = game.createRun(() => 0.5);
  const firstSpecial = run.ledges.find((ledge) => ledge.kind !== 'stone');
  const firstRune = run.ledges.find((ledge) => ledge.rune).rune;
  const firstCracked = run.ledges.find((ledge) => ledge.kind === 'cracked');
  assert.ok(firstSpecial.y > game.HEIGHT && firstSpecial.kind === 'lily');
  assert.ok(firstRune.y >= firstSpecial.y + 85);
  assert.ok(firstCracked.y >= firstRune.y + 120);
});

test('ordinary jumps reach the first rune by steering from the platform beneath it', () => {
  const run = game.createRun(() => 0.5);
  const runePlatform = run.ledges.find((ledge) => ledge.rune);
  const route = run.ledges.filter((ledge) => ledge.y <= runePlatform.y);
  let next = 1;
  for (let frame = 0; frame < 1200 && !run.over && !run.surge; frame++) {
    const ledge = route[next];
    const x = ledge ? game.ledgeX(ledge, run.elapsed) + ledge.width / 2 : runePlatform.rune.x;
    const distance = x - run.x;
    game.advance(run, 1 / 120, Math.abs(distance) > 2 ? Math.sign(distance) : 0);
    if (ledge && run.y === ledge.y) next++;
  }
  assert.equal(next, route.length);
  assert.ok(run.surge > 0);
  assert.equal(run.over, false);
});

test('a drifting lily is solid where it currently appears', () => {
  const run = game.createRun(() => 0.5);
  const lily = run.ledges.find((ledge) => ledge.kind === 'lily');
  assert.ok(lily, 'the opening climb introduces a lily');
  run.elapsed = 0.75;
  const x = game.ledgeX(lily, run.elapsed);
  assert.ok(x > lily.x + 10);
  run.x = x + lily.width - 2;
  run.y = lily.y + 1;
  run.vy = -240;
  game.advance(run, 1 / 120, 0);
  assert.equal(run.y, lily.y);
  assert.ok(run.vy > 0);
});

test('a cracked ledge gives one bounce and then fails to catch the sword', () => {
  const run = game.createRun(() => 0.5);
  const ledge = run.ledges.find((candidate) => candidate.kind === 'cracked');
  assert.ok(ledge, 'the opening climb introduces a cracked ledge');
  run.x = ledge.x + ledge.width / 2;
  run.y = ledge.y + 1;
  run.vy = -240;
  game.advance(run, 1 / 120, 0);
  assert.equal(run.y, ledge.y);
  assert.ok(run.vy > 0);
  run.y = ledge.y + 1;
  run.vy = -240;
  game.advance(run, 1 / 120, 0);
  assert.ok(run.y < ledge.y && run.vy < 0);
});

test('wood shows damage after the first bounce, breaks after the second, and cannot catch a third', () => {
  const run = game.createRun(() => 0.5);
  for (let y = 300; y < 2100; y += 75) {
    run.y = y;
    game.advance(run, 1 / 120, 0);
  }
  const wood = run.ledges.find((ledge) => ledge.kind === 'wood');
  assert.ok(wood, 'wood appears during the climb');
  const land = () => {
    run.x = wood.x + wood.width / 2;
    run.y = wood.y + 1;
    run.vy = -240;
    game.advance(run, 1 / 120, 0);
  };
  land();
  assert.equal(run.y, wood.y);
  assert.equal(wood.wornAt, run.elapsed, 'first hit exposes its exact time for the impact cue');
  assert.equal(wood.shatteredAt, undefined);
  land();
  assert.equal(run.y, wood.y);
  assert.ok(run.vy > 0);
  assert.equal(wood.shatteredAt, run.elapsed);
  land();
  assert.ok(run.y < wood.y && run.vy < 0);
});

function generateLedges(seed, maxY) {
  let value = seed;
  const run = game.createRun(() => (value = (Math.imul(1664525, value) + 1013904223) >>> 0) / 2 ** 32);
  const route = run.ledges.map((ledge) => ({ ...ledge }));
  for (let y = 300; y <= maxY; y += 80) {
    run.y = y;
    game.advance(run, 1 / 120, 0);
    route.push(...run.ledges.filter((ledge) => ledge.y > route.at(-1).y).map((ledge) => ({ ...ledge })));
  }
  return route;
}

function assertJumpReachable(from, to) {
  const rise = to.y - from.y;
  const airtime = (490 + Math.sqrt(490 ** 2 - 2 * 1150 * rise)) / 1150;
  const centerDistance = Math.abs(to.x + to.width / 2 - from.x - from.width / 2);
  assert.ok(rise > 0 && rise <= 87.000001);
  assert.ok(centerDistance + (from.swing ?? 0) + (to.swing ?? 0) < 228 * airtime);
  return centerDistance;
}

test('one sequence of reachable ledges gets narrower and more varied with height', () => {
  for (let seed = 1; seed <= 12; seed++) {
    const route = generateLedges(seed, 17200);
    const early = route.filter((ledge) => ledge.y > 300 && ledge.y < 700);
    const mid = route.filter((ledge) => ledge.y > 7900 && ledge.y < 8500);
    const late = route.filter((ledge) => ledge.y > 15180);
    const average = (items, weight) => items.reduce((sum, item) => sum + weight(item), 0) / items.length;
    assert.ok(average(late, (ledge) => ledge.width) < average(early, (ledge) => ledge.width) - 10);
    assert.ok(mid.every((ledge) => ledge.width > 55 && ledge.width < 65));
    assert.ok(late.every((ledge) => ledge.width === 46));
    assert.ok(
      average(late, (ledge) => Number(ledge.kind !== 'stone')) >
        average(early, (ledge) => Number(ledge.kind !== 'stone')),
    );
    const runeY = route.filter((ledge) => ledge.rune).map((ledge) => ledge.rune.y);
    assert.ok(runeY.length >= 3);
    assert.ok(runeY.every((y, index) => index === 0 || y - runeY[index - 1] >= 750));
    let smallCorrections = 0;
    for (let index = 1; index < route.length; index++) {
      const from = route[index - 1];
      const to = route[index];
      assert.ok(to.y - from.y >= 61, 'each ledge is a full step above the previous one');
      const centerDistance = assertJumpReachable(from, to);
      if (from.y >= 1600) {
        smallCorrections = centerDistance < 35 ? smallCorrections + 1 : 0;
        assert.ok(smallCorrections <= 2, 'late sections require a deliberate steer at least every few jumps');
      }
    }
  }
});

test('late terrain trades standard stone and worn wood for lilies and one-bounce slabs', () => {
  const bands = [
    [3000, 5000],
    [8500, 10500],
    [15000, 17400],
  ];
  const mixes = bands.map(() => ({ stone: 0, lily: 0, cracked: 0, wood: 0, total: 0 }));
  for (let seed = 1; seed <= 24; seed++) {
    const ledges = generateLedges(seed, 17400);
    let stoneStreak = 0;
    for (const ledge of ledges) {
      const band = bands.findIndex(([min, max]) => ledge.y >= min && ledge.y < max);
      if (band >= 0) {
        mixes[band][ledge.kind]++;
        mixes[band].total++;
      }
      stoneStreak = ledge.kind === 'stone' ? stoneStreak + 1 : 0;
      if (ledge.y >= 15000) assert.ok(stoneStreak <= 2, 'endgame stone runs are capped at two ledges');
    }
  }
  const share = (index, kind) => mixes[index][kind] / mixes[index].total;
  for (const kind of ['lily', 'cracked']) {
    assert.ok(share(0, kind) < share(1, kind) && share(1, kind) < share(2, kind), kind);
  }
  assert.ok(share(0, 'stone') > share(1, 'stone') && share(2, 'stone') < 0.17);
  assert.ok(share(1, 'wood') > share(0, 'wood') && share(1, 'wood') > share(2, 'wood') + 0.06);
});

function reachMordredScore(run, score) {
  Object.assign(run, { x: 160, y: score * 10 - 1, vy: 240, madeProgress: true });
  game.advance(run, game.JUMP_STEP, 0);
  assert.equal(game.height(run), score);
}

test('the first Mordred encounter is scheduled 400 to 800 points after 1000', () => {
  for (const [random, firstScore] of [
    [0, 1400],
    [0.5, 1600],
    [0.999999, 1800],
  ]) {
    const run = game.createRun(() => random);
    reachMordredScore(run, firstScore - 1);
    assert.equal(game.mordredTime(run), 0);
    reachMordredScore(run, firstScore);
    assert.equal(game.mordredTime(run), 15);
  }
});

test('Mordred rolls a fresh interval from the score of each encounter', () => {
  let random = 0.5;
  const run = game.createRun(() => random);
  run.elapsed = 113.03333333333333;
  random = 0;
  reachMordredScore(run, 1607);
  assert.equal(game.mordredTime(run), 15);
  const first = run.elapsed;
  run.elapsed = first + 14.5;
  assert.ok(Math.abs(game.mordredTime(run) - 0.5) < 1e-8);
  run.elapsed = first + 15;
  reachMordredScore(run, 2006);
  assert.equal(game.mordredTime(run), 0);

  random = 0.999999;
  reachMordredScore(run, 2007);
  assert.equal(game.mordredTime(run), 15);
  const second = run.elapsed;
  reachMordredScore(run, 2807);
  assert.ok(game.mordredTime(run) < 15, 'reaching the next score cannot reset an active effect');
  run.elapsed = second + 15;
  reachMordredScore(run, 2808);
  assert.equal(game.mordredTime(run), 15);
});

test('Mordred narrows vision for three seconds, holds for nine and opens it for three', () => {
  assert.equal(game.mordredFocus(15), 0);
  assert.equal(game.mordredFocus(13.5), 0.5);
  assert.equal(game.mordredFocus(12), 1);
  assert.equal(game.mordredFocus(7.5), 1);
  assert.equal(game.mordredFocus(3), 1);
  assert.equal(game.mordredFocus(1.5), 0.5);
  assert.equal(game.mordredFocus(0), 0);
});

test('missing the ledges ends the run and freezes the last height', () => {
  assert.equal(typeof game.createRun, 'function');
  const run = game.createRun(() => 0.5);
  for (let frame = 0; frame < 480; frame++) game.advance(run, 1 / 120, -1);
  assert.equal(run.over, true);
  assert.equal(game.height(run), 0);
  const finish = { ...run };
  game.advance(run, 1 / 120, 1);
  assert.deepEqual(run, finish);
});
