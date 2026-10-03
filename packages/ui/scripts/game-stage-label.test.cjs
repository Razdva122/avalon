const { test } = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
const { gameStageLabel } = require('../src/helpers/game-stage-label.ts');
test('decision and board stages share translated game labels', () => {
  assert.equal(gameStageLabel('selectTeam'), 'team building');
  assert.equal(gameStageLabel('votingForTeam'), 'voting');
  assert.equal(gameStageLabel('onMission'), 'mission');
  assert.equal(gameStageLabel('checkLoyalty'), 'check loyalty');
  assert.equal(gameStageLabel('unrecognized'), 'stage');
});

test('private-decision cards distinguish discussion preferences from chosen actions in every locale', async () => {
  const fs = require('node:fs');
  const ts = require('typescript');
  const vue = require('vue');
  const { parse, compileTemplate } = require('@vue/compiler-sfc');
  const { renderToString } = require('@vue/server-renderer');
  const filename = require.resolve('../src/components/view/board/modules/AiPrivateDecision.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'));
  const compiled = compileTemplate({
    source: descriptor.template.content,
    filename,
    id: 'decision-test',
    ssr: true,
    ssrCssVars: [],
    compilerOptions: { isCustomElement: () => true },
  });
  assert.deepEqual(compiled.errors, []);
  const exports = {};
  new Function(
    'require',
    'exports',
    ts.transpileModule(compiled.code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
  )(require, exports);
  for (const locale of ['en', 'ru', 'zh_TW', 'zh_CN', 'es', 'pt']) {
    const messages = require(`../src/i18n/langs/${locale}/aiArena.ts`).default;
    assert.ok(messages.teamDiscussion && messages.preferredTeam, `missing discussion labels in ${locale}`);
    for (const stage of ['discussion', 'selectTeam']) {
      const app = vue.createSSRApp({
        ssrRender: exports.ssrRender,
        setup: () => ({
          name: 'Bot',
          preview: true,
          avatar: undefined,
          decision: { seat: 1, mission: 1, stage, choice: '1, 2' },
          gameStageLabel,
        }),
      });
      app.config.globalProperties.$t = (key) => messages[key.replace('aiArena.', '')] || key;
      const html = await renderToString(app);
      assert.ok(html.includes(stage === 'discussion' ? messages.preferredTeam : messages.chosenAction));
      assert.ok(html.includes(stage === 'discussion' ? messages.teamDiscussion : 'game.team building'));
    }
  }
});
