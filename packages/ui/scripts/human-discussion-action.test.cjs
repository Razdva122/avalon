const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vue = require('vue');
const { parse, compileTemplate } = require('@vue/compiler-sfc');
const { renderToString } = require('@vue/server-renderer');

function load(filename, store) {
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'));
  const template = compileTemplate({ source: descriptor.template.content, filename, id: 'discussion-action' });
  assert.deepEqual(template.errors, []);
  const code = ts.transpileModule(descriptor.script.content + '\n' + template.code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', code)((id) => {
    if (id === '@/store') return { useStore: () => store };
    if (id === '@/api/socket') return { socket: { emit() {} } };
    if (id.endsWith('.vue')) {
      if (id.endsWith('PlayerIcon.vue') || id.endsWith('Spoiler.vue'))
        return { __esModule: true, default: { render: () => null } };
      return { __esModule: true, default: load(path.resolve(__dirname, '../src', id.slice(2)), store) };
    }
    if (id === '@/helpers/composables/useGamePlayerState') {
      const helper = {};
      const source = fs.readFileSync(
        path.resolve(__dirname, '../src/helpers/composables/useGamePlayerState.ts'),
        'utf8',
      );
      new Function(
        'require',
        'exports',
        ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText,
      )((name) => (name === '@/store' ? { useStore: () => store } : require(name)), helper);
      return helper;
    }
    return require(id);
  }, exports);
  exports.default.render = exports.render;
  return exports.default;
}

async function render(stage, pending = true, selected = true, viewer = 'human') {
  const component = load(require.resolve('../src/components/view/panels/InGamePanel.vue'), {
    state: { profile: { id: viewer } },
  });
  const app = vue.createSSRApp(component, {
    teamDiscussionPending: pending,
    game: {
      stage,
      mission: 0,
      uuid: 'game',
      settings: { missions: [{ players: 2 }] },
      addonsData: { assassin: { assassinateTargets: ['merlin'] } },
      players: [
        { id: 'human', features: { isLeader: true, isAssassin: true, isSelected: selected } },
        { id: 'friend', features: { isSelected: stage === 'selectTeam' && selected } },
      ],
    },
  });
  app.component('v-btn', {
    render() {
      return vue.h('button', this.$attrs, this.$slots.default?.());
    },
  });
  app.component('v-btn-toggle', {
    render() {
      return vue.h('div', this.$slots.default?.());
    },
  });
  app.config.globalProperties.$t = (key) => key;
  return renderToString(app);
}

for (const stage of ['selectTeam', 'assassinate']) {
  test(`${stage}: the human can confirm silently after the other speakers finish`, async () => {
    const html = await render(stage, false);
    assert.match(html, /<button\b/);
    assert.doesNotMatch(html, /<button[^>]*\bdisabled\b/);
  });

  test(`${stage}: another speaker and invalid selections still prevent confirmation`, async () => {
    assert.match(await render(stage, true), /<button[^>]*\bdisabled\b/);
    assert.match(await render(stage, false, false), /<button[^>]*\bdisabled\b/);
    assert.doesNotMatch(await render(stage, false, true, 'friend'), /<button\b/);
  });
}
