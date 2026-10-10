import { decisionPipeline, publicContext, safePublicSpeech } from './pipeline';
import { AiPause } from './client';
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

test('technical resume requests a fresh decision after an invalid choice', async () => {
  const generate = jest
    .fn()
    .mockResolvedValueOnce({ choice: 99, speech: 'Invalid choice.' })
    .mockResolvedValueOnce({ choice: 1, speech: 'Reject this team.' });
  const decide = decisionPipeline(generate);
  const input = { ...request, speak: false };
  await expect(decide(input)).rejects.toThrow('Invalid private decision.');
  await expect(decide(input)).resolves.toMatchObject({ choice: 1 });
  expect(generate).toHaveBeenCalledTimes(2);
});

test('voting analysis receives off-team votes and mission links without treating forced approval as support', async () => {
  const players = Array.from({ length: 7 }, (_, i) => ({
    id: String(i + 1),
    index: i + 1,
    role: i === 5 ? 'servant' : 'unknown',
    features: {},
  }));
  const proposal = (team: number[], approvals: number[], result: string, forced = false) => ({
    type: 'vote',
    leaderID: String(team[0]),
    team: team.map((id) => ({ id: String(id) })),
    result,
    forced,
    votes: players.map((p) => ({ playerID: p.id, value: approvals.includes(p.index) ? 'approve' : 'reject' })),
  });
  const generate = jest.fn().mockResolvedValue({ choice: 1, speech: 'Compare the repeated voting group.' });
  await decisionPipeline(generate)({
    ...request,
    playerID: '6',
    speak: false,
    state: {
      stage: 'votingForTeam',
      mission: 1,
      vote: 0,
      players,
      history: [
        proposal([1, 2], [1, 2, 4], 'reject'),
        proposal([2, 4], [1, 2, 4], 'reject'),
        proposal([3, 5], [3, 5], 'reject'),
        proposal([4, 5], [1, 2, 4, 5], 'approve'),
        {
          type: 'mission',
          index: 0,
          leaderID: '4',
          result: 'fail',
          fails: 1,
          actions: [{ playerID: '4' }, { playerID: '5' }],
        },
        proposal([1, 6, 7], [1, 2, 3, 4, 5, 6, 7], 'approve', true),
      ],
    } as unknown as VisualGameState,
  });
  const c = generate.mock.calls[0][1].context;
  expect(c.rejectedProposals.map((p: { mission: number; attempt: number }) => [p.mission, p.attempt])).toEqual([
    [1, 1],
    [1, 2],
    [1, 3],
  ]);
  expect(c.rejectedProposals[0].votes).toContainEqual([4, 'approve']);
  expect(c.rejectedProposals[2].votes).toContainEqual([4, 'reject']);
  expect(c.approvedProposals[0]).toMatchObject({ mission: 1, attempt: 4, team: [4, 5] });
  expect(c.completedMissions).toEqual([expect.objectContaining({ n: 1, team: [4, 5], fails: 1 })]);
  expect(c.approvedProposals[1]).toMatchObject({ mission: 2, forced: true, votes: 'automatic: no vote cast' });
  expect(c.privateKnowledge.rolesVisibleToYou).toEqual(players.map((p) => [p.index, p.role]));
  expect(generate.mock.calls[0][0].choices).toEqual(['approve', 'reject']);
});

test('secret cards need one call and never publish the justification', async () => {
  const generate = jest.fn().mockResolvedValue({ choice: 0, speech: 'Sabotage now.' });
  expect(
    await decisionPipeline(generate)({ ...request, speak: false, state: { ...request.state, stage: 'onMission' } }),
  ).toEqual({ choice: 0, speech: '', privateReason: 'Sabotage now.' });
  expect(generate).toHaveBeenCalledTimes(1);
});

test.each(['servant', 'mordred'])(
  'Lady counteraccusation keeps %s private alignment separate from public testimony',
  async (role) => {
    const generate = jest
      .fn()
      .mockResolvedValueOnce({
        choice: 1,
        speech: 'Private assessment.',
        publicReason: '2 is lying about me. I am Good.',
      })
      .mockResolvedValueOnce({ choice: 0, speech: '2 is lying about me. I am Good.' });
    const r = {
      ...request,
      state: {
        ...request.state,
        players: [
          { id: 'evil', index: 7, role, features: {} },
          { id: 'checker', index: 2, role: 'unknown', features: {} },
        ],
        history: [{ type: 'announceLoyalty', announcerID: 'checker', targetID: 'evil', announced: 'evil' }],
      },
    } as BotRequest;
    const reply = await decisionPipeline(generate)(r);
    const privateContext = generate.mock.calls[0][1].context;
    expect(privateContext.you.role).toBe(role);
    expect(privateContext.checks).toEqual([{ by: 2, target: 7, announced: 'evil', actual: undefined }]);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(reply.speech).toBe('2 is lying about me. I am Good.');
    expect(reply.choice).toBe(1);
  },
);

test('council speech uses the decision response and failures pause without a fallback action', async () => {
  const generate = jest.fn().mockResolvedValue({ choice: 0, speech: '1 could be Merlin.' });
  await decisionPipeline(generate)({ ...request, councilDiscussion: true });
  expect(generate).toHaveBeenCalledTimes(1);
  const broken = jest.fn().mockRejectedValueOnce(Error('HTTP'));
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

test('end review is generated once and cancellation prevents publication', async () => {
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
  expect(() =>
    safePublicSpeech('I approve because it aligns with my strategy to let the mission fail.', 'approve'),
  ).toThrow();
  expect(() => safePublicSpeech('I am Mordred.', 'reject')).toThrow();
  expect(() => safePublicSpeech('I am Oberon.', 'reject')).toThrow();
  expect(safePublicSpeech('I suspect 2 is evil.', 'reject')).toBe('I suspect 2 is evil.');
});

test('provider errors and cancellation prevent additional requests', async () => {
  const blocked = jest.fn().mockRejectedValue(new AiPause('provider unavailable'));
  await expect(decisionPipeline(blocked)(request)).rejects.toThrow('provider unavailable');
  expect(blocked).toHaveBeenCalledTimes(1);
  const controller = new AbortController();
  const cancelled = jest.fn().mockImplementation(async () => {
    controller.abort();
    throw new AiPause('cancelled');
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
  expect(generate.mock.calls[5][1].context.modelHypotheses).toHaveLength(1);
  expect((await decide(request)).speech).toBe('Mission 2 exposed 2, 5 and 6.');
});

test('post-game review excludes live decision memory', async () => {
  const generate = jest.fn().mockResolvedValue({ choice: 0, speech: 'We lost.' });
  await decisionPipeline(generate)({ ...request, state: { ...request.state, stage: 'end' } });
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
  for (const line of ['Rejecting prevents a risky success.', 'I reject to avoid the risk of an unintended success.']) {
    expect(() => safePublicSpeech(line, 'reject')).toThrow();
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

test('review receives bounded own decision explanations and knowledge, never another bot notes', async () => {
  const generate = jest
    .fn()
    .mockResolvedValue({ choice: 1, speech: 'I trusted the checker.', publicReason: 'My public claim.' });
  const decide = decisionPipeline(generate);
  for (let i = 0; i < 9; i++) await decide({ ...request, speak: false, task: `Decision ${i}` });
  await decide({ ...request, playerID: 'other', speak: false });
  await decide({ ...request, state: { ...request.state, stage: 'end' } });
  const review = generate.mock.calls[generate.mock.calls.length - 1][1].context;
  expect(review.decisionExamples).toHaveLength(6);
  expect(review.decisionExamples[0]).toMatchObject({
    id: 'decision-1',
    choice: 'reject',
    reason: 'I trusted the checker.',
    knowledge: expect.any(Object),
  });
  expect(review.decisionExamples.at(-1).id).toBe('decision-9');
  expect(
    review.decisionExamples.every(
      (d: { knowledge: { rolesVisibleToYou: unknown[] } }) => d.knowledge.rolesVisibleToYou.length === 1,
    ),
  ).toBe(true);
  const earlierContext = generate.mock.calls[1][1].context;
  expect(earlierContext.decisionExamples).toBeUndefined();
});

test('review retains enforced historical choices, mandatory claim speech and the complete public statement', async () => {
  const publicArgument = 'A'.repeat(240);
  const generate = jest
    .fn()
    .mockResolvedValueOnce({
      choice: 0,
      speech: 'My actual role remains Mordred.',
      publicReason: publicArgument,
      claimStances: [{ seat: 4, stance: 'distrust' }],
    })
    .mockResolvedValueOnce({ choice: 1, speech: 'My silent vote.' })
    .mockResolvedValueOnce({ choice: 0, speech: 'My reflection.' });
  const r = {
    ...request,
    playerID: '1',
    publicDiscussion: true,
    choices: ['2, 3', '1, 2', '1, 3', '1, 4', '1, 5'],
    publicRoleClaims: [{ by: 4, target: 5, status: 'claim' }],
    chat: [{ name: '4', text: 'I am Percival. 5 is Morgana.' }],
    state: {
      stage: 'selectTeam',
      mission: 1,
      vote: 0,
      players: [1, 2, 3, 4, 5].map((index) => ({
        id: String(index),
        index,
        role: index === 1 ? 'mordred' : 'unknown',
        features: { isLeader: index === 1, isSent: index === 1 || index === 3 },
      })),
      history: [
        {
          type: 'mission',
          index: 0,
          result: 'fail',
          fails: 1,
          actions: [
            { playerID: '1', value: 'fail' },
            { playerID: '2', value: 'success' },
          ],
        },
      ],
    },
  } as unknown as BotRequest;
  const decide = decisionPipeline(generate);
  await decide(r);
  await decide({
    ...r,
    publicDiscussion: false,
    speak: false,
    choices: ['approve', 'reject'],
    state: { ...r.state, stage: 'votingForTeam' },
  });
  await decide({ ...r, choices: ['Write your conclusion'], state: { ...r.state, stage: 'end' } });
  const examples = generate.mock.calls[2][1].context.decisionExamples;
  expect(examples[0]).toMatchObject({
    legalChoices: ['2, 3', '1, 2', '1, 3', '1, 4', '1, 5'],
    reason: 'My actual role remains Mordred.',
    publicStatement: publicArgument,
    speechRules: {
      public: true,
      optionalAnnouncement: false,
      claimTargets: [2, 3, 4, 5],
      requiredClaimStances: [],
      mandatoryText: '',
    },
  });
  expect(examples[1]).toMatchObject({
    legalChoices: ['approve', 'reject'],
    publicStatement: '',
    speechRules: {
      public: false,
      optionalAnnouncement: false,
      claimTargets: [],
      requiredClaimStances: [],
      mandatoryText: '',
    },
  });
});

test('review records when a leader could submit a team silently', async () => {
  const generate = jest.fn().mockResolvedValue({ choice: 0, speech: 'Private reason.', publicReason: '' });
  const decide = decisionPipeline(generate);
  const r = {
    ...request,
    optionalSpeech: true,
    choices: ['7'],
    state: { ...request.state, stage: 'selectTeam' },
  } as BotRequest;
  await decide(r);
  await decide({ ...r, choices: ['Write your conclusion'], state: { ...r.state, stage: 'end' } });
  expect(generate.mock.calls[1][1].context.decisionExamples[0]).toMatchObject({
    legalChoices: ['7'],
    publicStatement: '',
    speechRules: {
      public: true,
      optionalAnnouncement: true,
      claimTargets: [],
      requiredClaimStances: [],
      mandatoryText: '',
    },
  });
});

test('review can resume after a provider pause without a separate draft checker', async () => {
  const { AiPause } = await import('./client');
  const generate = jest
    .fn()
    .mockRejectedValueOnce(new AiPause('Interrupted decision'))
    .mockResolvedValueOnce({ choice: 0, speech: 'Corrected factual review.' });
  const decide = decisionPipeline(generate);
  const r = {
    ...request,
    choices: ['Write your conclusion'],
    state: {
      ...request.state,
      stage: 'end',
      history: [
        {
          type: 'mission',
          index: 4,
          settings: { players: 4, failsRequired: 1 },
          result: 'fail',
          fails: 1,
          actions: [],
        },
      ],
    },
  } as unknown as BotRequest;
  await expect(decide(r)).rejects.toBeInstanceOf(AiPause);
  expect((await decide(r)).speech).toBe('Corrected factual review.');
  expect(generate.mock.calls.map(([, options]) => options.phase)).toEqual(['review', 'review']);
  expect(generate.mock.calls[1][1].context.missions[0]).toMatchObject({ n: 5, failsRequired: 1, fails: 1 });
  expect(generate.mock.calls[1][1].context.draft).toBeUndefined();
});

test('returns the short private explanation separately from public speech', async () => {
  const generate = jest
    .fn()
    .mockResolvedValueOnce({
      choice: 1,
      speech: 'PRIVATE: I know the evil team.',
      publicReason: 'This team is risky.',
    })
    .mockResolvedValueOnce({ choice: 0, speech: 'This team is risky.' });
  const result = await decisionPipeline(generate)(request);
  expect(result).toMatchObject({ choice: 1, privateReason: 'PRIVATE: I know the evil team.' });
  expect(result.speech).not.toContain('PRIVATE');
});

test('intentional claim survives public hygiene and other bots choose their public response', async () => {
  const r = {
    ...request,
    state: {
      ...request.state,
      players: [
        ...request.state.players,
        { id: 'a', index: 1, role: 'unknown', features: {} },
        { id: 'b', index: 2, role: 'unknown', features: {} },
      ],
    },
    publicRoleClaims: [{ by: 1, target: 2, status: 'claim' }],
    chat: [{ name: '1', text: 'I am Percival. 2 is Morgana.' }],
  } as BotRequest;
  const generate = jest
    .fn()
    .mockResolvedValueOnce({
      choice: 0,
      speech: 'Counterclaim for cover.',
      publicReason: 'The voting record contradicts 1.',
      claimMorgana: 1,
      claimStances: [{ seat: 1, stance: 'distrust' }],
    })
    .mockResolvedValueOnce({ choice: 0, speech: 'The voting record contradicts 1.' });
  const result = await decisionPipeline(generate)(r);
  expect(result.speech).toBe('The voting record contradicts 1.');
  expect(generate.mock.calls[0][1].context.requiredClaimStances).toEqual([]);
  expect(result.speech).not.toContain('mordred');
  const invalid = jest.fn().mockResolvedValue({ choice: 0, speech: 'Skip the claim.' });
  expect((await decisionPipeline(invalid)(r)).speech).toBe('');
  expect(invalid).toHaveBeenCalledTimes(1);
});

test('an explicit selected-roster contradiction gets one repair before publication', async () => {
  const r = {
    ...request,
    speak: false,
    choices: ['1, 4, 5', '1, 4, 7'],
    state: { ...request.state, stage: 'selectTeam', players: [{ ...request.state.players[0], index: 1 }] },
  } as BotRequest;
  const generate = jest
    .fn()
    .mockResolvedValueOnce({ choice: 1, speech: 'Choosing [1,4,5] over [1,4,7] for trust.' })
    .mockResolvedValueOnce({ choice: 0, speech: 'Choosing [1,4,5] for trust.' });
  expect((await decisionPipeline(generate)(r)).choice).toBe(0);
  expect(generate.mock.calls[1][1].phase).toBe('decision-repair');
  const invalid = jest.fn().mockResolvedValue({ choice: 1, speech: 'Choosing [1,4,5] for trust.' });
  await expect(decisionPipeline(invalid)(r)).rejects.toThrow('roster');
  expect(invalid).toHaveBeenCalledTimes(2);
});
