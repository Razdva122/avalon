import { AiOutputLimit, AiTechnicalPause, compactRequest } from './client';
import { claimContext } from './claims';
import { decisionPipeline, focusedRetry, publicContext } from './pipeline';
import { BotRoom } from './room';
import type { BotRequest } from './client';
import type { AiLanguage, Server } from '@avalon/types';

const discussion = {
  playerID: '1',
  name: '1',
  style: 'Diplomatic, prefers concrete compromises.',
  task: 'Discuss your preferred team before the leader chooses.',
  speak: true,
  publicDiscussion: true,
  choices: ['1, 3, 4', '1, 3, 5'],
  chat: [{ name: '2', text: '1, why did you approve the last team?' }],
  state: {
    stage: 'selectTeam',
    mission: 1,
    vote: 0,
    players: Array.from({ length: 7 }, (_, i) => ({
      id: String(i + 1),
      index: i + 1,
      role: i === 0 ? 'mordred' : 'unknown',
      features: { isLeader: i === 1 },
    })),
    settings: {
      missions: [
        { players: 2, failsRequired: 1 },
        { players: 3, failsRequired: 1 },
      ],
    },
    history: [
      {
        type: 'vote',
        leaderID: '2',
        team: [{ id: '2' }, { id: '4' }],
        result: 'approve',
        forced: false,
        votes: [
          { playerID: '1', value: 'approve' },
          { playerID: '2', value: 'reject' },
        ],
      },
      {
        type: 'mission',
        index: 0,
        leaderID: '2',
        result: 'fail',
        fails: 1,
        actions: [
          { playerID: '2', value: 'fail' },
          { playerID: '4', value: 'success' },
        ],
      },
    ],
  },
} as unknown as BotRequest;

test.each<AiLanguage>(['en', 'ru', 'zh-tw'])(
  '%s public circle describes a preference and receives recorded votes without private knowledge',
  async (language) => {
    const input = { ...discussion, language };
    const generate = jest
      .fn()
      .mockResolvedValueOnce({
        choice: 1,
        speech: 'PRIVATE ALLY KNOWLEDGE',
        publicReason: 'I prefer 1, 3, 5. 2, why did you reject?',
      })
      .mockResolvedValueOnce({ choice: 0, speech: 'I prefer 1, 3, 5. 2, why did you reject?' });
    const result = await decisionPipeline(generate)(input);
    expect(result.choice).toBe(1);
    expect(compactRequest(input)).toMatchObject({ publicDiscussion: true, proposedTeam: [] });
    expect(generate.mock.calls[0][1].instructions).toContain('preference');
    const options = generate.mock.calls[1][1];
    expect(options.context).toMatchObject({ actionType: 'discuss', choice: '1, 3, 5', language, proposedTeam: [] });
    expect(options.context.votes).toContainEqual(
      expect.objectContaining({
        mission: 1,
        yourVote: 'approve',
        votes: [
          [1, 'approve'],
          [2, 'reject'],
        ],
      }),
    );
    expect(options.context.missions).toContainEqual(expect.objectContaining({ n: 1, fails: 1, team: [2, 4] }));
    expect(options.context.chat).toEqual([{ by: '2', text: discussion.chat[0].text }]);
    expect(JSON.stringify(options.context)).not.toMatch(
      /mordred|PRIVATE ALLY|privateKnowledge|yourCard|roleAdvice|modelHypotheses/,
    );
    expect(options.instructions).toContain('not a submitted team');
    expect(focusedRetry(generate.mock.calls[0][1]).instructions).toContain('preference');
    expect(focusedRetry(generate.mock.calls[0][1]).context).toMatchObject({ chat: options.context.chat });
  },
);

test('a bounded retry of the final selection preserves the full public circle and optional silence', async () => {
  const input = {
    ...discussion,
    publicDiscussion: false,
    optionalSpeech: true,
    chat: Array.from({ length: 7 }, (_, i) => ({ name: String(i + 1), text: `I prefer a team including ${i + 1}.` })),
  };
  const generate = jest
    .fn()
    .mockRejectedValueOnce(new AiOutputLimit(20000))
    .mockResolvedValueOnce({ choice: 1, speech: 'The circle supports this compromise.', publicReason: '' });
  expect(await decisionPipeline(generate)(input)).toMatchObject({ choice: 1, speech: '' });
  expect(generate).toHaveBeenCalledTimes(2);
  expect(generate.mock.calls[1][1].context.chat).toEqual(generate.mock.calls[0][1].context.chat);
  expect(generate.mock.calls[1][1].context.chat).toHaveLength(7);
});

test('leader can submit silently after a public role claim without mandatory extra speech', async () => {
  const input = {
    ...discussion,
    publicDiscussion: false,
    optionalSpeech: true,
    task: 'Choose the final team after reading the complete discussion.',
    chat: [{ name: '2', text: 'I am Percival. 4 is Morgana.' }],
  } as BotRequest;
  const generate = jest.fn().mockResolvedValue({ choice: 1, speech: 'Private choice.', publicReason: '' });
  expect(claimContext(input)).toMatchObject({ targets: [], claimants: [] });
  expect(await decisionPipeline(generate)(input)).toEqual({ choice: 1, speech: '', privateReason: 'Private choice.' });
  expect(generate).toHaveBeenCalledTimes(1);
  expect(generate.mock.calls[0][1].context).toMatchObject({ optionalSpeech: true });
});

test('an optional leader announcement uses the final selected roster and all circle messages', async () => {
  const input = { ...discussion, publicDiscussion: false, optionalSpeech: true } as BotRequest;
  const generate = jest
    .fn()
    .mockResolvedValueOnce({ choice: 1, speech: 'Private choice.', publicReason: 'A compromise with 3 and 5.' })
    .mockResolvedValueOnce({ choice: 0, speech: 'A compromise with 3 and 5.' });
  expect(await decisionPipeline(generate)(input)).toMatchObject({ choice: 1, speech: 'A compromise with 3 and 5.' });
  expect(generate.mock.calls[1][1].context).toMatchObject({
    actionType: 'propose',
    choice: '1, 3, 5',
    chat: [{ by: '2', text: discussion.chat[0].text }],
  });
});

test.each<AiLanguage>(['en', 'ru', 'zh-tw'])(
  'silent %s vote stays empty even when a failed-mission convention requires rejection',
  async (language) => {
    const input = {
      ...discussion,
      language,
      publicDiscussion: false,
      speak: false,
      choices: ['approve', 'reject'],
      state: {
        ...discussion.state,
        stage: 'votingForTeam',
        players: discussion.state.players.map((p) => ({ ...p, features: { ...p.features, isSent: p.index <= 2 } })),
        history: [
          {
            type: 'mission',
            index: 0,
            leaderID: '1',
            result: 'fail',
            fails: 1,
            actions: [
              { playerID: '1', value: 'success' },
              { playerID: '2', value: 'fail' },
            ],
          },
        ],
      },
      chat: [{ name: '3', text: 'I am Percival. 4 is Morgana.' }],
    } as unknown as BotRequest;
    const generate = jest
      .fn()
      .mockResolvedValue({ choice: 0, speech: 'Reject the prior teammate.', publicReason: '2 is Evil.' });
    expect(await decisionPipeline(generate)(input)).toEqual({
      choice: 1,
      speech: '',
      privateReason: 'Reject the prior teammate.',
    });
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate.mock.calls[0][1].context).toMatchObject({ claimTargets: [], requiredClaimStances: [] });
  },
);

test('private memory and final review distinguish public preferences from submitted proposals', async () => {
  const generate = jest
    .fn()
    .mockResolvedValue({ choice: 0, speech: 'A concrete preference.', publicReason: 'I prefer this roster.' });
  const decide = decisionPipeline(generate);
  await decide(discussion);
  await decide({ ...discussion, publicDiscussion: false, optionalSpeech: true } as BotRequest);
  expect(generate.mock.calls[2][1].context.previousDecisions).toContainEqual(
    expect.objectContaining({ publicDiscussion: true, choice: '1, 3, 4' }),
  );
  await decide({ ...discussion, state: { ...discussion.state, stage: 'end' } });
  expect(generate.mock.calls[4][1].context.decisionExamples).toEqual([
    expect.objectContaining({ publicDiscussion: true, choice: '1, 3, 4' }),
    expect.objectContaining({ publicDiscussion: false, choice: '1, 3, 4' }),
  ]);
  expect(publicContext(discussion, '1, 3, 4').actionType).toBe('discuss');
});

test('real room and decision pipeline complete a circle, silent final choice and independent votes together', async () => {
  const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;
  const generate = jest.fn().mockImplementation(async (request, options) => {
    if (options.phase === 'speech') return { choice: 0, speech: options.context.publicReason };
    if (request.publicDiscussion)
      return { choice: 0, speech: 'Private preference.', publicReason: `I prefer ${request.choices[0]}.` };
    if (request.optionalSpeech)
      return { choice: request.choices.length - 1, speech: 'Choose after the full circle.', publicReason: '' };
    if (request.state.stage === 'votingForTeam')
      return { choice: 0, speech: 'An acceptable opening team.', publicReason: '' };
    throw new Error('Unexpected generation after the first proposal.');
  });
  let paused = false;
  const room = new BotRoom('pipeline-discussion', 'admin', io, decisionPipeline(generate), async () => {
    if (!paused && room.data.stage === 'started' && room.data.manager.game.stage === 'onMission') {
      paused = true;
      throw new AiTechnicalPause('Pause after the first complete proposal.');
    }
  });
  await room.run();
  expect(room.ai?.status).toBe('paused');
  const decisions = generate.mock.calls.filter(([, options]) => options.phase === 'decision');
  expect(decisions).toHaveLength(15);
  expect(decisions.slice(0, 7).every(([request]) => request.publicDiscussion)).toBe(true);
  const [finalRequest, finalOptions] = decisions[7];
  expect(finalRequest.optionalSpeech).toBe(true);
  expect(finalOptions.context.chat).toHaveLength(7);
  const finalTeam = finalRequest.choices.at(-1).split(', ').map(Number);
  const votes = decisions.slice(8);
  expect(votes).toHaveLength(7);
  for (const [request, options] of votes) {
    expect(request.speak).toBe(false);
    expect(options.context.proposedTeam).toEqual(finalTeam);
    expect(
      request.state.players.every((player: { features: { waitForAction: boolean } }) => player.features.waitForAction),
    ).toBe(true);
  }
  expect(generate.mock.calls.filter(([, options]) => options.phase === 'speech')).toHaveLength(7);
  expect(room.chat.history.filter((message) => room.players.includes(message.userID))).toHaveLength(7);
  if (room.data.stage !== 'started') throw new Error('Expected started game.');
  expect(room.data.manager.game.stage).toBe('onMission');
});
