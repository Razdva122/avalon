const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = fs.readFileSync(require.resolve('../src/components/view/board/animations/render.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const renderer = {};
new Function('require', 'exports', code)(require, renderer);

function scene(t, options, motions = []) {
  const originalDocument = global.document;
  let root;
  global.document = {
    createElement: () => {
      const node = (selector) => ({
        style: { left: '103px' },
        setAttribute() {},
        classList: { contains: (name) => selector.includes(name) },
        querySelector: (child) => node(`${selector} ${child}`),
        animate: (frames, timing) => {
          motions.push({ selector, frames, ...timing });
          return { cancel() {} };
        },
      });
      return {
        innerHTML: '',
        classList: { add() {} },
        setAttribute() {},
        remove() {},
        querySelector: node,
        querySelectorAll: () => [node('.avalon-cards-reverse'), node('.avalon-cards-front')],
      };
    },
  };
  t.after(() => {
    if (originalDocument === undefined) delete global.document;
    else global.document = originalDocument;
  });
  const cleanup = (
    options.excalibur
      ? renderer.renderExcalibur
      : options.mission
        ? renderer.renderMission
        : options.variant
          ? renderer.renderPairAssassination
          : renderer.renderAssassination
  )(
    {
      appendChild: (node) => {
        root = node;
      },
    },
    {
      roleImage: '/selected.webp',
      playerName: 'Алиса',
      survivorImage: '/survivor.webp',
      survivorName: 'Боб',
      hit: false,
      reducedMotion: true,
      hitLabel: 'Убит',
      missLabel: 'Промах',
      ...options,
    },
  );
  t.after(cleanup);
  return `<div class="${root.className}">${root.innerHTML}</div>`;
}

function labels(html, owner) {
  return [...html.matchAll(new RegExp(`<div\\b([^>]*data-card-owner="${owner}"[^>]*)>([^<]*)</div>`, 'g'))].map(
    (match) => ({ attributes: match[1], text: match[2] }),
  );
}

test('closed cards carry Avalon as their only back label', (t) => {
  const html = scene(t, { hit: true });
  const backs = [...html.matchAll(/<div class="avalon-cards-back">([\s\S]*?)<\/div><\/div>/g)];
  assert.ok(backs.length > 0, 'the selected card has a back');
  for (const [, back] of backs) {
    assert.equal(back.replace(/<[^>]*>/g, '').trim(), 'Avalon');
  }
});

test('a successful attack labels the selected player and does not add a survivor card', (t) => {
  const html = scene(t, { hit: true, playerName: 'Алиса' });
  const selected = labels(html, 'selected');
  assert.ok(selected.length > 0, 'the selected card identifies its owner');
  assert.ok(selected.every((label) => label.text === 'Алиса'));
  assert.equal(labels(html, 'survivor').length, 0);
  assert.equal(html.includes('/survivor.webp'), false);
});

test('a miss shows both player names and safely escapes nickname text and title attributes', (t) => {
  const html = scene(t, {
    playerName: '<img src=x onerror="boom">&\'',
    survivorName: "<svg onload='alert(1)'>\"&",
  });
  const selected = labels(html, 'selected');
  const survivor = labels(html, 'survivor');
  assert.ok(selected.length > 0, 'the torn card identifies the selected player');
  assert.equal(survivor.length, 1, 'the intact survivor card identifies its player');
  for (const label of selected) {
    assert.equal(label.text, '&lt;img src=x onerror=&quot;boom&quot;&gt;&amp;&#39;');
    assert.ok(label.attributes.includes('title="&lt;img src=x onerror=&quot;boom&quot;&gt;&amp;&#39;"'));
  }
  assert.equal(survivor[0].text, '&lt;svg onload=&#39;alert(1)&#39;&gt;&quot;&amp;');
  assert.ok(survivor[0].attributes.includes('title="&lt;svg onload=&#39;alert(1)&#39;&gt;&quot;&amp;"'));
  assert.ok(html.includes('/selected.webp'));
  assert.ok(html.includes('/survivor.webp'));
  assert.equal(html.includes('<img src=x'), false);
  assert.equal(html.includes('<svg onload='), false);
});

test('the card swaps surfaces only at its edge and never rotates back past its face', (t) => {
  const motions = [];
  scene(t, { hit: true, reducedMotion: false }, motions);
  const flip = motions.find((motion) => motion.selector === '.avalon-cards-turn');
  const widths = flip.frames.map((frame) => {
    const match = /^scaleX\(([\d.]+)\)$/.exec(frame.transform);
    assert.ok(match, 'the reveal must not rotate or expose nested 3D backfaces');
    return Number(match[1]);
  });
  assert.equal(widths[0], 1);
  assert.ok(widths[1] > 0 && widths[1] <= 0.05, 'surfaces swap while the card is edge-on');
  assert.equal(widths.at(-1), 1);
  assert.equal(flip.frames[1].offset, 0.5);
  assert.equal(flip.easing, 'linear', 'the surface switch must align with the geometric midpoint');
  const back = motions.find((motion) => motion.selector === '.avalon-cards-reverse');
  const front = motions.find((motion) => motion.selector === '.avalon-cards-front');
  assert.deepEqual(
    back.frames.map((frame) => frame.opacity),
    [1, 0],
  );
  assert.deepEqual(
    front.frames.map((frame) => frame.opacity),
    [0, 1],
  );
  assert.equal(back.delay, flip.delay + flip.duration / 2);
  assert.equal(front.delay, back.delay);
  assert.equal(back.duration, 1);
  assert.equal(front.duration, 1);
});

test('pair cards show escaped player names and static reduced-motion outcomes', (t) => {
  const cards = [
    { id: 'p1', roleImage: '/cleric.webp', playerName: 'Алексей <&>', hit: true },
    { id: 'p2', roleImage: '/servant.webp', playerName: 'Мария', hit: false },
  ];
  const html = scene(t, { variant: 'verdict', cards });
  assert.ok(labels(html, 'p1').length > 0);
  assert.ok(labels(html, 'p2').length > 0);
  assert.ok(labels(html, 'p1').every((label) => label.text === 'Алексей &lt;&amp;&gt;'));
  assert.ok(labels(html, 'p2').every((label) => label.text === 'Мария'));
  assert.ok(html.includes('Убит'));
  assert.ok(html.includes('Промах'));
  assert.ok(!html.includes('Покушение'));
  assert.ok(html.includes('avalon-pair-reduced'));
});

test('shared cut affects both Lovers cards only when the pair was guessed', (t) => {
  for (const hit of [true, false]) {
    const motions = [];
    scene(
      t,
      {
        variant: 'cut',
        reducedMotion: false,
        cards: [
          { id: 'p1', roleImage: '/tristan.webp', playerName: 'Алексей', hit },
          { id: 'p2', roleImage: '/isolde.webp', playerName: 'Мария', hit },
        ],
      },
      motions,
    );
    const cuts = motions.filter((motion) => motion.selector.endsWith('.avalon-pair-half-left'));
    assert.equal(cuts.length, hit ? 2 : 0);
    if (hit) assert.equal(cuts[0].delay, cuts[1].delay);
  }
});

test('mission cards stay anonymous, flip at their edge and cleanup cancels landing', (t) => {
  const motions = [];
  let landed = false;
  const html = scene(
    t,
    {
      mission: true,
      players: 2,
      fails: 1,
      result: 'fail',
      successImage: '/good.webp',
      failImage: '/evil.webp',
      successLabel: 'Success',
      failLabel: 'Fail',
      target: { x: 90, y: 242, size: 65 },
      reducedMotion: false,
      onReveal: () => {
        landed = true;
      },
    },
    motions,
  );
  assert.equal(html.includes('data-card-owner'), false);
  assert.equal(html.includes('Алиса'), false);
  assert.ok(html.includes('Success') && html.includes('Fail'));
  const flips = motions.filter((m) => m.selector.endsWith(' .turn'));
  assert.equal(flips.length, 2);
  assert.equal(flips[1].delay - flips[0].delay, 260);
  assert.equal(flips[0].frames[1].transform, 'scaleX(.04)');
  assert.equal(landed, false);
});

test('witch scene never creates decision faces or flip animations, including reduced motion', (t) => {
  for (const reducedMotion of [false, true]) {
    const motions = [];
    const html = scene(
      t,
      {
        mission: true,
        players: 3,
        hidden: true,
        witchImage: '/witch.webp',
        successImage: '/good.webp',
        failImage: '/evil.webp',
        successLabel: 'Success',
        failLabel: 'Fail',
        target: { x: 90, y: 242, size: 65 },
        reducedMotion,
        onReveal() {},
      },
      motions,
    );
    assert.ok(html.includes('/witch.webp'));
    assert.equal(html.includes('class="face"'), false);
    assert.equal(html.includes('/good.webp'), false);
    assert.equal(html.includes('/evil.webp'), false);
    assert.equal(
      motions.some((m) => m.selector.endsWith(' .turn')),
      false,
    );
    assert.equal(
      motions.some((m) => m.selector.endsWith(' .back')),
      false,
    );
  }
});

test('Excalibur arc uses public player positions; skip has no target flash or arc', (t) => {
  for (const target of [{ x: 120, y: 450, radius: 57.5 }, undefined]) {
    for (const reducedMotion of [false, true]) {
      const motions = [];
      const html = scene(
        t,
        { excalibur: true, source: { x: 300, y: 610, radius: 57.5 }, target, width: 600, height: 600, reducedMotion },
        motions,
      );
      assert.ok(html.includes('ex-owner-badge'));
      assert.equal(html.includes('class="ex-arc"'), Boolean(target));
      assert.equal(html.includes('class="ex-change"'), Boolean(target));
      assert.equal(html.includes('avalon-mission-card'), false);
      assert.equal(html.includes('/selected.webp'), false);
      if (!target)
        assert.equal(
          motions.some((m) => m.selector === '.ex-target-ring'),
          false,
        );
      if (reducedMotion) assert.equal(motions.length, 0);
    }
  }
});

test('mission emblem still lands on its token when the mobile fan is scaled and moved', (t) => {
  const motions = [];
  const layout = { left: 192, top: 302, scale: 0.6 };
  const target = { x: 232.5, y: 242.5, size: 65 };
  scene(
    t,
    {
      mission: true,
      players: 2,
      fails: 0,
      result: 'success',
      successImage: '/good.webp',
      failImage: '/evil.webp',
      successLabel: 'Success',
      failLabel: 'Fail',
      scene: layout,
      target,
      reducedMotion: false,
      onReveal() {},
    },
    motions,
  );
  const flight = motions.find(
    (m) => m.selector === '.avalon-mission-badge' && m.frames.at(-1).transform?.includes('translate('),
  );
  const match = flight.frames.at(-1).transform.match(/translate\(([-\d.]+)px,([-\d.]+)px\) scale\(([-\d.]+)\)/);
  assert.ok(match);
  assert.ok(Math.abs(layout.left + layout.scale * (180 + Number(match[1])) - target.x) < 0.001);
  assert.ok(Math.abs(layout.top + layout.scale * (90 + Number(match[2])) - target.y) < 0.001);
  assert.ok(Math.abs(layout.scale * 80 * Number(match[3]) - target.size) < 0.001);
});
