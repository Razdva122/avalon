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
const started = {
  stage: 'started',
  game: {
    stage: 'selectTeam',
    players: [
      { id: 'me', role: 'merlin' },
      { id: 'other', role: 'evil' },
    ],
  },
};

test('role dealing starts only when a participant sees a live lobby become a game', () => {
  assert.equal(typeof helpers.shouldDealRoles, 'function');
  assert.equal(helpers.shouldDealRoles(started, 'locked', 'me', 'live'), true);
  assert.equal(helpers.shouldDealRoles(started, 'created', 'me', 'live'), true);
  assert.equal(helpers.shouldDealRoles(started, undefined, 'me', 'live'), false);
  assert.equal(helpers.shouldDealRoles(started, 'started', 'me', 'live'), false);
  assert.equal(helpers.shouldDealRoles(started, 'locked', 'me', 'history'), false);
  assert.equal(helpers.shouldDealRoles(started, 'locked', 'spectator', 'live'), false);
  assert.equal(helpers.shouldDealRoles(started, 'locked', undefined, 'live'), false);
  assert.equal(
    helpers.shouldDealRoles({ ...started, game: { ...started.game, stage: 'end' } }, 'locked', 'me', 'live'),
    false,
  );
  for (const role of ['unknown', 'good', 'evil']) {
    assert.equal(
      helpers.shouldDealRoles(
        { ...started, game: { ...started.game, players: [{ id: 'me', role }] } },
        'locked',
        'me',
        'live',
      ),
      false,
    );
  }
});
