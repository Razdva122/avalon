const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { yaMetrika, gtag } = require('../const');
const { isNeutralPath } = require('../src/router/paths');

function scripts(html) {
  return [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
}
function browser(pathname) {
  const elements = [];
  const context = {
    location: { pathname, hash: '#secret-token' },
    history: {
      replaceState(_state, _title, url) {
        context.replacedURL = url;
        context.location.hash = '';
      },
    },
    document: {
      scripts: [],
      createElement: (tag) => ({ tag }),
      head: { appendChild: (element) => elements.push(element) },
      getElementsByTagName: () => [{ parentNode: { insertBefore: (element) => elements.push(element) } }],
    },
  };
  context.window = context;
  return { context: vm.createContext(context), elements };
}
test('recovery boot removes URL secrets before analytics and never loads trackers', () => {
  const { context, elements } = browser('/password-recovery/');
  const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  vm.runInContext(scripts(html)[0], context);
  assert.equal(context.__avalonRecoveryToken, 'secret-token');
  assert.equal(context.replacedURL, '/password-recovery/');
  for (const code of scripts(yaMetrika + gtag)) vm.runInContext(code, context);
  assert.equal(elements.filter((element) => element.tag === 'script').length, 0);
  assert.equal(elements.find((element) => element.name === 'referrer').content, 'no-referrer');
});
test('ordinary pages still load both analytics providers', () => {
  const { context, elements } = browser('/');
  for (const code of scripts(yaMetrika + gtag)) vm.runInContext(code, context);
  assert.equal(elements.filter((element) => element.tag === 'script').length, 2);
});
test('recovery route uses the visitor language instead of forcing English', () => {
  assert.equal(isNeutralPath('/password-recovery/'), true);
});
