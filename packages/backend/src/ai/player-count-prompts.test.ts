import type { AiLanguage } from '@avalon/types';
import { compactRequest } from './client';
import type { BotRequest } from './client';
import { publicContext, decisionPipeline } from './pipeline';

const requestFor = (count: number): BotRequest =>
  ({
    playerID: '1',
    name: '1',
    style: 'Careful analyst.',
    task: 'Discuss a preferred opening team.',
    speak: true,
    publicDiscussion: true,
    choices: count === 8 ? ['1, 2, 3', '1, 3, 8'] : ['1, 2', '1, 3'],
    chat: Array.from({ length: count }, (_, i) => ({ name: String(i + 1), text: `Question from ${i + 1}.` })),
    state: {
      stage: 'selectTeam',
      mission: 0,
      vote: 0,
      players: Array.from({ length: count }, (_, i) => ({
        id: String(i + 1),
        index: i + 1,
        role: i === 0 ? 'merlin' : i === 3 || i === 6 ? 'evil' : 'unknown',
        features: { isLeader: i === 0 },
      })),
      settings: {
        total: count,
        players: { good: count === 5 ? 3 : count === 8 ? 5 : 4, evil: count >= 7 ? 3 : 2 },
        roles: {
          good: ['merlin', 'percival', ...Array(count === 5 ? 1 : count === 8 ? 3 : 2).fill('servant')],
          evil: ['mordred', 'morgana', ...(count === 7 ? ['oberon'] : count === 8 ? ['minion'] : [])],
        },
        missions: [{ players: count === 8 ? 3 : 2, failsRequired: 1 }],
      },
      history: [],
    },
  }) as unknown as BotRequest;

test.each([
  [5, 3, { good: 3, evil: 2 }, 1],
  [6, 4, { good: 4, evil: 2 }, 1],
  [7, 4, { good: 4, evil: 3 }, 2],
  [8, 5, { good: 5, evil: 3 }, 2],
])(
  'a %i-player discussion supplies its real majority and only public role totals to the speaker',
  async (count, approvals, alignments, visibleEvil) => {
    const request = requestFor(count as number);
    const generate = jest
      .fn()
      .mockResolvedValueOnce({ choice: 1, speech: 'PRIVATE ROLE REASON', publicReason: 'I prefer this team.' })
      .mockResolvedValueOnce({ choice: 0, speech: 'I prefer this team.' });
    expect(await decisionPipeline(generate)(request)).toMatchObject({ choice: 1, speech: 'I prefer this team.' });
    const decision = generate.mock.calls[0][1];
    const publicReply = { context: publicContext(request, request.choices[1]) };
    const facts = {
      playerCount: count,
      approvalsRequired: approvals,
      alignmentCounts: alignments,
      roleCounts: { merlin: 1, percival: 1, servant: count === 5 ? 1 : count === 8 ? 3 : 2, mordred: 1, morgana: 1 },
    };
    expect(decision.context).toMatchObject({ ...facts, publicDiscussion: true, optionalSpeech: false });
    expect(publicReply.context).toMatchObject({
      ...facts,
      actionType: 'discuss',
      choice: count === 8 ? '1, 3, 8' : '1, 3',
    });
    expect(decision.context.roleAdvice).toContain(`You currently see ${visibleEvil} Evil`);
    expect(decision.context.roleCounts.oberon).toBe(count === 7 ? 1 : undefined);
    expect(publicReply.context.roleCounts?.oberon).toBe(count === 7 ? 1 : undefined);
    expect(publicReply.context.roleCounts?.minion).toBe(count === 8 ? 1 : undefined);
    expect(decision.context.privateKnowledge.rolesVisibleToYou).toContainEqual([4, 'evil']);
    expect(JSON.stringify(publicReply.context)).not.toMatch(
      /privateKnowledge|rolesVisibleToYou|roleAdvice|PRIVATE ROLE REASON/,
    );
    expect(decision.instructions).not.toMatch(/four approvals|fourth approval|all seven seats/);
    expect(decision.instructions).toContain('approvalsRequired');
  },
);

test.each([5, 6, 7, 8])('a partial %i-player legacy fixture still supplies alignment totals', (count) => {
  const request = requestFor(count);
  delete (request.state.settings as Partial<BotRequest['state']['settings']>).players;
  expect(compactRequest(request).alignmentCounts).toEqual(
    count === 5
      ? { good: 3, evil: 2 }
      : count === 6
        ? { good: 4, evil: 2 }
        : count === 8
          ? { good: 5, evil: 3 }
          : { good: 4, evil: 3 },
  );
});

test('Merlin never invents a hidden Mordred when the public lineup contains only visible Evil roles', () => {
  const request = requestFor(5);
  request.state.settings.roles.evil = ['minion', 'morgana'];
  request.state.players[4].role = 'evil';
  const context = compactRequest(request) as ReturnType<typeof compactRequest> & {
    roleCounts?: Record<string, number>;
  };
  expect(context.roleCounts).toMatchObject({ minion: 1, morgana: 1 });
  expect(context.roleCounts?.mordred).toBeUndefined();
  expect(context.roleAdvice).toContain('You currently see 2 Evil');
  expect(context.roleAdvice).not.toContain('hidden Mordred was among');
});

test.each<[number, AiLanguage, number, { good: number; evil: number }]>([
  [5, 'en', 3, { good: 3, evil: 2 }],
  [5, 'ru', 3, { good: 3, evil: 2 }],
  [5, 'zh-tw', 3, { good: 3, evil: 2 }],
  [8, 'en', 5, { good: 5, evil: 3 }],
  [8, 'ru', 5, { good: 5, evil: 3 }],
  [8, 'zh-tw', 5, { good: 5, evil: 3 }],
])(
  'a %i-player %s final selection retains the full circle, facts and optional silence',
  async (count, language, approvalsRequired, alignmentCounts) => {
    const request = { ...requestFor(count), language, publicDiscussion: false, optionalSpeech: true };
    const generate = jest
      .fn()
      .mockResolvedValueOnce({ choice: 1, speech: 'Choose after hearing everyone.', publicReason: '' });
    expect(await decisionPipeline(generate)(request)).toMatchObject({ choice: 1, speech: '' });
    const options = generate.mock.calls[0][1];
    expect(options.context).toMatchObject({
      language,
      playerCount: count,
      approvalsRequired,
      alignmentCounts,
      optionalSpeech: true,
      publicDiscussion: false,
    });
    expect(options.context.chat).toHaveLength(count);
    expect(options.instructions).toContain('publicReason may be empty');
  },
);

test('a final roster naming seat eight is repaired before returning a contradictory action', async () => {
  const request = {
    ...requestFor(8),
    publicDiscussion: false,
    optionalSpeech: true,
    speak: false,
    choices: ['1, 3, 8', '1, 2, 3'],
  };
  const generate = jest
    .fn()
    .mockResolvedValueOnce({ choice: 1, speech: 'I choose [1, 3, 8].', publicReason: '' })
    .mockResolvedValueOnce({ choice: 0, speech: 'I choose [1, 3, 8].', publicReason: '' });
  expect(await decisionPipeline(generate)(request)).toMatchObject({ choice: 0, speech: '' });
  expect(generate.mock.calls[1][1].phase).toBe('decision-repair');
});

test.each([
  [6, 4],
  [8, 5],
])(
  'opening vote advice for %i players uses the required majority instead of one Good vote',
  async (count, approvalsRequired) => {
    const request = requestFor(count);
    request.publicDiscussion = false;
    request.speak = false;
    request.choices = ['approve', 'reject'];
    request.state.stage = 'votingForTeam';
    for (const player of request.state.players) player.features.isSent = player.index <= (count === 8 ? 3 : 2);
    const generate = jest.fn().mockResolvedValue({ choice: 0, speech: 'A feasible opening team.', publicReason: '' });
    expect(await decisionPipeline(generate)(request)).toMatchObject({ choice: 0, speech: '' });
    const decision = generate.mock.calls[0][1];
    expect(decision.context.approvalsRequired).toBe(approvalsRequired);
    expect(decision.instructions).not.toContain('one Good vote');
    expect(decision.context.approvalsRequired).toBe(approvalsRequired);
  },
);
