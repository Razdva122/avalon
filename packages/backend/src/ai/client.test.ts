import { parseDecisionReply } from './client';
import { parseReply, compactRequest, systemFor } from './client';
import type { BotRequest } from './client';
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
test('rejects invented choices and oversized speech', () => {
  expect(() => parseReply('{"choice":9,"speech":"hello"}', 2)).toThrow();
  expect(() => parseReply(JSON.stringify({ choice: 0, speech: 'a'.repeat(501) }), 2)).toThrow();
  expect(parseReply('{"choice":1,"speech":"I disagree."}', 2)).toEqual({ choice: 1, speech: 'I disagree.' });
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
  expect(compact.chat).toHaveLength(14);
  expect(compact.chat!.every((m) => m.text.length <= 240)).toBe(true);
  const serialized = JSON.stringify(compact);
  expect(serialized).not.toContain('internal-id');
  expect(serialized).not.toContain('private-room-identifier');
  expect(serialized.length).toBeLessThan(10000);
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
  for (const role of ['servant', 'merlin', 'percival', 'mordred', 'morgana', 'minion', 'oberon']) {
    const state = {
      stage: 'assassinate',
      players: [{ id: 'bot', index: 2, role, features: {} }],
    } as unknown as VisualGameState;
    const serialized = JSON.stringify(compactRequest({ ...context, state }));
    const evil = ['mordred', 'morgana', 'minion', 'oberon'].includes(role);
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

test.each([
  { observer: 1, role: 'servant', card: 'success' },
  { observer: 1, role: 'morgana', card: 'fail' },
  { observer: 5, role: 'servant', card: 'success' },
])('mission facts do not impose partner exclusions for $role observer $observer', ({ observer, role, card }) => {
  const players = [4, 2, 7, 5, 1, 6, 3].map((index) => ({
    id: `private-id-${index}`,
    index,
    role: index === observer ? role : 'unknown',
    features: {},
  }));
  const mission = (index: number, team: number[], fails: number, result: string | null = 'fail') => ({
    type: 'mission',
    index,
    result,
    fails,
    settings: { players: team.length, failsRequired: 1 },
    actions: team.map((seat) => ({ playerID: `private-id-${seat}`, value: seat === observer ? card : undefined })),
  });
  const state = {
    stage: 'selectTeam',
    mission: 2,
    vote: 0,
    players,
    history: [
      mission(0, [1, 2], 1),
      { type: 'vote', result: 'reject', team: [{ id: 'private-id-5' }, { id: 'private-id-6' }], votes: [] },
      mission(1, [2, 3, 4], 2),
      mission(2, [5, 6, 7], 2, null),
    ],
  } as unknown as VisualGameState;
  expect(compactRequest({ ...request, playerID: `private-id-${observer}`, state }).tableConventions).toEqual({
    includeSelfInProposals: false,
    excludedPartners: [],
  });
});

test.each([
  { team: [1, 2], fails: 0, result: 'success' },
  { team: [1, 2], fails: 2, result: 'fail' },
  { team: [1, 2, 3], fails: 1, result: 'fail' },
  { team: [1, 2, 3], fails: 3, result: 'fail' },
  { team: [1, 2, 3, 4], fails: 2, result: 'fail' },
])('other mission shapes do not impose partner exclusions: $team / $fails Fail', ({ team, fails, result }) => {
  const state = {
    ...openingRequest('servant', true).state,
    players: [1, 2, 3, 4, 5, 6, 7].map((index) => ({
      id: String(index),
      index,
      role: index === 1 ? 'servant' : 'unknown',
      features: {},
    })),
    history: [
      {
        type: 'mission',
        index: 0,
        result,
        fails,
        settings: { players: team.length, failsRequired: 1 },
        actions: team.map((index) => ({ playerID: String(index) })),
      },
    ],
  } as unknown as VisualGameState;
  expect(compactRequest({ ...request, playerID: '1', state }).tableConventions).toEqual({
    includeSelfInProposals: false,
    excludedPartners: [],
  });
});

test('opening action facts report participation without prescribing a self preference', () => {
  for (const r of [
    openingRequest('servant', false),
    openingRequest('servant', true),
    openingRequest('mordred', false),
    openingRequest('servant', false, 3),
  ]) {
    const facts = compactRequest(r).actionFacts!;
    expect(facts.youAreOnTeam).toBe(facts.team.includes(facts.yourSeat));
    expect(facts).not.toHaveProperty('openingSelfPreference');
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
    },
  });
});

test('review parser allows 800 characters only with the explicit review limit', () => {
  const text = JSON.stringify({ choice: 0, speech: 'x'.repeat(800) });
  expect(() => parseReply(text, 1)).toThrow();
  expect(parseReply(text, 1, 800).speech).toHaveLength(800);
  expect(() => parseReply(JSON.stringify({ choice: 0, speech: 'x'.repeat(801) }), 1, 800)).toThrow();
});

test('Oberon uses Evil action facts without inventing hidden allies', () => {
  const current = {
    ...request,
    state: {
      stage: 'onMission',
      mission: 0,
      settings: { missions: [{ failsRequired: 1 }] },
      players: [
        { id: 'bot', index: 1, role: 'oberon', features: { isSent: true } },
        { id: 'other', index: 2, role: 'unknown', features: { isSent: true } },
      ],
      history: [],
    },
  } as unknown as BotRequest;
  const context = compactRequest(current);
  expect(context.you?.side).toBe('evil');
  expect(context.actionFacts?.knownEvilOnTeam).toEqual([1]);
  expect(context.actionFacts?.unresolvedOnTeam).toEqual([2]);
  expect(context.roleAdvice).toContain('do not know your allies');
});
