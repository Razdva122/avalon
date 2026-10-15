const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ui = path.resolve(__dirname, '..');
require('ts-node').register({
  project: path.join(ui, 'tsconfig.json'),
  transpileOnly: true,
  compilerOptions: { module: 'CommonJS' },
});
require('tsconfig-paths').register({ baseUrl: ui, paths: { '@/*': ['src/*'] } });

function entries(value, prefix = '') {
  return Object.entries(value).flatMap(([key, message]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    return message && typeof message === 'object' ? entries(message, name) : [[name, message]];
  });
}

test('Vietnamese supplies every interface and wiki message with working interpolation and markup', () => {
  const { en } = require('../src/i18n/langs/en');
  const { vi } = require('../src/i18n/langs/vi');
  const english = Object.fromEntries(entries(en));
  const vietnamese = Object.fromEntries(entries(vi));
  assert.deepEqual(Object.keys(vietnamese).sort(), Object.keys(english).sort());
  for (const [key, message] of Object.entries(vietnamese)) {
    assert.equal(typeof message, 'string', `${key}: missing Vietnamese text`);
    assert.ok(message.trim(), `${key}: empty Vietnamese text`);
    const placeholders = (text) => [...text.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1].trim()).sort();
    assert.deepEqual(placeholders(message), placeholders(english[key]), `${key}: interpolation changed`);
    const tags = (text) => [...text.matchAll(/<\/?[a-z][^>]*>/gi)].map(([tag]) => tag).sort();
    assert.deepEqual(tags(message), tags(english[key]), `${key}: message markup changed`);
    const links = (text) => text.match(/@:(?:[\w.-]+|\{'[^']+'\})/g) || [];
    assert.deepEqual(links(message).sort(), links(english[key]).sort(), `${key}: linked message changed`);
  }
});
