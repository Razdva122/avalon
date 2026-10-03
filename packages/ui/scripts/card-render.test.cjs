const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = fs.readFileSync(require.resolve('../src/components/view/board/animations/render.ts'), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const renderer = {};
new Function('require', 'exports', code)(require, renderer);

function scene(t, options) {
  const originalDocument = global.document;
  let root;
  global.document = {
    createElement: () => ({ innerHTML: '', setAttribute() {}, remove() {} }),
  };
  t.after(() => {
    if (originalDocument === undefined) delete global.document;
    else global.document = originalDocument;
  });
  const cleanup = renderer.renderAssassination(
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
      ...options,
    },
  );
  t.after(cleanup);
  return root.innerHTML;
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
