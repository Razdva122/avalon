import { parseDecisionReply } from './client';
import { decisionPipeline } from './pipeline';
import { parseReply, yandexDecide, AiPause, compactRequest, systemFor } from './client';
import type { BotRequest } from './client';
import type { AiRepository } from './repository';
import type { VisualGameState } from '@avalon/types';
const request: BotRequest = {
  playerID: 'bot',
  name: 'Alice',
  style: 'brief',
  task: 'Vote',
  speak: true,
  state: {} as VisualGameState,
  chat: [],
  choices: ['approve', 'reject'],
};
const realFetch = global.fetch;
const env = { ...process.env };
afterEach(() => {
  global.fetch = realFetch;
  process.env = { ...env };
});
function setup() {
  process.env.YANDEX_MODEL = 'qwen3.6-35b-a3b';
  process.env.YANDEX_API_KEY = 'test-secret';
  process.env.YANDEX_FOLDER_ID = 'folder';
  let charged = 0;
  const repo = {
    reserve: async (_room: string, units: number) => {
      charged += units;
    },
    settle: async (_room: string, reserved: number, actual: number) => {
      charged += actual - reserved;
    },
    roomCost: async () => charged / 10000,
  } as unknown as AiRepository;
  return { repo, cost: () => charged };
}
test('rejects invented choices and oversized speech', () => {
  expect(() => parseReply('{"choice":9,"speech":"hello"}', 2)).toThrow();
  expect(() => parseReply(JSON.stringify({ choice: 0, speech: 'a'.repeat(501) }), 2)).toThrow();
  expect(parseReply('{"choice":1,"speech":"I disagree."}', 2)).toEqual({ choice: 1, speech: 'I disagree.' });
});
test('uses bounded English JSON generation and reconciles billed tokens', async () => {
  const { repo, cost } = setup();
  global.fetch = (async (_url, options) => {
    const payload = JSON.parse(options!.body as string);
    expect(payload.response_format.type).toBe('json_schema');
    expect(payload.response_format.json_schema.schema.properties.choice.enum).toEqual(['approve', 'reject']);
    expect(payload.reasoning_effort).toBe('none');
    expect(payload.max_tokens).toBeLessThanOrEqual(384);
    expect(payload.messages[0].content).toContain('ENGLISH ONLY');
    expect(payload.messages[0].content).not.toContain('test-secret');
    return new Response(
      JSON.stringify({
        usage: { prompt_tokens: 100, completion_tokens: 10 },
        choices: [{ finish_reason: 'stop', message: { content: '{"choice":0,"speech":"Let us test this team."}' } }],
      }),
    );
  }) as typeof fetch;
  const result = await yandexDecide('room', repo, () => {})(request);
  expect(result.speech).toBe('Let us test this team.');
  expect(cost()).toBe(230);
});
test('budget rejection prevents HTTP and ambiguous failure retains reservation', async () => {
  const { repo, cost } = setup();
  let sent = false;
  global.fetch = (async () => {
    sent = true;
    throw Error('timeout');
  }) as typeof fetch;
  const blocked = {
    ...repo,
    reserve: async () => {
      throw new AiPause('budget');
    },
  } as unknown as AiRepository;
  await expect(yandexDecide('room', blocked, () => {})(request)).rejects.toThrow('budget');
  expect(sent).toBe(false);
  await expect(yandexDecide('room', repo, () => {})(request)).rejects.toThrow('AI request failed');
  expect(cost()).toBeGreaterThan(0);
});

test('stop during reservation never sends a paid request and refunds unsent reservation', async () => {
  const { repo, cost } = setup();
  const controller = new AbortController();
  const reserve = repo.reserve.bind(repo);
  repo.reserve = async (room, units) => {
    const period = await reserve(room, units);
    controller.abort();
    return period;
  };
  let sent = false;
  global.fetch = (async () => {
    sent = true;
    throw Error('must not send');
  }) as typeof fetch;
  await expect(yandexDecide('room', repo, () => {})(request, controller.signal)).rejects.toThrow();
  expect(sent).toBe(false);
  expect(cost()).toBe(0);
});

test('states a servants actual side, loss and own mission card explicitly in the request', async () => {
  const { repo } = setup();
  let sent = '';
  global.fetch = (async (_url, options) => {
    sent = JSON.parse(options!.body as string).messages[1].content;
    return new Response(
      JSON.stringify({
        usage: { prompt_tokens: 100, completion_tokens: 10 },
        choices: [{ finish_reason: 'stop', message: { content: '{"choice":0,"speech":"We lost."}' } }],
      }),
    );
  }) as typeof fetch;
  const state = {
    stage: 'end',
    mission: 2,
    result: { winner: 'evil', reason: 'evilTeamMissions' },
    players: [{ id: 'bot', index: 4, role: 'servant', features: {} }],
    settings: { missions: [] },
    history: [
      { type: 'mission', index: 0, result: 'fail', fails: 1, actions: [{ playerID: 'bot', value: 'success' }] },
    ],
  } as unknown as VisualGameState;
  await yandexDecide('room', repo, () => {})({ ...request, state });
  const payload = JSON.parse(sent);
  expect(payload.you).toEqual({ seat: 4, role: 'servant', side: 'good', outcome: 'lost' });
  expect(payload.missions[0].yourCard).toBe('success');
});

test('compact context strips internal IDs and bounds repeated chat and vote history', () => {
  const state = {
    mission: 0,
    players: [{ id: 'internal-id', index: 6, role: 'servant', features: {} }],
    history: Array.from({ length: 30 }, () => ({
      type: 'vote',
      leaderID: 'internal-id',
      team: [{ id: 'internal-id' }],
      votes: [{ playerID: 'internal-id', value: 'reject' }],
      result: 'reject',
    })),
    uuid: 'private-room-identifier',
    irrelevant: 'x'.repeat(20000),
  } as unknown as VisualGameState;
  const compact = compactRequest({
    ...request,
    playerID: 'internal-id',
    state,
    chat: Array.from({ length: 30 }, () => ({ name: '6', text: 'a'.repeat(500) })),
  });
  expect(compact.votes).toHaveLength(25);
  expect(compact.chat).toHaveLength(7);
  expect(compact.chat!.every((m) => m.text.length <= 240)).toBe(true);
  const serialized = JSON.stringify(compact);
  expect(serialized).not.toContain('internal-id');
  expect(serialized).not.toContain('private-room-identifier');
  expect(serialized.length).toBeLessThan(10000);
});

test('Qwen only discounts confirmed cached input', async () => {
  const { repo, cost } = setup();
  let model = '';
  global.fetch = (async (_url, options) => {
    model = JSON.parse(options!.body as string).model;
    return new Response(
      JSON.stringify({
        usage: { prompt_tokens: 100, completion_tokens: 10, prompt_tokens_details: { cached_tokens: 80 } },
        choices: [{ finish_reason: 'stop', message: { content: '{"choice":0,"speech":"I agree."}' } }],
      }),
    );
  }) as typeof fetch;
  await yandexDecide('room', repo, () => {})(request);
  expect(model).toBe('gpt://folder/qwen3.6-35b-a3b');
  expect(cost()).toBe(110);
});

test('explicit action labels resolve to the exact legal action, not a guessed numeric index', () => {
  expect(parseReply('{"choice":"reject","speech":"This team is risky."}', ['approve', 'reject'])).toEqual({
    choice: 1,
    speech: 'This team is risky.',
  });
  expect(() => parseReply('{"choice":"abstain","speech":""}', ['approve', 'reject'])).toThrow();
});

test('fifth proposal forecast follows seat order across wraparound, not array order', () => {
  const players = [4, 1, 7, 2, 6, 3, 5].map((index) => ({
    id: `id-${index}`,
    index,
    role: 'unknown',
    features: { isLeader: index === 6 },
  }));
  const state = { mission: 0, vote: 2, stage: 'selectTeam', players } as unknown as VisualGameState;
  const turn = compactRequest({ ...request, playerID: 'id-1', state });
  expect(turn.proposal).toEqual({ number: 3, fifthLeader: 1, rejectionsUntilForced: 2, forced: false });
  const fifth = compactRequest({ ...request, state: { ...state, vote: 4 } });
  expect(fifth.proposal).toEqual({ number: 5, fifthLeader: 6, rejectionsUntilForced: 0, forced: true });
});

test('private Evil evidence and council never enter a Good players model context', () => {
  const context = {
    ...request,
    evilEvidence: [{ name: '1', text: 'EARLY_CLUE' }],
    evilCouncil: [{ seat: '2', target: '1', reason: 'SECRET_COUNCIL' }],
  };
  for (const role of ['servant', 'merlin', 'percival', 'mordred', 'morgana', 'minion']) {
    const state = {
      stage: 'assassinate',
      players: [{ id: 'bot', index: 2, role, features: {} }],
    } as unknown as VisualGameState;
    const serialized = JSON.stringify(compactRequest({ ...context, state }));
    const evil = ['mordred', 'morgana', 'minion'].includes(role);
    expect(serialized.includes('SECRET_COUNCIL')).toBe(evil);
    expect(serialized.includes('EARLY_CLUE')).toBe(evil);
  }
});

test('inspection and assassination targets never masquerade as mission teams', () => {
  const players = [
    { id: 'bot', index: 3, role: 'merlin', features: {} },
    { id: 'target', index: 5, role: 'unknown', features: { isSelected: true } },
  ];
  for (const stage of ['announceLoyalty', 'end']) {
    const state = {
      stage,
      players,
      history: [
        { type: 'assassinate', assassinID: 'bot', killedIDs: ['target'], result: 'miss', assassinateType: 'merlin' },
      ],
    } as unknown as VisualGameState;
    const p = JSON.parse(JSON.stringify(compactRequest({ ...request, state })));
    expect(p.team).toBeUndefined();
    expect(p.proposedTeam).toBeUndefined();
    if (stage === 'announceLoyalty') expect(p.inspectionTarget).toBe(5);
    else {
      expect(p.assassinations[0]).toMatchObject({ assassin: 3, targets: [5], result: 'miss' });
      expect(p.strategy).toBeUndefined();
      expect(p.chat).toBeUndefined();
    }
  }
});

test('mission context states membership and two-fail arithmetic explicitly', () => {
  const state = {
    stage: 'onMission',
    mission: 3,
    players: [{ id: 'bot', index: 3, role: 'servant', features: { isSent: true } }],
    settings: { missions: [null, null, null, { players: 4, failsRequired: 2 }] },
  } as unknown as VisualGameState;
  const p = JSON.parse(JSON.stringify(compactRequest({ ...request, state })));
  expect(p.youAreOnTeam).toBe(true);
  expect(p.missionRule.successWithFails).toEqual([0, 1]);
  expect(p.missionRule.failureAtLeast).toBe(2);
});

test('votes retain mission and attempt numbers, leaders and automatic-vote semantics', () => {
  const vote = {
    type: 'vote',
    leaderID: 'bot',
    team: [{ id: 'bot' }],
    votes: [{ playerID: 'bot', value: 'approve' }],
    result: 'reject',
  };
  const state = {
    stage: 'end',
    players: [{ id: 'bot', index: 6, role: 'servant', features: {} }],
    history: [
      vote,
      { ...vote, forced: true, result: 'approve' },
      {
        type: 'mission',
        index: 0,
        leaderID: 'bot',
        result: 'success',
        fails: 0,
        actions: [{ playerID: 'bot', value: 'success' }],
      },
      vote,
    ],
  } as unknown as VisualGameState;
  const p = compactRequest({ ...request, state });
  expect(p.votes!.map((v) => [v.mission, v.attempt])).toEqual([
    [1, 1],
    [1, 2],
    [2, 1],
  ]);
  expect(p.votes![1].yourVote).toBe('automatic: no vote cast');
  expect(p.missions[0]).toMatchObject({ leader: 6, participated: true, yourCard: 'success' });
  const endPrompt = systemFor({ ...request, state });
  expect(endPrompt).not.toContain('Normally include yourself');
  expect(endPrompt).not.toContain('never reveal Merlin');
  expect(endPrompt.length).toBeLessThan(1500);
});

test('session mode isolates players and sends only new public events on continuation', async () => {
  process.env.AI_CONTEXT_MODE = 'sessions';
  const { repo } = setup();
  const bodies: { previous_response_id?: string; input?: unknown }[] = [];
  global.fetch = (async (_url, options) => {
    const body = JSON.parse(options!.body as string);
    bodies.push(body);
    return new Response(
      JSON.stringify({
        id: `response-${bodies.length}`,
        status: 'completed',
        usage: { input_tokens: 100, output_tokens: 10 },
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: '{"choice":"approve","speech":"A cautious team.","memory":"Uncertain about 4."}',
              },
            ],
          },
        ],
      }),
    );
  }) as typeof fetch;
  const decide = yandexDecide('sessions', repo, () => {});
  const state = {
    stage: 'selectTeam',
    players: [
      { id: 'bot', index: 1, role: 'servant', features: {} },
      { id: 'other', index: 2, role: 'servant', features: {} },
    ],
  } as unknown as VisualGameState;
  const first = { ...request, state, chat: [{ name: '1', text: 'EARLY_EVENT' }] };
  await decide(first);
  await decide({ ...first, playerID: 'other' });
  await decide({ ...first, chat: [...first.chat, { name: '2', text: 'NEW_EVENT' }] });
  expect(bodies[0].previous_response_id).toBeUndefined();
  expect(bodies[1].previous_response_id).toBeUndefined();
  expect(bodies[2].previous_response_id).toBe('response-1');
  expect(JSON.stringify(bodies[2].input)).not.toContain('EARLY_EVENT');
  expect(JSON.stringify(bodies[2].input)).toContain('NEW_EVENT');
});

test('session reservations include retained history and ambiguous failures pause instead of fallback', async () => {
  process.env.AI_CONTEXT_MODE = 'sessions';
  const { repo } = setup();
  const reservations: number[] = [];
  const reserve = repo.reserve.bind(repo);
  repo.reserve = async (id, units) => {
    reservations.push(units);
    return reserve(id, units);
  };
  let calls = 0;
  global.fetch = (async () => {
    if (++calls === 2) throw Error('timeout after send');
    return new Response(
      JSON.stringify({
        id: 'first',
        status: 'completed',
        usage: { input_tokens: 100, output_tokens: 10 },
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: '{"choice":"approve","speech":"A cautious team.","memory":"Uncertain about 4."}',
              },
            ],
          },
        ],
      }),
    );
  }) as typeof fetch;
  const decide = yandexDecide('retained', repo, () => {});
  await decide(request);
  await expect(decide(request)).rejects.toBeInstanceOf(AiPause);
  expect(reservations[1]).toBeGreaterThan(reservations[0]);
});

test('long sessions restart with private memory and fresh facts without replaying the full chat', async () => {
  process.env.AI_CONTEXT_MODE = 'sessions';
  const { repo } = setup();
  const bodies: { previous_response_id?: string; input?: unknown }[] = [];
  global.fetch = (async (_url, options) => {
    bodies.push(JSON.parse(options!.body as string));
    return new Response(
      JSON.stringify({
        id: `r${bodies.length}`,
        status: 'completed',
        usage: { input_tokens: 100, output_tokens: 20 },
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  choice: 'approve',
                  speech: 'A cautious team.',
                  memory: 'PRIVATE_MEMORY: suspect 4; uncertain, based on mission 1.',
                }),
              },
            ],
          },
        ],
      }),
    );
  }) as typeof fetch;
  const decide = yandexDecide('bounded', repo, () => {});
  for (let i = 0; i < 5; i++) await decide(request);
  // A larger prompt may trigger the byte limit before the four-turn limit.
  const restarted = bodies.slice(1, 5).find((body) => body.previous_response_id === undefined);
  expect(restarted).toBeDefined();
  expect(JSON.stringify(restarted!.input)).toContain('PRIVATE_MEMORY');
  await decide({ ...request, playerID: 'other' });
  expect(JSON.stringify(bodies[5].input)).not.toContain('PRIVATE_MEMORY');
});

test('cost log distinguishes billed usage from an unconfirmed reservation without storing prompts', async () => {
  const { repo } = setup();
  const logs: import('./repository').AiRequestLog[] = [];
  repo.recordRequest = async (entry) => {
    logs.push(structuredClone(entry));
  };
  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        usage: { prompt_tokens: 100, completion_tokens: 10, prompt_tokens_details: { cached_tokens: 80 } },
        choices: [{ finish_reason: 'stop', message: { content: '{"choice":0,"speech":"Hello"}' } }],
      }),
    )) as typeof fetch;
  await yandexDecide('logged', repo, () => {})(request);
  expect(logs.at(-1)).toMatchObject({
    status: 'completed',
    inputTokens: 100,
    cachedTokens: 80,
    outputTokens: 10,
    actualUnits: 110,
  });
  expect(logs.at(-1)!.reserveUnits).toBeGreaterThan(110);
  expect(JSON.stringify(logs)).not.toContain('test-secret');
  expect(JSON.stringify(logs)).not.toContain('Hello');
  global.fetch = (async () => {
    throw Error('network');
  }) as typeof fetch;
  await expect(yandexDecide('logged', repo, () => {})(request)).rejects.toThrow();
  expect(logs.at(-1)).toMatchObject({ status: 'unconfirmed-charge' });
  expect(logs.at(-1)!.actualUnits).toBeUndefined();
  repo.reserve = async () => {
    throw new AiPause('budget');
  };
  await expect(yandexDecide('logged', repo, () => {})(request)).rejects.toThrow('budget');
  expect(logs.at(-1)?.status).toBe('reservation-rejected');
});

test('private decision trace links context, memory and action to cost log without returning memory publicly', async () => {
  process.env.AI_CONTEXT_MODE = 'sessions';
  const { repo } = setup();
  const traces: Record<string, unknown>[] = [];
  const costs: import('./repository').AiRequestLog[] = [];
  // Trace persistence is separate from public replays.
  Object.assign(repo, {
    recordDecision: async (entry: Record<string, unknown>) => {
      traces.push(structuredClone(entry));
    },
  });
  repo.recordRequest = async (entry) => {
    costs.push(structuredClone(entry));
  };
  global.fetch = (async () =>
    new Response(
      JSON.stringify({
        id: 'private-response',
        status: 'completed',
        usage: { input_tokens: 100, output_tokens: 20 },
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  choice: 'approve',
                  speech: 'This team is worth testing.',
                  memory: 'PRIVATE: suspect 4 based on mission 1.',
                }),
              },
            ],
          },
        ],
      }),
    )) as typeof fetch;
  const result = await yandexDecide('trace-room', repo, () => {})(request);
  expect(traces.length).toBeGreaterThan(0);
  expect(traces.at(-1)).toMatchObject({
    _id: costs.at(-1)!._id,
    roomID: 'trace-room',
    choice: 'approve',
    memoryAfter: 'PRIVATE: suspect 4 based on mission 1.',
  });
  expect(traces[0].payload).toBeDefined();
  expect(JSON.stringify(traces)).not.toContain('test-secret');
  expect(JSON.stringify(result)).not.toContain('PRIVATE');
});

test('truncated paid replies are settled and the retry separately reserves budget before HTTP', async () => {
  const { repo, cost } = setup();
  let requests = 0;
  const audits: { status: string; actualUnits?: number }[] = [];
  repo.recordRequest = async (entry) => {
    audits.push({ ...entry });
  };
  global.fetch = (async () => {
    requests++;
    return new Response(
      JSON.stringify({
        usage: { prompt_tokens: 100, completion_tokens: 4096 },
        choices: [{ finish_reason: 'length', message: { content: null } }],
      }),
    );
  }) as typeof fetch;
  const decide = decisionPipeline((r, options, signal) => yandexDecide('room', repo, () => {}, options)(r, signal));
  const reserve = repo.reserve;
  let reservations = 0;
  repo.reserve = async (room, units) => {
    if (++reservations === 2) throw new AiPause('budget');
    return reserve(room, units);
  };
  await expect(decide(request)).rejects.toThrow('budget');
  expect(requests).toBe(1);
  expect(reservations).toBe(2);
  expect(cost()).toBe(100 * 2 + 4096 * 3);
  expect(audits).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ status: 'error', actualUnits: 12488 }),
      expect.objectContaining({ status: 'reservation-rejected' }),
    ]),
  );
});

test('decision evidence requires bounded sourced facts and explicit certainty', () => {
  const valid = {
    choice: 'reject',
    speech: 'Private.',
    publicReason: 'Mission 2 proved 5 Evil.',
    evidence: [
      { key: 'm2', kind: 'deduction', fact: '5 is Evil', source: 'Mission 2: 3 Fail out of 3', certainty: 'proven' },
    ],
  };
  expect(parseDecisionReply(JSON.stringify(valid), ['approve', 'reject']).evidence).toEqual(valid.evidence);
  expect(() =>
    parseDecisionReply(JSON.stringify({ ...valid, evidence: [{ ...valid.evidence[0], source: '' }] }), ['reject']),
  ).toThrow();
  expect(() =>
    parseDecisionReply(JSON.stringify({ ...valid, evidence: [{ ...valid.evidence[0], certainty: 'probably' }] }), [
      'reject',
    ]),
  ).toThrow();
});

test('predictions and testimony cannot be stored as proven evidence', () => {
  for (const kind of ['prediction', 'testimony', 'bluff']) {
    const parsed = parseDecisionReply(
      JSON.stringify({
        choice: 'fail',
        speech: '',
        publicReason: '',
        evidence: [
          { key: 'ally', kind, fact: 'An ally will play Fail', source: 'Expected ally action', certainty: 'proven' },
        ],
      }),
      ['fail'],
    );
    expect(parsed.evidence?.[0].certainty).toBe(kind === 'bluff' ? 'bluff' : 'claim');
  }
});

const openingRequest = (role: string, selected: boolean, vote = 0): BotRequest => ({
  ...request,
  playerID: '1',
  name: '1',
  state: {
    stage: 'votingForTeam',
    mission: 0,
    vote,
    settings: { missions: [{ players: 2, failsRequired: 1 }] },
    history: [],
    players: [
      { id: '1', index: 1, role, features: { isSelected: selected } },
      { id: '2', index: 2, role: 'unknown', features: { isSelected: !selected, isLeader: true } },
      { id: '3', index: 3, role: 'unknown', features: { isSelected: true } },
    ],
  } as unknown as VisualGameState,
});
test('opening self preference applies to uninvolved Good without forcing a late rejection or Evil strategy', () => {
  expect(compactRequest(openingRequest('servant', false))).toMatchObject({
    actionFacts: { openingSelfPreference: true, team: [2, 3], youAreOnTeam: false },
  });
  for (const r of [
    openingRequest('servant', true),
    openingRequest('mordred', false),
    openingRequest('servant', false, 3),
  ]) {
    expect(compactRequest(r)).toMatchObject({ actionFacts: { openingSelfPreference: false } });
  }
});
test('action facts count an Evil player themselves and preserve the two-Fail threshold', () => {
  const r = openingRequest('mordred', true);
  r.state.mission = 3;
  r.state.settings.missions[3] = { players: 4, failsRequired: 2 };
  expect(compactRequest(r)).toMatchObject({
    actionFacts: {
      yourSeat: 1,
      yourSide: 'evil',
      youAreOnTeam: true,
      knownEvilOnTeam: [1],
      failsRequired: 2,
      toleratesFails: 1,
      openingSelfPreference: false,
    },
  });
});

test('DeepSeek uses its own URI and tariff including cached input; unknown models never spend', async () => {
  const { repo, cost } = setup();
  const fetch = jest.fn(async (_url, options) => {
    expect(JSON.parse(options.body).model).toBe('gpt://folder/deepseek-v4-flash');
    return new Response(
      JSON.stringify({
        usage: { prompt_tokens: 100, prompt_tokens_details: { cached_tokens: 40 }, completion_tokens: 10 },
        choices: [{ finish_reason: 'stop', message: { content: '{"choice":"approve","speech":"Test."}' } }],
      }),
    );
  });
  global.fetch = fetch;
  await yandexDecide('room', repo, () => {}, { model: 'deepseek-v4-flash' })(request);
  expect(cost()).toBe(260); // 60*3 + 40*.75 + 10*5
  for (const model of ['unknown', '__proto__', 'constructor']) {
    await expect(yandexDecide('room', repo, () => {}, { model })(request)).rejects.toThrow();
  }
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(cost()).toBe(260);
});

test.each(['none', 'default'] as const)(
  'allows ten minutes for %s requests and preserves admin cancellation',
  async (reasoning) => {
    const { repo } = setup();
    const controller = new AbortController();
    const deadline = new AbortController();
    const timeout = jest.spyOn(AbortSignal, 'timeout').mockReturnValue(deadline.signal);
    try {
      global.fetch = jest.fn(async (_url, options) => {
        expect(options?.signal?.aborted).toBe(false);
        controller.abort();
        expect(options?.signal?.aborted).toBe(true);
        throw Error('cancelled by admin');
      });
      await expect(yandexDecide('room', repo, () => {}, { reasoning })(request, controller.signal)).rejects.toThrow();
      expect(timeout).toHaveBeenCalledWith(600000);
    } finally {
      timeout.mockRestore();
    }
  },
);
