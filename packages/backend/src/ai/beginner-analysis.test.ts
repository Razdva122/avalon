import { buildBeginnerAnalysis, parseBeginnerAnalysis, BeginnerAnalysis } from './beginner-analysis';
import type { StartedRoomState } from '@avalon/types';

function state(): StartedRoomState {
  return {
    roomID: 'game',
    stage: 'started',
    createAt: new Date().toISOString(),
    ai: { beginner: true, humanPlayerID: 'me', language: 'ru' },
    game: {
      stage: 'end',
      result: { winner: 'evil', reason: 'evilTeamMissions' },
      settings: { roles: { good: ['servant', 'merlin', 'percival'], evil: ['morgana', 'mordred'] } },
      players: [
        { id: 'me', index: 1, role: 'servant' },
        { id: 'secret', index: 2, role: 'morgana' },
        { id: 'hidden', index: 3, role: 'mordred' },
      ],
      history: [
        {
          type: 'vote',
          anonymous: false,
          forced: false,
          index: 0,
          leaderID: 'secret',
          team: [{ id: 'me' }, { id: 'secret' }],
          result: 'approve',
          votes: [{ playerID: 'me', value: 'approve' }],
        },
        {
          type: 'mission',
          index: 0,
          hidden: false,
          settings: { players: 2, failsRequired: 1 },
          actions: [
            { playerID: 'me', value: 'success' },
            { playerID: 'secret', value: 'fail' },
          ],
          result: 'fail',
          fails: 1,
        },
      ],
    },
  } as unknown as StartedRoomState;
}
test('context separates the decision from later results and removes other secret cards and roles', () => {
  const context = buildBeginnerAnalysis(state(), 'me')!;
  expect(context.episodes[0]).toMatchObject({
    id: 'vote-0',
    availableThrough: 0,
    action: { type: 'vote', value: 'approve', team: [1, 2] },
    outcomeEvent: 'event-1',
  });
  expect(context.events[1]).toMatchObject({ id: 'event-1', type: 'mission', mission: 1, result: 'fail', team: [1, 2] });
  expect(JSON.stringify(context)).not.toContain('morgana');
  expect(JSON.stringify(context)).not.toContain('mordred');
  expect(JSON.stringify(context)).not.toContain('secret');
  expect(context.events[1]).not.toHaveProperty('actions');
});
test('spectators, normal games, manual endings and missing winners cannot request AI analysis', () => {
  expect(buildBeginnerAnalysis(state(), 'spectator')).toBeNull();
  for (const change of [
    { ai: { beginner: false, humanPlayerID: 'me' } },
    { game: { ...state().game, stage: 'selectTeam' } },
    { game: { ...state().game, result: { reason: 'manualy' } } },
  ])
    expect(buildBeginnerAnalysis({ ...state(), ...change } as StartedRoomState, 'me')).toBeNull();
});
test('anonymous and forced votes never invent a personal voting decision', () => {
  const room = state();
  Object.assign(room.game.history[0], { anonymous: true, votes: { approve: 3, reject: 2 } });
  expect(buildBeginnerAnalysis(room, 'me')!.episodes).toEqual([]);
  Object.assign(room.game.history[0], {
    anonymous: false,
    forced: true,
    votes: [{ playerID: 'me', value: 'approve' }],
  });
  expect(buildBeginnerAnalysis(room, 'me')!.episodes).toEqual([]);
});
test('rejects fabricated episodes and evidence from after the selected outcome', () => {
  const context = buildBeginnerAnalysis(state(), 'me')!;
  const reply = {
    choice: 'vote-0',
    speech: 'You supported the team.',
    observation: 'The mission failed.',
    next: 'Compare the next roster.',
    sources: ['event-1'],
  };
  expect(parseBeginnerAnalysis(JSON.stringify(reply), context)).toMatchObject({
    decision: reply.speech,
    episodeID: 'vote-0',
  });
  expect(() => parseBeginnerAnalysis(JSON.stringify({ ...reply, choice: 'invented' }), context)).toThrow();
  expect(() => parseBeginnerAnalysis(JSON.stringify({ ...reply, sources: ['event-99'] }), context)).toThrow();
  expect(() => parseBeginnerAnalysis(JSON.stringify({ ...reply, next: '' }), context)).toThrow();
});
test('analysis runs once with the fixed model and low reasoning, persists and reuses the result', async () => {
  const docs = new Map<string, any>();
  const collection = {
    createIndex: async () => {},
    findOne: async (q: any) => docs.get(q._id) ?? null,
    insertOne: async (doc: any) => {
      if (docs.has(doc._id)) throw Object.assign(Error(), { code: 11000 });
      docs.set(doc._id, doc);
    },
    updateOne: async (q: any, update: any) => {
      Object.assign(docs.get(q._id), update.$set);
    },
  };
  const runner = jest.fn(async () => ({
    text: JSON.stringify({
      choice: 'vote-0',
      speech: 'Your vote.',
      observation: 'A public failure.',
      next: 'Compare teams.',
      sources: ['event-1'],
    }),
    usage: { input_tokens: 30, output_tokens: 20 },
  }));
  const audit = jest.fn(async () => {});
  const models = async () => [{ id: 'gpt-6.1-sol', label: 'Sol', efforts: ['low'] }];
  const review = new BeginnerAnalysis(
    { collection: () => collection } as any,
    { recordRequest: audit } as any,
    runner as any,
    models,
  );
  const [one, two] = await Promise.all([review.get(state(), 'me'), review.get(state(), 'me')]);
  expect(one).toMatchObject({ status: 'complete', review: { decision: 'Your vote.' } });
  expect(two).toEqual(one);
  expect(runner).toHaveBeenCalledTimes(1);
  expect(runner.mock.calls[0]).toHaveLength(5);
  expect((runner.mock.calls[0] as unknown[])[3]).toEqual({ model: 'gpt-6.1-sol', reasoning: 'low' });
  const restarted = new BeginnerAnalysis(
    { collection: () => collection } as any,
    { recordRequest: audit } as any,
    runner as any,
    models,
  );
  expect(await restarted.get(state(), 'me')).toEqual(one);
  expect(runner).toHaveBeenCalledTimes(1);
});

test('starting another game cancels optional analysis and never replays an uncertain request', async () => {
  const docs = new Map<string, any>();
  const collection = {
    createIndex: async () => {},
    findOne: async (q: any) => docs.get(q._id) ?? null,
    insertOne: async (doc: any) => {
      docs.set(doc._id, doc);
    },
    updateOne: async (q: any, update: any) => {
      Object.assign(docs.get(q._id), update.$set);
    },
  };
  let entered!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const runner = jest.fn(
    (_prompt, _schema, signal: AbortSignal) =>
      new Promise((_resolve, reject) => {
        entered();
        signal.addEventListener('abort', () => reject(Error('cancelled')), { once: true });
      }),
  );
  const analysis = new BeginnerAnalysis(
    { collection: () => collection } as any,
    { recordRequest: async () => {} } as any,
    runner as any,
    async () => [{ id: 'gpt-6.1-sol', label: 'Sol', efforts: ['low'] }],
  );
  const pending = analysis.get(state(), 'me');
  await started;
  await analysis.cancelAll();
  expect(await pending).toEqual({ status: 'unavailable' });
  expect(await analysis.get(state(), 'me')).toEqual({ status: 'unavailable' });
  expect(runner).toHaveBeenCalledTimes(1);
});

test('an unavailable requested model does not silently substitute another model', async () => {
  let doc: any;
  const collection = {
    createIndex: async () => {},
    findOne: async () => doc ?? null,
    insertOne: async (d: any) => {
      doc = d;
    },
    updateOne: async (_q: any, u: any) => Object.assign(doc, u.$set),
  };
  const runner = jest.fn();
  const analysis = new BeginnerAnalysis(
    { collection: () => collection } as any,
    { recordRequest: async () => {} } as any,
    runner,
    async () => [{ id: 'gpt-6-luna', label: 'Luna', efforts: ['low'] }],
  );
  expect(await analysis.get(state(), 'me')).toEqual({ status: 'unavailable' });
  expect(runner).not.toHaveBeenCalled();
});
