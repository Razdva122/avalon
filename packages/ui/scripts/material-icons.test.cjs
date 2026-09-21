const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ui = path.resolve(__dirname, '..');
const { requiredNames, sourceTokens } = require('./material-icon-names.cjs');
const css = fs.readFileSync(path.join(ui, 'src/styles/material-icons.css'), 'utf8');
const included = new Set([...css.matchAll(/\.material-icons\.(\w+)::before/g)].map((match) => match[1]));

test('subset covers source literals, dynamic names, classes, and Vuetify aliases', () => {
  for (const name of requiredNames())
    assert.ok(included.has(name), `Missing ${name}; regenerate with subset-material-icons.py`);
});

test('comments do not add icons while strings and template icons survive', () => {
  const script = `// download\nconst icon = 'close'; /* thumb_up */ const url = 'https://example.com/check';`;
  const tokens = sourceTokens(script, '.ts');
  assert.ok(!tokens.includes('download'));
  assert.ok(!tokens.includes('thumb_up'));
  assert.ok(tokens.includes('close'));
  assert.ok(tokens.includes('check'));
  const vue = sourceTokens(
    `<template><!-- download --><span class="material-icons">home</span></template><script>${script}</script>`,
    '.vue',
  );
  assert.ok(!vue.includes('download'));
  assert.ok(!vue.includes('thumb_up'));
  assert.ok(vue.includes('home'));
  assert.ok(vue.includes('close'));
});

test('checked-in font stays small and icon boxes reserve space before font loading', () => {
  const font = fs.readFileSync(path.join(ui, 'src/assets/fonts/material-icons.woff2'));
  assert.equal(font.toString('ascii', 0, 4), 'wOF2');
  assert.ok(font.length < 25000, `Unexpected icon payload: ${font.length}`);
  assert.match(css, /width: 1em;/);
  assert.match(css, /height: 1em;/);
  for (const name of ['check', 'close', 'question_mark', 'swap_horiz', 'arrow_forward']) assert.ok(included.has(name));
});
