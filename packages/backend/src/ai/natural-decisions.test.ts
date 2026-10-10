import { decisionPipeline } from './pipeline';
import { BotRoom } from './room';
import type { BotRequest, GenerationOptions } from './client';
import type { Server } from '@avalon/types';
import fixtures from './fixtures/postulates.json';

const request = fixtures.find((f) => f.name === 'postulate-morgana-3')!.request as unknown as BotRequest;

test('publishes the original public argument in one call even after a failed mission', async () => {
  const publicReason = '2, ты требуешь исключить меня, но сам менял версию. Объясни сначала этот переход.';
  const inputs: BotRequest[] = [];
  const decide = decisionPipeline(async (r) => {
    inputs.push(r);
    return { choice: 0, speech: 'Private sabotage opportunity.', publicReason };
  });
  const result = await decide(request);
  expect(inputs).toHaveLength(1);
  expect(inputs[0].choices).toEqual(request.choices);
  expect(result).toEqual({ choice: 0, speech: publicReason, privateReason: 'Private sabotage opportunity.' });
});

test('publishes council public arguments while keeping private review reasons separate', async () => {
  const privateReason = 'PRIVATE_COUNCIL_REASON: using hidden role knowledge.';
  const publicReason = 'Compare the early roster advice with the later failed team; another candidate may fit too.';
  const reviews: GenerationOptions['context'][] = [];
  const councilRequests: BotRequest[] = [];
  const decide = decisionPipeline(async (r, options) => {
    if (options.phase === 'review') {
      reviews.push(options.context);
      return { choice: 0, speech: 'I should have compared the earlier advice more carefully.' };
    }
    if (r.councilDiscussion) councilRequests.push(r);
    return {
      choice: r.state.stage === 'onMission' ? r.choices.indexOf('success') : 0,
      speech: r.councilDiscussion ? privateReason : 'Private decision.',
      publicReason: r.speak ? (r.councilDiscussion ? publicReason : 'Compare the mission results.') : '',
    };
  });
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const room = new BotRoom('council-public-reason', 'admin', io, decide, undefined, 0, 'en', 5);
  await room.run();

  expect(room.ai?.status).toBe('finished');
  const councilMessages = room.chat.history.filter((message) => message.message.startsWith('Evil council:'));
  expect(councilMessages).toHaveLength(2);
  for (const message of councilMessages) expect(message.message).toContain(publicReason);
  expect(JSON.stringify(room.chat.history)).not.toContain(privateReason);
  expect(JSON.stringify(councilRequests)).not.toContain(privateReason);
  expect(councilRequests[1].evilCouncil).toEqual([
    { seat: councilRequests[0].name, target: councilRequests[0].choices[0], reason: publicReason },
  ]);
  const councilExamples = reviews.flatMap((context) =>
    (
      context as { decisionExamples: { stage: string; reason: string; publicStatement: string }[] }
    ).decisionExamples.filter((example) => example.stage === 'assassinate'),
  );
  expect(councilExamples.filter((example) => example.publicStatement)).toEqual([
    expect.objectContaining({ reason: privateReason, publicStatement: publicReason }),
    expect.objectContaining({ reason: privateReason, publicStatement: publicReason }),
  ]);
});

test.each([undefined, ''])(
  'council never falls back to private speech when publicReason is %s',
  async (publicReason) => {
    const result = await decisionPipeline(async () => ({
      choice: 0,
      speech: 'PRIVATE_COUNCIL_REASON',
      publicReason,
    }))({
      ...request,
      councilDiscussion: true,
      choices: ['1', '2'],
      state: { ...request.state, stage: 'assassinate' },
    });
    expect(result).toEqual({ choice: 0, speech: '', privateReason: 'PRIVATE_COUNCIL_REASON' });
  },
);

test('model may choose not to repeat a stance on an old bot declaration', async () => {
  const r = { ...request, publicRoleClaims: [{ by: 2, target: 3, status: 'claim' as const }] };
  const result = await decisionPipeline(async () => ({
    choice: 0,
    speech: 'Earlier declaration adds nothing this turn.',
    publicReason: 'Сейчас важнее понять, почему 3 поддержал именно этот состав.',
    claimStances: [],
  }))(r);
  expect(result.speech).toBe('Сейчас важнее понять, почему 3 поддержал именно этот состав.');
});

test('intentional role claims use the model wording without a canned appendix', async () => {
  const r = { ...request, choices: ['1, 2'], state: { ...request.state, stage: 'selectTeam' } } as BotRequest;
  const result = await decisionPipeline(async () => ({
    choice: 0,
    speech: 'Deliberate Percival bluff.',
    publicReason: 'Я Персиваль. Второму не верьте: это Моргана, он пытается увести разговор.',
    claimMorgana: 2,
    claimStances: [],
  }))(r);
  expect(result.speech).toBe('Я Персиваль. Второму не верьте: это Моргана, он пытается увести разговор.');
});

test.each(['3 is Merlin.', '3 — Мерлин.', '3 是梅林。', 'My wizard pair is 2 and 3.', 'Мои союзники — 2 и 3.'])(
  'does not publish explicit private knowledge: %s',
  async (publicReason) => {
    await expect(
      decisionPipeline(async () => ({ choice: 0, speech: 'Private.', publicReason }))(request),
    ).rejects.toThrow('exposes private');
  },
);

test('whitespace silence does not record an unpublished declaration', async () => {
  const contexts: unknown[] = [];
  const decide = decisionPipeline(async (_r, options) => {
    contexts.push(options.context);
    return { choice: 0, speech: 'Private bluff.', publicReason: '   ', claimMorgana: 2 };
  });
  await decide(request);
  await decide(request);
  expect(contexts[1]).toMatchObject({ publicRoleClaims: [] });
});

test('silent turns tell the model that speech is disabled', async () => {
  let context: unknown;
  await decisionPipeline(async (_r, options) => {
    context = options.context;
    return { choice: 0, speech: 'Private.', publicReason: '' };
  })({ ...request, speak: false });
  expect(context).toMatchObject({ speak: false });
});

test.each([
  "I want a safer team so we don't fail.",
  'I want this mission to succeed, not fail.',
  'Нельзя раскрывать Мерлина.',
  'I suspect 2 is Evil.',
])('preserves ordinary public speech without a false pause: %s', async (publicReason) => {
  const result = await decisionPipeline(async () => ({ choice: 0, speech: 'Private.', publicReason }))(request);
  expect(result.speech).toBe(publicReason);
});

test.each(['Я хочу, чтобы поход не провалился.', 'Я хочу избежать провала.', '我想避免失敗。'])(
  'allows a player to argue for mission success: %s',
  async (publicReason) => {
    const result = await decisionPipeline(async () => ({ choice: 0, speech: 'Private.', publicReason }))(request);
    expect(result.speech).toBe(publicReason);
  },
);

test('a blocked disclosure is discarded and technical resume requests a fresh decision', async () => {
  let calls = 0;
  const decide = decisionPipeline(async () => ({
    choice: 0,
    speech: 'Private.',
    publicReason: ++calls === 1 ? 'I am Merlin.' : '2, explain your earlier vote.',
  }));
  await expect(decide(request)).rejects.toThrow('exposes private');
  expect((await decide(request)).speech).toBe('2, explain your earlier vote.');
  expect(calls).toBe(2);
});
