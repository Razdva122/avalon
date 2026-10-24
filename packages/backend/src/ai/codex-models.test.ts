import { callEffort, parseCodexModels, validateCodexSettings } from './codex-models';

test('catalog exposes selectable models and their supported efforts only', () => {
  expect(
    parseCodexModels({
      models: [
        {
          slug: 'gpt-test',
          display_name: 'Test',
          visibility: 'list',
          supported_reasoning_levels: [{ effort: 'low' }, { effort: 'high' }],
          model_messages: { secret: 'omit' },
        },
        { slug: 'hidden', visibility: 'hide', supported_reasoning_levels: [{ effort: 'low' }] },
      ],
    }),
  ).toEqual([{ id: 'gpt-test', label: 'Test', efforts: ['low', 'high'] }]);
});

test('settings reject unknown models and unsupported reasoning instead of silently changing the party', () => {
  const catalog = [{ id: 'gpt-test', label: 'Test', efforts: ['low', 'high'] }];
  expect(validateCodexSettings({ model: 'gpt-test', reasoning: 'high' }, catalog)).toEqual({
    model: 'gpt-test',
    reasoning: 'high',
  });
  expect(() => validateCodexSettings({ model: 'other', reasoning: 'low' }, catalog)).toThrow();
  expect(() => validateCodexSettings({ model: 'gpt-test', reasoning: 'ultra' }, catalog)).toThrow();
  expect(() => validateCodexSettings(null, catalog)).toThrow();
});

test('call effort: one level up for decisive calls and down for rewording, within low..high and the model', () => {
  const all = ['minimal', 'low', 'medium', 'high', 'xhigh'];
  expect(callEffort('medium', 'critical', all)).toBe('high');
  expect(callEffort('medium', 'light', all)).toBe('low');
  expect(callEffort('high', 'critical', all)).toBe('high');
  expect(callEffort('low', 'light', all)).toBe('low');
  expect(callEffort('xhigh', 'light', all)).toBe('high');
  expect(callEffort('medium', undefined, all)).toBe('medium');
  // Unknown catalog or an unsupported level keeps the table's level.
  expect(callEffort('medium', 'critical')).toBe('medium');
  expect(callEffort('medium', 'critical', ['low', 'medium'])).toBe('medium');
});
