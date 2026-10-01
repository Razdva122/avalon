const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
test('reading the game before the room archive arrives is safe', () => {
  const source = fs.readFileSync(require.resolve('../src/helpers/game-state-manager/index.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  const load = (id) => (id === 'vue' ? { ...vue, provide() {} } : id.startsWith('@/') ? {} : require(id));
  new Function('require', 'exports', code)(load, exports);
  const manager = new exports.GameStateManager();
  assert.equal(manager.game.value, undefined);
  manager.state.value = { stage: 'started', gameStates: [{ stage: 'end' }], pointer: 0 };
  assert.equal(manager.game.value.stage, 'end');
});
