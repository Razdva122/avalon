const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { ref, reactive, computed, watch, nextTick } = require('vue');

test('catalog polling preserves edited Codex choices and model changes constrain reasoning', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/view/panels/AiRoomPanel.vue'), 'utf8');
  const logic = source.slice(source.indexOf('const codexModel ='), source.indexOf('const emit ='));
  const js = ts.transpileModule(logic, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const props = reactive({ roomID: 'one', ai: { codex: { model: 'model-a', reasoning: 'low' } } });
  const catalog = ref([
    { id: 'model-a', efforts: ['low', 'high'] },
    { id: 'model-b', efforts: ['low', 'high'] },
  ]);
  const selection = new Function(
    'ref',
    'computed',
    'watch',
    'props',
    'codexModels',
    js + '\nreturn { codexModel, codexReasoning };',
  )(ref, computed, watch, props, catalog);
  selection.codexModel.value = 'model-b';
  selection.codexReasoning.value = 'high';
  await nextTick();
  catalog.value = catalog.value.map((m) => ({ ...m }));
  await nextTick();
  assert.equal(selection.codexModel.value, 'model-b');
  assert.equal(selection.codexReasoning.value, 'high');
  catalog.value = [
    { id: 'model-a', efforts: ['low'] },
    { id: 'model-b', efforts: ['low'] },
  ];
  await nextTick();
  assert.equal(selection.codexReasoning.value, 'low');
});

test('saved choices survive initial catalog loading and equivalent room updates', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/view/panels/AiRoomPanel.vue'), 'utf8');
  const logic = source.slice(source.indexOf('const codexModel ='), source.indexOf('const emit ='));
  const js = ts.transpileModule(logic, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const props = reactive({ roomID: 'one', ai: { codex: { model: 'model-b', reasoning: 'high' } } });
  const catalog = ref([]);
  const selection = new Function(
    'ref',
    'computed',
    'watch',
    'props',
    'codexModels',
    js + '\nreturn { codexModel, codexReasoning };',
  )(ref, computed, watch, props, catalog);
  catalog.value = [
    { id: 'model-a', efforts: ['low', 'high'] },
    { id: 'model-b', efforts: ['low', 'high'] },
  ];
  await nextTick();
  assert.equal(selection.codexModel.value, 'model-b');
  assert.equal(selection.codexReasoning.value, 'high');
  selection.codexModel.value = 'model-a';
  selection.codexReasoning.value = 'low';
  props.ai = { codex: { model: 'model-b', reasoning: 'high' } };
  await nextTick();
  assert.equal(selection.codexModel.value, 'model-a');
  assert.equal(selection.codexReasoning.value, 'low');
});
