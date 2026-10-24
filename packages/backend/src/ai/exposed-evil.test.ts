import { decisionPipeline, publicContext, safePublicSpeech } from './pipeline';
import { parseDecisionReply } from './client';
import type { BotReply, BotRequest } from './client';
type ExposedEvilPlan = {
  mode: 'direct' | 'reverse';
  promotedSeat: number;
  desiredSeat: number;
  audienceSeat: number;
  rationale: string;
  reconsiderWhen: string;
};
const guard = safePublicSpeech as (
  speech: string,
  choice: string,
  language?: string,
  claim?: boolean,
  admission?: boolean,
) => string;

const plan: ExposedEvilPlan = {
  mode: 'reverse',
  promotedSeat: 4,
  desiredSeat: 3,
  audienceSeat: 6,
  rationale: '6 rejects players I endorse; make 4 look linked to me so 6 selects 3.',
  reconsiderWhen: '6 stops treating my endorsements as links, or a winning Evil roster is reachable.',
};
const request = (stage = 'selectTeam', role = 'mordred'): BotRequest => ({
  playerID: '1',
  name: '1',
  style: 'brief',
  language: 'ru',
  task: 'Choose for your side.',
  speak: stage === 'selectTeam',
  publicDiscussion: stage === 'selectTeam',
  chat: [],
  choices: stage === 'selectTeam' ? ['2, 4, 6', '2, 3, 6'] : ['approve', 'reject'],
  state: {
    stage,
    mission: 2,
    vote: 0,
    history: [],
    settings: { missions: [{ players: 2 }] },
    players: Array.from({ length: 7 }, (_, i) => ({
      id: String(i + 1),
      index: i + 1,
      role: i === 0 ? role : 'unknown',
      features: { isLeader: i === 0 },
    })),
  } as unknown as BotRequest['state'],
});
const admission = (strategy = plan): BotReply & { admitEvil: boolean; exposedStrategy: ExposedEvilPlan } => ({
  choice: 0,
  speech: 'The table knows; invert the link read.',
  publicReason: 'Да, я злой. Поход с 4 мне нравится.',
  admitEvil: true,
  exposedStrategy: strategy,
});

test.each(['direct', 'reverse'] as const)('a %s plan survives silent turns and evidence churn', async (mode) => {
  const chosen = { ...plan, mode, desiredSeat: mode === 'direct' ? 4 : 3 };
  const contexts: Record<string, unknown>[] = [];
  let turn = 0;
  const decide = decisionPipeline(async (_request, options) => {
    contexts.push(options.context as Record<string, unknown>);
    if (turn++ === 0) return admission(chosen);
    return {
      choice: 0,
      speech: 'Continue the recorded plan.',
      publicReason: '',
      evidence: [
        { key: `turn:${turn}`, kind: 'deduction', certainty: 'claim', fact: 'New note.', source: 'This turn.' },
      ],
    };
  });
  expect((await decide(request())).speech).toContain('я злой');
  for (let i = 0; i < 15; i++) await decide(request('votingForTeam'));
  expect(contexts[15].exposedEvil).toEqual({ admitted: true, plan: chosen });
});

test('a new strategy requires an explicit revision reason and admission cannot be undone', async () => {
  let turn = 0;
  const decide = decisionPipeline(async () =>
    turn++ === 0
      ? admission()
      : {
          choice: 0,
          speech: 'Switch without a reason.',
          publicReason: '',
          admitEvil: false,
          exposedStrategy: { ...plan, mode: 'direct', promotedSeat: 3 },
        },
  );
  await decide(request());
  await expect(decide(request('votingForTeam'))).rejects.toThrow();
});

test('a justified strategy revision persists while the public admission remains', async () => {
  const changed: ExposedEvilPlan = { ...plan, mode: 'direct', promotedSeat: 3 };
  let turn = 0;
  const contexts: Record<string, unknown>[] = [];
  const decide = decisionPipeline(async (_request, options) => {
    contexts.push(options.context as Record<string, unknown>);
    if (turn++ === 0) return admission();
    return {
      choice: 0,
      speech: '3 can now win immediately.',
      publicReason: '',
      admitEvil: false,
      ...(turn === 2
        ? {
            exposedStrategy: changed,
            strategyChangeReason: '6 explicitly stopped using my endorsements; a winning roster with 3 is reachable.',
          }
        : {}),
    };
  });
  await decide(request());
  await decide(request('votingForTeam'));
  await decide(request('votingForTeam'));
  expect(contexts[2].exposedEvil).toEqual({ admitted: true, plan: changed });
});

test('other players see the admission but never the private strategy', async () => {
  const contexts: Record<string, unknown>[] = [];
  const decide = decisionPipeline(async (r, options) => {
    contexts.push(options.context as Record<string, unknown>);
    return r.playerID === '1' ? admission() : { choice: 0, speech: 'Read public evidence.', publicReason: '' };
  });
  await decide(request());
  const other = request('votingForTeam');
  other.playerID = '2';
  other.name = '2';
  other.state.players[1].role = 'servant';
  await decide(other);
  expect(contexts[1].publicEvilAdmissions).toEqual([1]);
  expect(contexts[1]).not.toHaveProperty('exposedEvil');
  expect(JSON.stringify(publicContext(other, 'approve'))).not.toContain(plan.rationale);
});

test.each(['servant', 'merlin', 'percival'])('a Good %s cannot use the Evil admission capability', async (role) => {
  await expect(decisionPipeline(async () => admission())(request('selectTeam', role))).rejects.toThrow();
});

test('a silent action cannot create a public admission', async () => {
  await expect(decisionPipeline(async () => admission())(request('votingForTeam'))).rejects.toThrow();
});

test('admission needs matching public words and a private plan', async () => {
  await expect(
    decisionPipeline(async () => ({ ...admission(), publicReason: 'Берите 4.' }))(request()),
  ).rejects.toThrow();
  await expect(
    decisionPipeline(async () => ({ ...admission(), exposedStrategy: undefined }))(request()),
  ).rejects.toThrow();
});

test('own-side admission still blocks specific roles, allies and private strategy disclosure', () => {
  expect(guard('Да, я злой.', '', 'ru', false, true)).toBe('Да, я злой.');
  expect(guard('Я мафия.', '', 'ru', false, true)).toBe('Я мафия.');
  expect(() => guard('Я мафия.', '', 'ru')).toThrow();
  expect(() => guard('Я Мордред.', '', 'ru', false, true)).toThrow();
  expect(() => guard('Я злой, 3 — мой союзник.', '', 'ru', false, true)).toThrow();
});

test.each([
  'Да, я на стороне зла.',
  'Я на стороне тьмы.',
  'Я тёмный.',
  'Играю за тьму.',
  'Я за зло.',
  'Я играю за зло.',
])('a natural alignment admission is accepted: %s', (line) => {
  expect(guard(line, '', 'ru', false, true)).toBe(line);
  expect(() => guard(line, '', 'ru')).toThrow();
});

test('the provider parser retains the structured strategy and rejects invalid seats', () => {
  const raw = {
    choice: '2, 4, 6',
    speech: 'Private.',
    publicReason: 'Я злой.',
    evidence: [],
    admitEvil: true,
    exposedStrategy: plan,
    strategyChangeReason: '',
    claimMorgana: null,
    claimStances: [],
  };
  expect(parseDecisionReply(JSON.stringify(raw), request().choices, request())).toMatchObject({
    admitEvil: true,
    exposedStrategy: plan,
  });
  expect(() =>
    parseDecisionReply(
      JSON.stringify({ ...raw, exposedStrategy: { ...plan, desiredSeat: 8 } }),
      request().choices,
      request(),
    ),
  ).toThrow();
});

test('a publicly admitted actor cannot return to claiming Good', async () => {
  let turn = 0;
  const decide = decisionPipeline(async () =>
    turn++ === 0
      ? admission()
      : {
          choice: 0,
          speech: 'Retreat to cover.',
          publicReason: 'Я мирный, проверка ложная.',
        },
  );
  await decide(request());
  await expect(decide(request())).rejects.toThrow();
});

test.each(['Я злой Мордред.', 'I am evil Morgana.'])(
  'alignment admission does not permit specific-role disclosure: %s',
  (line) => {
    expect(() => guard(line, '', 'ru', false, true)).toThrow();
  },
);

test('an accusation containing меня is not a first-person admission', () => {
  const line = 'Вы считаете меня злой, но это ошибка.';
  expect(guard(line, '', 'ru')).toBe(line);
});

test.each(['Я за добро.', 'Я на стороне добра.', 'Я играю за добро.'])(
  'a public admission cannot be retracted using natural alignment words: %s',
  async (line) => {
    let turn = 0;
    const decide = decisionPipeline(async () =>
      turn++ === 0 ? admission() : { choice: 0, speech: 'Retreat.', publicReason: line },
    );
    await decide(request());
    await expect(decide(request())).rejects.toThrow();
  },
);
