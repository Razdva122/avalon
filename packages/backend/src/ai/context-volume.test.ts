import fixture from './fixtures/decisive-match.json';
import { compactRequest, parseDecisionReply } from './client';
import type { BotRequest } from './client';
import { decisionPipeline, decisionInstructions } from './pipeline';
import { buildCodexPrompt, codexSchema } from './codex';

const request = () =>
  structuredClone(fixture.cases.find((c) => c.id === 'm2-gambler-vote')!.request) as unknown as BotRequest;

test('Good receives its facts and risk comparison without private Evil strategy', () => {
  const good = request();
  expect(decisionInstructions(good)).not.toContain('Evil alliance secrecy:');
  expect(decisionInstructions(good)).toContain('Good team risk comparison:');
  const evil = structuredClone(good);
  evil.state.players.find((p) => p.id === evil.playerID)!.role = 'mordred';
  expect(decisionInstructions(evil)).toContain('Evil alliance secrecy:');
  expect(decisionInstructions(evil)).not.toContain('Good team risk comparison:');
  // Lady announcement rules arrive with the first Lady check.
  expect(decisionInstructions(good)).not.toContain('Lady rule for this AI table');
  good.state.stage = 'checkLoyalty';
  evil.state.stage = 'checkLoyalty';
  expect(decisionInstructions(good)).toContain('Lady inspection:');
  expect(decisionInstructions(good)).not.toContain('Evil Lady tradeoff:');
  expect(decisionInstructions(evil)).toContain('Evil Lady tradeoff:');
  expect(decisionInstructions(good)).toContain('Lady rule for this AI table');
});

test('a speaking decision includes one personality copy and no constant protocol fields', async () => {
  const input = { ...request(), speak: true, publicDiscussion: true };
  await decisionPipeline(async (r, options) => {
    const built = buildCodexPrompt(options.instructions, options.context, options.cacheInstructions);
    expect(built.prompt.split(r.style)).toHaveLength(2);
    expect(options.context).not.toHaveProperty('tableConventions');
    expect(options.context).not.toHaveProperty('requiredClaimStances');
    expect(options.instructions).toContain('personality');
    return { choice: 0, speech: 'Private.', publicReason: '' };
  })(input);
});

test('recent testimony keeps the end of accepted messages without a duplicate human block', () => {
  const input = request();
  const text = 'Начало. '.repeat(90) + 'Но окончательное решение — против команды.';
  input.chat = [{ name: '5', text }];
  const context = compactRequest(input);
  expect(context.chat).toEqual([{ by: '5', text }]);
  expect(context.humanStatements).toEqual([]);
  input.chat.push(...Array.from({ length: 14 }, () => ({ name: '1', text: 'Другая реплика.' })));
  const later = compactRequest(input);
  expect(later.humanStatements).toEqual([{ id: 1, by: 5, text }]);
});

test.each(['assassinate', 'end'] as const)('%s retains human testimony when recent chat is omitted', (stage) => {
  const input = request();
  input.state.stage = stage;
  input.chat = [{ name: '5', text: 'Важная поздняя реплика.' }];
  const context = compactRequest(input);
  expect(context.chat).toBeUndefined();
  expect(context.humanStatements).toEqual([{ id: 1, by: 5, text: 'Важная поздняя реплика.' }]);
});

test('decision schema and parser share the instructed limits without changing standalone and review ceilings', () => {
  const input = request();
  expect(codexSchema(input.choices, true).properties.speech.maxLength).toBe(240);
  expect(codexSchema(input.choices, true).properties.evidence!.maxItems).toBe(3);
  expect(codexSchema(input.choices, false).properties.speech.maxLength).toBe(500);
  expect(codexSchema(input.choices, false, true).properties.speech.maxLength).toBe(800);
  const reply = {
    choice: 'approve',
    speech: 'x'.repeat(241),
    publicReason: '',
    evidence: [],
    claimMorgana: null,
    claimStances: [],
  };
  expect(() => parseDecisionReply(JSON.stringify(reply), input.choices, input)).toThrow();
  reply.speech = 'A valid private reason.';
  const note = { key: 'one', kind: 'deduction', fact: 'A hypothesis.', source: 'Mission 1', certainty: 'claim' };
  const threeNotes = { ...reply, evidence: [note, { ...note, key: 'two' }, { ...note, key: 'three' }] };
  expect(parseDecisionReply(JSON.stringify(threeNotes), input.choices, input).evidence).toHaveLength(3);
  expect(() =>
    parseDecisionReply(
      JSON.stringify({ ...threeNotes, evidence: [...threeNotes.evidence, { ...note, key: 'four' }] }),
      input.choices,
      input,
    ),
  ).toThrow();
});

test('silent decisions omit impossible claim advice while public claim turns retain it', () => {
  const input = request();
  const context = compactRequest(input);
  expect(buildCodexPrompt('Common rules.', context).prompt).not.toContain('Use claimMorgana=null unless');
  const publicContext = compactRequest({ ...input, speak: true, publicDiscussion: true });
  expect(buildCodexPrompt('Common rules.', publicContext).prompt).toContain('Use claimMorgana=null unless');
});
