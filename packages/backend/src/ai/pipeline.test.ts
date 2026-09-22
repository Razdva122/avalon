import { decisionPipeline, publicContext, safePublicSpeech } from './pipeline';
import { AiOutputLimit, AiPause } from './client';
import type { BotRequest } from './client';
import type { VisualGameState } from '@avalon/types';
const request: BotRequest = {
  playerID: 'evil',
  name: '7',
  style: 'brief',
  task: 'Vote',
  speak: true,
  state: {
    stage: 'votingForTeam',
    players: [{ id: 'evil', index: 7, role: 'mordred', features: {} }],
  } as VisualGameState,
  chat: [],
  choices: ['approve', 'reject'],
  privateCheck: 'evil',
};
test('speaker receives only public facts and a locked action, never private notes or role', async () => {
  const generate = jest
    .fn()
    .mockResolvedValueOnce({ choice: 1, speech: 'My evil allies need cover.' })
    .mockResolvedValueOnce({ choice: 0, speech: 'This team lacks evidence.' });
  const result = await decisionPipeline(generate)(request);
  expect(result).toEqual({ choice: 1, speech: 'This team lacks evidence.' });
  const [speechRequest, options] = generate.mock.calls[1];
  expect(speechRequest.choices).toEqual(['reject']);
  expect(JSON.stringify(options.context)).not.toMatch(/mordred|allies|privateKnowledge|previousDecisions/);
  expect(options.snapshot).toBe(true);
});
test('secret cards need one call and never publish the justification', async () => {
  const generate = jest.fn().mockResolvedValue({ choice: 0, speech: 'Sabotage now.' });
  expect(
    await decisionPipeline(generate)({ ...request, speak: false, state: { ...request.state, stage: 'onMission' } }),
  ).toEqual({ choice: 0, speech: '' });
  expect(generate).toHaveBeenCalledTimes(1);
});
test('private council stays private and failures pause without a fallback action', async () => {
  const generate = jest.fn().mockResolvedValue({ choice: 0, speech: '1 could be Merlin.' });
  await decisionPipeline(generate)({ ...request, privateDiscussion: true });
  expect(generate).toHaveBeenCalledTimes(1);
  const broken = jest
    .fn()
    .mockResolvedValueOnce({ choice: 0, speech: 'Private.' })
    .mockRejectedValueOnce(Error('HTTP'));
  await expect(decisionPipeline(broken)(request)).rejects.toThrow('Match paused');
});
test('decision notes remain isolated between players and bounded to four entries', async () => {
  const generate = jest.fn().mockResolvedValue({ choice: 0, speech: 'Private clue.' });
  const decide = decisionPipeline(generate);
  for (let i = 0; i < 6; i++) await decide({ ...request, speak: false });
  expect(generate.mock.calls[5][1].context.previousDecisions).toHaveLength(4);
  await decide({ ...request, playerID: 'other', speak: false });
  expect(generate.mock.calls[6][1].context.previousDecisions).toEqual([]);
});
test('public mission data strips own card and hidden individual cards', () => {
  const r = {
    ...request,
    state: {
      ...request.state,
      history: [
        { type: 'mission', index: 0, result: 'success', fails: 0, actions: [{ playerID: 'evil', value: 'success' }] },
      ],
    },
  } as BotRequest;
  expect(JSON.stringify(publicContext(r, 'approve'))).not.toMatch(/yourCard|cards|mordred/);
});

test('end review uses one call and cancellation prevents publication', async () => {
  const generate = jest.fn().mockResolvedValue({ choice: 0, speech: 'We lost.' });
  const end = await decisionPipeline(generate)({ ...request, state: { ...request.state, stage: 'end' } });
  expect(end.speech).toBe('We lost.');
  expect(generate).toHaveBeenCalledTimes(1);
  const controller = new AbortController();
  const abort = jest.fn().mockImplementation(async () => {
    controller.abort();
    return { choice: 0, speech: 'Private.' };
  });
  await expect(decisionPipeline(abort)(request, controller.signal)).rejects.toThrow();
  expect(abort).toHaveBeenCalledTimes(1);
});

test('public sabotage confessions are replaced but ordinary suspicions remain', () => {
  expect(
    safePublicSpeech('I approve because it aligns with my strategy to let the mission fail.', 'approve'),
  ).not.toContain('fail');
  expect(safePublicSpeech('I am Mordred.', 'reject')).not.toContain('Mordred');
  expect(safePublicSpeech('I suspect 2 is evil.', 'reject')).toBe('I suspect 2 is evil.');
});

test('retries a token-limited decision once with identical facts and a bounded non-reasoning retry', async () => {
  const generate = jest
    .fn()
    .mockRejectedValueOnce(new AiOutputLimit(4096))
    .mockResolvedValueOnce({ choice: 1, speech: 'Private reason.' })
    .mockResolvedValueOnce({ choice: 0, speech: 'I need stronger evidence.' });
  expect(await decisionPipeline(generate)(request)).toEqual({ choice: 1, speech: 'I need stronger evidence.' });
  expect(generate).toHaveBeenCalledTimes(3);
  expect(generate.mock.calls[1][1]).toEqual({
    ...generate.mock.calls[0][1],
    maxOutput: 1024,
    reasoning: 'none',
    phase: 'decision-retry',
  });
  expect(generate.mock.calls[1][0]).toEqual(generate.mock.calls[0][0]);
});

test('a second token limit pauses with an explicit reason instead of a third attempt', async () => {
  const generate = jest
    .fn()
    .mockRejectedValueOnce(new AiOutputLimit(4096))
    .mockRejectedValueOnce(new AiOutputLimit(8192));
  await expect(decisionPipeline(generate)(request)).rejects.toThrow('8192');
  expect(generate).toHaveBeenCalledTimes(2);
});

test('speech retry preserves the already chosen action and never repeats the decision', async () => {
  const generate = jest
    .fn()
    .mockResolvedValueOnce({ choice: 1, speech: 'Private.' })
    .mockRejectedValueOnce(new AiOutputLimit(256))
    .mockResolvedValueOnce({ choice: 0, speech: 'I need stronger evidence.' });
  expect((await decisionPipeline(generate)(request)).choice).toBe(1);
  expect(generate.mock.calls[2][0].choices).toEqual(['reject']);
  expect(generate.mock.calls[2][1].maxOutput).toBe(512);
});

test('budget errors and cancellation prevent additional requests', async () => {
  const blocked = jest.fn().mockRejectedValue(new AiPause('budget'));
  await expect(decisionPipeline(blocked)(request)).rejects.toThrow('budget');
  expect(blocked).toHaveBeenCalledTimes(1);
  const controller = new AbortController();
  const cancelled = jest.fn().mockImplementation(async () => {
    controller.abort();
    throw new AiOutputLimit(4096);
  });
  await expect(decisionPipeline(cancelled)(request, controller.signal)).rejects.toThrow();
  expect(cancelled).toHaveBeenCalledTimes(1);
});

test('evidence outlives four turns and public speech receives only the intended public reason', async () => {
  let turns = 0;
  const generate = jest.fn(async (_r, options) => {
    if (options.phase === 'speech') return { choice: 0, speech: 'Mission 2 exposed 2, 5 and 6.' };
    turns++;
    return {
      choice: 1,
      speech: 'Private reason.',
      publicReason: 'Mission 2 exposed 2, 5 and 6.',
      evidence:
        turns === 1
          ? [
              {
                key: 'm2',
                kind: 'deduction' as const,
                fact: '2, 5, 6 are Evil',
                source: 'Mission 2: three Fail cards among three members',
                certainty: 'proven' as const,
              },
            ]
          : [],
    };
  });
  const decide = decisionPipeline(generate);
  for (let i = 0; i < 6; i++) await decide(request);
  expect(generate.mock.calls[10][1].context.modelHypotheses).toHaveLength(1);
  expect(generate.mock.calls[1][1].context.publicReason).toBe('Mission 2 exposed 2, 5 and 6.');
  expect(JSON.stringify(generate.mock.calls[1][1].context)).not.toContain('Private reason.');
});

test('post-game review has no reasoning and receives factual results without chat or old notes', async () => {
  const generate = jest.fn().mockResolvedValue({ choice: 0, speech: 'We lost.' });
  await decisionPipeline(generate)({ ...request, state: { ...request.state, stage: 'end' } });
  expect(generate.mock.calls[0][1].reasoning).toBe('none');
  expect(generate.mock.calls[0][1].maxOutput).toBeLessThanOrEqual(400);
  expect(generate.mock.calls[0][1].context).not.toHaveProperty('previousDecisions');
});

test('forced Success and truthful Good Lady announcements do not call the model', async () => {
  const generate = jest.fn();
  const decide = decisionPipeline(generate);
  const good = {
    ...request,
    playerID: 'g',
    state: { ...request.state, players: [{ id: 'g', index: 7, role: 'servant', features: {} }] },
  } as BotRequest;
  expect(
    await decide({ ...good, speak: false, choices: ['success'], state: { ...good.state, stage: 'onMission' } }),
  ).toEqual({ choice: 0, speech: '' });
  expect(
    await decide({
      ...good,
      speak: false,
      choices: ['good', 'evil'],
      privateCheck: 'evil',
      state: { ...good.state, stage: 'announceLoyalty' },
    }),
  ).toEqual({ choice: 1, speech: '' });
  expect(generate).not.toHaveBeenCalled();
});

test('public speech does not expose avoiding a Good success', () => {
  for (const line of [
    'Rejecting prevents a risky success.',
    'I reject to avoid the risk of an unintended success.',
    'This risks a success.',
    'We preserve our two-failure advantage.',
  ]) {
    expect(safePublicSpeech(line, 'reject')).toBe('I need stronger evidence before supporting this team.');
  }
});

test('recycled model claims never become authority or stored action facts', async () => {
  const generate = jest.fn().mockResolvedValue({
    choice: 0,
    speech: '1 is proven Good because I cannot see Mordred.',
    evidence: [{ key: 'one', kind: 'deduction', fact: '1 is Good', source: 'model guess', certainty: 'proven' }],
  });
  const decide = decisionPipeline(generate);
  await decide({ ...request, speak: false });
  await decide({ ...request, speak: false });
  const context = generate.mock.calls[1][1].context;
  expect(context).not.toHaveProperty('evidence');
  expect(context.modelHypotheses).toEqual([expect.objectContaining({ certainty: 'claim' })]);
  expect(context.previousDecisions).toEqual([expect.objectContaining({ choice: 'approve' })]);
  expect(context.previousDecisions[0]).not.toHaveProperty('reason');
});

test('review distinguishes forced acceptance from an actual vote and names real actions', async () => {
  const generate = jest.fn().mockResolvedValue({ choice: 0, speech: 'We lost.' });
  const r = {
    ...request,
    state: {
      ...request.state,
      stage: 'end',
      history: [
        {
          type: 'vote',
          result: 'approve',
          forced: true,
          leaderID: 'evil',
          team: [{ id: 'evil' }],
          votes: [{ playerID: 'evil', value: 'approve' }],
        },
        {
          type: 'mission',
          index: 0,
          result: 'fail',
          fails: 1,
          leaderID: 'evil',
          actions: [{ playerID: 'evil', value: 'fail' }],
        },
      ],
    },
  } as BotRequest;
  await decisionPipeline(generate)(r);
  const c = generate.mock.calls[0][1].context;
  expect(c.yourActions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'proposal-1-1', type: 'proposal', team: [7] }),
      expect.objectContaining({ id: 'card-1', type: 'card', value: 'fail' }),
    ]),
  );
  expect(c.yourActions.some((a: { type: string }) => a.type === 'vote')).toBe(false);
  expect(c.automaticProposals).toHaveLength(1);
});
