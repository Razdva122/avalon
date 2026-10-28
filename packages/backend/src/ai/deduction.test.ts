import fixture from './fixtures/decisive-match.json';
import { buildAnalysis } from './analysis';
import {
  codeVote,
  echoedPhrase,
  failWish,
  guardDecision,
  merlinSpeechExposure,
  restatedRoster,
  servantLikeVote,
  stalePhrases,
  usedStalePhrases,
} from './guards';
import { decisionPipeline } from './pipeline';
import { speakerContext } from './speaker';
import { evilProbability, maskOf, missionFailChance, observerKnowledge, parseGame, worlds } from './deduction';
import type { BotRequest } from './client';
import type { VisualGameState } from '@avalon/types';

type Event = Record<string, unknown>;
const missionsFor: Record<number, [number, number][]> = {
  5: [
    [2, 1],
    [3, 1],
    [2, 1],
    [3, 1],
    [3, 1],
  ],
  7: [
    [2, 1],
    [3, 1],
    [3, 1],
    [4, 2],
    [4, 1],
  ],
};

function game(options: {
  players: number;
  observer: number;
  roles: Record<number, string>;
  history: Event[];
  stage: string;
  mission: number;
  vote?: number;
  leader?: number;
  team?: number[];
  lineup?: { good: string[]; evil: string[] };
}): BotRequest {
  const seats = Array.from({ length: options.players }, (_, i) => i + 1);
  const evil = options.players >= 7 ? 3 : 2;
  const state = {
    stage: options.stage,
    mission: options.mission,
    vote: options.vote ?? 0,
    players: seats.map((seat) => ({
      id: String(seat),
      index: seat,
      name: String(seat),
      role: options.roles[seat] ?? 'unknown',
      features: {
        isLeader: seat === (options.leader ?? 1),
        isSelected: (options.team || []).includes(seat),
        isSent: false,
      },
    })),
    settings: {
      players: { good: options.players - evil, evil },
      roles: options.lineup ?? {
        good: ['merlin', 'percival', ...Array(options.players - evil - 2).fill('servant')],
        evil: options.players >= 7 ? ['mordred', 'morgana', 'oberon'] : ['mordred', 'morgana'],
      },
      missions: missionsFor[options.players].map(([players, failsRequired]) => ({ players, failsRequired })),
    },
    history: options.history,
  } as unknown as VisualGameState;
  return {
    playerID: String(options.observer),
    name: String(options.observer),
    style: '',
    task: '',
    speak: false,
    state,
    chat: [],
    choices:
      options.stage === 'votingForTeam'
        ? ['approve', 'reject']
        : options.stage === 'onMission'
          ? ['fail', 'success']
          : [],
  };
}

const servantOptions = () => ({
  players: 5,
  observer: 3,
  roles: { 3: 'servant' } as Record<number, string>,
  history: [vote(1, [3, 4], [1, 3, 4], 5), mission(0, [3, 4], 1, 3)],
  stage: 'votingForTeam',
  mission: 1,
  team: [1, 2, 4],
});
const vote = (leader: number, team: number[], approvers: number[], players: number, result?: string): Event => ({
  type: 'vote',
  leaderID: String(leader),
  team: team.map((seat) => ({ id: String(seat) })),
  result: result ?? (approvers.length > players / 2 ? 'approve' : 'reject'),
  forced: false,
  votes: Array.from({ length: players }, (_, i) => ({
    playerID: String(i + 1),
    value: approvers.includes(i + 1) ? 'approve' : 'reject',
  })),
});
const mission = (index: number, team: number[], fails: number, observer?: number, card = 'success'): Event => ({
  type: 'mission',
  index,
  leaderID: String(team[0]),
  settings: { players: team.length, failsRequired: 1 },
  result: fails ? 'fail' : 'success',
  fails,
  actions: team.map((seat) =>
    seat === observer ? { playerID: String(seat), value: card } : { playerID: String(seat) },
  ),
});

test('own Success on a failed pair proves the partner Evil', () => {
  const request = game({
    players: 5,
    observer: 1,
    roles: { 1: 'servant' },
    history: [vote(1, [1, 2], [1, 2, 3], 5), mission(0, [1, 2], 1, 1)],
    stage: 'selectTeam',
    mission: 1,
  });
  const analysis = buildAnalysis(request)!;
  expect(analysis.seats).toContainEqual({ seat: 2, evilChance: 100, status: 'provenEvil' });
  // The partner's guilt is private: the public cannot see seat 1's card.
  expect((analysis.publicView as { seats: { seat: number; evilChance: number }[] }).seats[1].evilChance).toBeLessThan(
    100,
  );
});

test('saved decisive position: the server finds the clean roster and the losing approvals', () => {
  for (const id of ['m5-gambler-vote', 'm5-accuser-vote']) {
    const request = structuredClone(fixture.cases.find((c) => c.id === id)!.request) as unknown as BotRequest;
    const analysis = buildAnalysis(request) as {
      stakes: string;
      teams: { safest: { team: string; failRisk: number }[]; proposed: { failRisk: number } };
    };
    expect(analysis.stakes).toContain('Evil wins immediately');
    expect(analysis.teams.safest[0].team).toBe('2, 4, 5, 6');
    expect(analysis.teams.safest[0].failRisk).toBeLessThan(5);
    expect(analysis.teams.proposed.failRisk).toBeGreaterThan(80);
    expect(guardDecision(request, 'approve')).toMatchObject({ choice: 'reject' });
    expect(guardDecision(request, 'reject')).toBeUndefined();
  }
});

test('a Success at 0-2 strongly clears its participants while a 2-seat opener barely does', () => {
  const late = game({
    players: 5,
    observer: 5,
    roles: { 5: 'servant' },
    history: [mission(0, [1, 2], 1), mission(1, [3, 4, 5], 1, 5), mission(2, [1, 3], 0)],
    stage: 'selectTeam',
    mission: 3,
  });
  const parsed = parseGame(late.state, '5');
  const all = worlds(parsed, observerKnowledge(late.state, '5', []));
  // Exactly one of 1/2 and one of 3/4 is Evil; the 0-2 Success on [1, 3] points at 2 and 4.
  expect(evilProbability(all, 2)).toBeGreaterThan(0.85);
  expect(evilProbability(all, 4)).toBeGreaterThan(0.85);
  const early = game({
    players: 5,
    observer: 5,
    roles: { 5: 'servant' },
    history: [mission(0, [1, 2], 0)],
    stage: 'selectTeam',
    mission: 1,
  });
  const opener = worlds(parseGame(early.state, '5'), observerKnowledge(early.state, '5', []));
  expect(evilProbability(opener, 1)).toBeGreaterThan(0.4);
});

test('Good bot Lady announcements are truthful constraints; human ones are only testimony', () => {
  const history: Event[] = [
    mission(0, [1, 2], 0),
    mission(1, [1, 2, 3], 0),
    { type: 'announceLoyalty', announcerID: '3', targetID: '4', announced: 'evil' },
  ];
  const request = game({ players: 7, observer: 7, roles: { 7: 'servant' }, history, stage: 'selectTeam', mission: 2 });
  const parsed = parseGame(request.state, '7');
  const hard = worlds(parsed, observerKnowledge(request.state, '7', []), { behaviour: false });
  // If 3 is Good, 4 must be Evil: no world has both 3 and 4 Good.
  expect(hard.every((world) => world.evil & maskOf([3, 4]))).toBe(true);
  const human = worlds(parsed, observerKnowledge(request.state, '7', [3]), { behaviour: false });
  expect(human.some((world) => !(world.evil & maskOf([3, 4])))).toBe(true);
});

test('guards: Evil fails at match point and never wastes a lone Fail on a two-Fail mission', () => {
  const failing = game({
    players: 5,
    observer: 4,
    roles: { 4: 'morgana', 5: 'evil' },
    history: [mission(0, [1, 4], 1), mission(1, [2, 3, 5], 1), mission(2, [1, 2], 0)],
    stage: 'onMission',
    mission: 3,
    team: [1, 2, 4],
  });
  expect(guardDecision(failing, 'success')).toMatchObject({ choice: 'fail' });
  expect(guardDecision(failing, 'fail')).toBeUndefined();
  const twoFail = game({
    players: 7,
    observer: 4,
    roles: { 4: 'morgana', 5: 'evil', 6: 'evil' },
    lineup: { good: ['merlin', 'percival', 'servant', 'servant'], evil: ['mordred', 'morgana', 'minion'] },
    history: [mission(0, [1, 2], 0), mission(1, [1, 5, 7], 1), mission(2, [1, 2, 7], 0)],
    stage: 'onMission',
    mission: 3,
    team: [1, 2, 3, 4],
  });
  // Mission 4 needs two Fails and seat 4 is the only Evil on it: a Fail only exposes Morgana.
  expect(guardDecision(twoFail, 'fail')).toMatchObject({ choice: 'success' });
  expect(guardDecision(twoFail, 'success')).toBeUndefined();
  // The Good partner on a two-seat opener would know exactly who failed it; a three-seat mission keeps the choice.
  const opener = (team: number[], mission = 0) =>
    game({ players: 7, observer: 3, roles: { 3: 'oberon' }, history: [], stage: 'onMission', mission, team });
  expect(guardDecision(opener([1, 3]), 'fail')).toMatchObject({ choice: 'success' });
  expect(guardDecision(opener([1, 3]), 'success')).toBeUndefined();
  expect(guardDecision(opener([1, 2, 3], 1), 'fail')).toBeUndefined();
});

test('guards: with more known Evil on a mission than Fails needed, only the lowest seats fail', () => {
  const card = (observer: number, roles: Record<number, string>, history: Event[], mission: number, team: number[]) =>
    game({ players: 7, observer, roles, history, stage: 'onMission', mission, team });
  const opening = [mission(0, [1, 2], 0)];
  // Seats 4 and 5 see each other on 2, 4, 5: seat 4 plays the Fail, seat 5 passes.
  const high = card(5, { 4: 'morgana', 5: 'mordred' }, opening, 1, [2, 4, 5]);
  expect(guardDecision(high, 'fail')).toMatchObject({
    choice: 'success',
    reason: expect.stringContaining('convention'),
  });
  expect(guardDecision(high, 'success')).toBeUndefined();
  expect(guardDecision(card(4, { 4: 'morgana', 5: 'mordred' }, opening, 1, [2, 4, 5]), 'fail')).toBeUndefined();
  // A Fail that wins the game exposes nobody, so both may fail.
  const matchPoint = [mission(0, [1, 4], 1), mission(1, [2, 5, 6], 1)];
  expect(guardDecision(card(5, { 4: 'morgana', 5: 'mordred' }, matchPoint, 2, [3, 4, 5]), 'fail')).toBeUndefined();
  // Mission 4 needs two Fails: with three Evil on it, 4 and 5 fail and 6 passes, even at two Good successes.
  const late = [mission(0, [1, 2], 0), mission(1, [1, 4, 7], 1), mission(2, [1, 2, 3], 0)];
  const three = { 4: 'morgana', 5: 'mordred', 6: 'minion' };
  const lineup = { good: ['merlin', 'percival', 'servant', 'servant'], evil: ['mordred', 'morgana', 'minion'] };
  const fourth = (observer: number) =>
    game({
      players: 7,
      observer,
      roles: three,
      lineup,
      history: late,
      stage: 'onMission',
      mission: 3,
      team: [1, 4, 5, 6],
    });
  expect(guardDecision(fourth(6), 'fail')).toMatchObject({ choice: 'success' });
  expect(guardDecision(fourth(5), 'success')).toMatchObject({ choice: 'fail' });
  // Oberon sees nobody, so it is outside the convention.
  expect(guardDecision(card(5, { 5: 'oberon' }, opening, 1, [2, 4, 5]), 'fail')).toBeUndefined();
  // The server cannot play a human's card: with human seat 4 designated, bot 5's choice stays open, and at two Good
  // successes its Fail is the last chance (review of PR #18).
  const withHuman = (history: Event[], mission: number, team: number[]) => ({
    ...card(5, { 4: 'morgana', 5: 'mordred' }, history, mission, team),
    humanPlayerIDs: ['4'],
  });
  expect(guardDecision(withHuman(opening, 1, [2, 4, 5]), 'fail')).toBeUndefined();
  const twoSuccesses = [mission(0, [1, 2], 0), mission(1, [1, 2, 3], 0)];
  expect(guardDecision(withHuman(twoSuccesses, 2, [1, 4, 5]), 'fail')).toBeUndefined();
  expect(guardDecision(withHuman(twoSuccesses, 2, [1, 4, 5]), 'success')).toMatchObject({ choice: 'fail' });
  expect(buildAnalysis(withHuman(opening, 1, [2, 4, 5]))?.missionCard).toMatchObject({
    convention: expect.stringContaining('4 is human and may not follow it'),
  });
});

test('guards: before any failure Merlin votes as a Servant would; afterwards its choice stands', () => {
  const opening = [vote(1, [1, 2], [1, 2, 3], 5), mission(0, [1, 2], 0)];
  const merlin = (team: number[], history = opening) =>
    game({
      players: 5,
      observer: 3,
      roles: { 3: 'merlin', 4: 'evil' },
      history,
      stage: 'votingForTeam',
      mission: 1,
      team,
    });
  // Off-team: Servants reject, so an accurate-looking approval of a clean team would stand out.
  expect(guardDecision(merlin([1, 2, 5]), 'approve')).toMatchObject({ choice: 'reject' });
  expect(guardDecision(merlin([1, 2, 5]), 'reject')).toBeUndefined();
  // On-team near-best roster: a Servant approves even though Merlin sees 4.
  expect(guardDecision(merlin([3, 4, 5]), 'reject')).toMatchObject({ choice: 'approve' });
  // After a failure only the cheap cover remains: rejecting like a Servant, never approving known Evil.
  const afterFailure = [vote(1, [1, 4], [1, 2, 4], 5), mission(0, [1, 4], 1)];
  expect(guardDecision(merlin([2, 4, 5], afterFailure), 'reject')).toBeUndefined();
  expect(guardDecision(merlin([1, 2, 5], afterFailure), 'approve')).toMatchObject({ choice: 'reject' });
  const servant = game({
    players: 5,
    observer: 3,
    roles: { 3: 'servant' },
    history: [vote(1, [3, 4], [1, 3, 4], 5), mission(0, [3, 4], 1, 3)],
    stage: 'votingForTeam',
    mission: 1,
    team: [1, 2, 4],
  });
  expect(guardDecision(servant, 'approve')).toMatchObject({ choice: 'reject' });
  process.env.AI_DECISION_GUARDS = 'off';
  try {
    expect(guardDecision(servant, 'approve')).toBeUndefined();
  } finally {
    delete process.env.AI_DECISION_GUARDS;
  }
});

test('code votes: at a bot-only table a Good seat votes from the deduction engine without a model call', async () => {
  const servant = game(servantOptions());
  // Seat 3 played Success on the failed pair, so 4 is proven Evil.
  expect(codeVote(servant)).toBe('reject');
  const generate = jest.fn();
  expect(await decisionPipeline(generate)(servant)).toMatchObject({ choice: 1, speech: '' });
  expect(generate).not.toHaveBeenCalled();
  // With a human seated a Servant still votes from the engine; only Merlin asks the model, for its cover.
  const withHuman = { ...game(servantOptions()), humanPlayerIDs: ['5'] };
  expect(await decisionPipeline(generate)(withHuman)).toMatchObject({ choice: 1, speech: '' });
  expect(generate).not.toHaveBeenCalled();
  // Before the fourth proposal Merlin's off-team vote is the Servant cover vote either way, so it needs no call.
  const merlin = { ...game({ ...servantOptions(), roles: { 3: 'merlin', 4: 'evil' } }), humanPlayerIDs: ['5'] };
  expect(await decisionPipeline(generate)(merlin)).toMatchObject({ choice: 1, speech: '' });
  expect(generate).not.toHaveBeenCalled();
  const late = { ...game({ ...servantOptions(), roles: { 3: 'merlin', 4: 'evil' }, vote: 3 }), humanPlayerIDs: ['5'] };
  await decisionPipeline(generate)(late).catch(() => undefined);
  expect(generate).toHaveBeenCalled();
  generate.mockClear();
  const evil = game({ ...servantOptions(), roles: { 4: 'morgana', 5: 'evil' }, observer: 4 });
  await decisionPipeline(generate)(evil).catch(() => undefined);
  expect(generate).toHaveBeenCalled();
});

test('assassination ranks the player who rejected publicly safe teams with visible Evil', () => {
  // Evil: 4 (Morgana) and 5 (Mordred). Seat 1 keeps rejecting teams with 4; seat 2 approves everything.
  const history: Event[] = [
    vote(2, [2, 4], [2, 3, 4], 5),
    mission(0, [2, 4], 0),
    vote(3, [3, 4, 5], [2, 3, 4, 5], 5),
    mission(1, [3, 4, 5], 1),
    vote(4, [2, 3, 4], [2, 3, 4], 5),
    mission(2, [2, 3, 4], 0),
    vote(5, [1, 2, 5], [1, 2, 5], 5),
    mission(3, [1, 2, 5], 0),
  ];
  const request = game({
    players: 5,
    observer: 4,
    roles: { 4: 'morgana', 5: 'mordred' },
    history,
    stage: 'assassinate',
    mission: 3,
  });
  request.choices = ['1', '2', '3'];
  const analysis = buildAnalysis(request) as { merlinCandidates: { seat: number; merlinChance: number }[] };
  expect(analysis.merlinCandidates[0].seat).toBe(1);
});

test('assassination guard: a shot far below the top Merlin candidate goes to that candidate', async () => {
  // Same table: seat 1 rejected every roster with Morgana (4); seat 2 approved them all.
  const history: Event[] = [
    vote(2, [2, 4], [2, 3, 4], 5),
    mission(0, [2, 4], 0),
    vote(3, [3, 4, 5], [2, 3, 4, 5], 5),
    mission(1, [3, 4, 5], 1),
    vote(4, [2, 3, 4], [2, 3, 4], 5),
    mission(2, [2, 3, 4], 0),
    vote(5, [1, 2, 5], [1, 2, 5], 5),
    mission(3, [1, 2, 5], 0),
  ];
  const request = game({
    players: 5,
    observer: 4,
    roles: { 4: 'morgana', 5: 'mordred' },
    history,
    stage: 'assassinate',
    mission: 3,
  });
  request.choices = ['1', '2', '3'];
  const ranked = (buildAnalysis(request) as { merlinCandidates: { seat: number; merlinChance: number }[] })
    .merlinCandidates;
  const chance = (seat: number) => ranked.find((candidate) => candidate.seat === seat)!.merlinChance;
  expect(chance(2) * 2).toBeLessThan(chance(1));
  expect(guardDecision(request, '2')).toMatchObject({ choice: '1' });
  expect(guardDecision(request, '1')).toBeUndefined();
  // Council advice is the model's own argument; only the final shot is checked.
  expect(guardDecision({ ...request, councilDiscussion: true }, '2')).toBeUndefined();
  const reply = await decisionPipeline(async () => ({ choice: 1, speech: '2 approved every roster.', evidence: [] }))(
    request,
  );
  expect(request.choices[reply.choice]).toBe('1');
});

test('analysis: Lady announcements report what Merlin can see about the checked seat', () => {
  const announce = (observer: number, roles: Record<number, string>) => {
    const request = game({
      players: 7,
      observer,
      roles,
      history: [
        vote(1, [1, 2], [1, 2, 3], 7),
        mission(0, [1, 2], 0),
        vote(2, [2, 3, 4], [2, 3, 4], 7),
        mission(1, [2, 3, 4], 1),
      ],
      stage: 'announceLoyalty',
      mission: 2,
      team: [6],
    });
    request.choices = ['good', 'evil'];
    request.privateCheck = 'evil';
    return (buildAnalysis(request)?.announcement as { merlinSeesTargetAsEvil: unknown }).merlinSeesTargetAsEvil;
  };
  // Mordred cannot see Oberon, but an Evil result on an unseen seat can only be Oberon, whom Merlin sees.
  expect(announce(2, { 2: 'mordred', 5: 'morgana' })).toBe(true);
  // Morgana sees Mordred, who is hidden from Merlin.
  expect(announce(5, { 5: 'morgana', 6: 'mordred' })).toBe(false);
  // Oberon sees nobody, so the checked Evil seat may be Mordred.
  expect(announce(7, { 7: 'oberon' })).toMatch(/unknown/);
});

test('guards: Merlin speech that doubts unsuspected visible Evil is flagged', () => {
  const merlin = (history: Event[]) =>
    game({
      players: 7,
      observer: 4,
      roles: { 4: 'merlin', 6: 'evil', 7: 'evil' },
      history,
      stage: 'votingForTeam',
      mission: history.length ? 1 : 0,
      team: [1, 4],
    });
  // Before any mission a Servant has no reason to single out 6.
  expect(merlinSpeechExposure(merlin([]), 'Keep the clean start, but leave 6 out.')).toEqual([6]);
  expect(merlinSpeechExposure(merlin([]), 'Start with 1 and 2.')).toBeUndefined();
  // A seat at the end of a sentence still counts; decimals do not.
  expect(merlinSpeechExposure(merlin([]), 'Take me rather than 6.')).toEqual([6]);
  expect(merlinSpeechExposure(merlin([]), 'Odds are 6.5 to 1, or 0,6 at best.')).toBeUndefined();
  // Once 6 sat on a failed pair with a cleared seat, the public record supports the doubt.
  const failed = [vote(1, [1, 6], [1, 6], 7), mission(0, [1, 6], 1)];
  const cleared = [vote(2, [1, 2], [1, 2], 7), mission(0, [1, 2], 0), ...failed];
  expect(merlinSpeechExposure(merlin(cleared), 'Leave 6 out.')).toBeUndefined();
  // Not Merlin: never flagged.
  const servant = game({
    players: 7,
    observer: 4,
    roles: { 4: 'servant' },
    history: [],
    stage: 'votingForTeam',
    mission: 0,
    team: [1, 4],
  });
  expect(merlinSpeechExposure(servant, 'Leave 6 out.')).toBeUndefined();
});

test('speech: a line copied from recent chat is flagged, shared game vocabulary is not', () => {
  const request = game(servantOptions());
  request.chat = [
    { name: '2', text: '2, 3, 5 already delivered a clean success; keep that core.' },
    { name: '4', text: '5 rejected the failed team, so I trust them more.' },
  ];
  expect(echoedPhrase(request, 'Keep them: they already delivered a clean success.')).toBe(
    'already delivered a clean success',
  );
  expect(echoedPhrase(request, 'I also rejected the failed team.')).toBeUndefined();
  expect(echoedPhrase(request, 'Take 2, 3, 5.')).toBeUndefined();
});

test('guards: Evil never spends the Lady on an ally it already knows', () => {
  const lady = game({
    players: 7,
    observer: 4,
    roles: { 4: 'mordred', 2: 'evil' },
    history: [],
    stage: 'checkLoyalty',
    mission: 2,
  });
  lady.choices = ['1', '2', '3', '5', '6'];
  expect(guardDecision(lady, '2')).toMatchObject({ reason: expect.stringContaining('known ally') });
  expect(guardDecision(lady, '2')!.choice).not.toBe('2');
  expect(guardDecision(lady, '5')).toBeUndefined();
  const servant = game({
    players: 7,
    observer: 4,
    roles: { 4: 'servant' },
    history: [],
    stage: 'checkLoyalty',
    mission: 2,
  });
  servant.choices = ['1', '2', '3', '5', '6'];
  expect(guardDecision(servant, '2')).toBeUndefined();
});

test('guards: an Evil leader does not send a guilty-looking roster when a cleaner one can fail as well', () => {
  // Seat 5 sat on the failed pair while 2, 3 and 4 passed a mission, so 4, 5, 6 looks guilty; Morgana (4) can carry
  // the Fail on the cleared-looking 2, 3, 4.
  const leader = game({
    players: 7,
    observer: 4,
    roles: { 4: 'morgana', 5: 'evil', 7: 'evil' },
    history: [mission(0, [1, 5], 1), mission(1, [2, 3, 4], 0)],
    stage: 'selectTeam',
    mission: 2,
    leader: 4,
  });
  leader.choices = ['4, 5, 6', '1, 3, 4', '2, 3, 4', '1, 2, 3'];
  const guard = guardDecision(leader, '4, 5, 6');
  expect(guard).toMatchObject({ choice: '2, 3, 4', reason: expect.stringContaining('can fail just as well') });
  expect(guardDecision(leader, '2, 3, 4')).toBeUndefined();
  // At two failures every roster looks risky to the table, so a guilty-looking one is not much worse.
  const late = game({
    players: 7,
    observer: 4,
    roles: { 4: 'morgana', 5: 'evil', 7: 'evil' },
    history: [mission(0, [1, 5], 1), mission(1, [2, 5, 6], 1)],
    stage: 'selectTeam',
    mission: 2,
    leader: 4,
  });
  late.choices = leader.choices;
  expect(guardDecision(late, '4, 5, 6')).toBeUndefined();
});

test('guards: Evil does not approve a team it is not on unless allies on it can fail it', () => {
  // A Servant in seat 4 would reject 1, 2, 3 (it is off the team and has no reason to trust it): approving is a tell.
  const offTeam = (roles: Record<number, string>, team: number[], index = 1) =>
    game({
      players: 7,
      observer: 4,
      roles,
      history: index ? [mission(0, [6, 7], 0)] : [],
      stage: 'votingForTeam',
      mission: index,
      team,
    });
  expect(guardDecision(offTeam({ 4: 'morgana', 5: 'evil' }, [1, 2, 3]), 'approve')).toMatchObject({
    choice: 'reject',
    reason: expect.stringContaining('classic Evil tell'),
  });
  expect(guardDecision(offTeam({ 4: 'oberon' }, [1, 2, 3]), 'approve')).toMatchObject({ choice: 'reject' });
  // An ally on the team can fail it, and an Evil seat on the team may approve its own team.
  expect(guardDecision(offTeam({ 4: 'morgana', 5: 'evil' }, [1, 2, 5]), 'approve')).toBeUndefined();
  expect(guardDecision(offTeam({ 4: 'morgana', 5: 'evil' }, [1, 2, 4]), 'approve')).toBeUndefined();
  expect(guardDecision(offTeam({ 4: 'morgana', 5: 'evil' }, [1, 2, 3]), 'reject')).toBeUndefined();
  // Mission 1 has no off-team pattern to copy: human Good players approve the opener.
  expect(guardDecision(offTeam({ 4: 'morgana', 5: 'evil' }, [1, 2], 0), 'approve')).toBeUndefined();
  // A leader who sat out still backs its own roster.
  const own = game({
    players: 7,
    observer: 4,
    roles: { 4: 'morgana', 5: 'evil' },
    history: [mission(0, [6, 7], 0)],
    stage: 'votingForTeam',
    mission: 1,
    team: [1, 2, 3],
    leader: 4,
  });
  expect(guardDecision(own, 'approve')).toBeUndefined();
});

test('guards: an Evil leader always puts itself on its own team', () => {
  const leader = (history: Record<string, unknown>[]) => {
    const request = game({
      players: 7,
      observer: 4,
      roles: { 4: 'morgana', 5: 'evil', 7: 'evil' },
      history,
      stage: 'selectTeam',
      mission: 1,
      leader: 4,
    });
    request.choices = ['1, 2, 5', '1, 2, 4', '1, 4, 5', '2, 4, 5', '1, 2, 3'];
    return request;
  };
  const clean = leader([mission(0, [1, 2], 0)]);
  const guard = guardDecision(clean, '1, 2, 5');
  expect(guard).toMatchObject({ reason: expect.stringContaining('leaves themselves off') });
  expect(guard!.choice.split(', ')).toContain('4');
  expect(guardDecision(clean, guard!.choice)).toBeUndefined();
  // Even a leader who sat on a failed pair goes; it can fail the roster itself, so the ally may stay off.
  const suspect = leader([mission(0, [3, 4], 1)]);
  const swap = guardDecision(suspect, '1, 2, 5');
  expect(swap!.choice.split(', ')).toContain('4');
  expect(guardDecision(suspect, swap!.choice)).toBeUndefined();
});

test('guards: a Good leader always puts itself on its own team, in place of the riskiest member', () => {
  // Seats 3 and 4 sat on a failed pair; the Servant leader 1 proposes 2, 3 and 6 without itself.
  const request = game({
    players: 7,
    observer: 1,
    roles: { 1: 'servant' },
    history: [mission(0, [3, 4], 1)],
    stage: 'selectTeam',
    mission: 1,
    leader: 1,
  });
  request.choices = ['2, 3, 6', '1, 2, 6', '1, 2, 3', '1, 3, 6', '2, 5, 6'];
  expect(guardDecision(request, '2, 3, 6')).toMatchObject({
    choice: '1, 2, 6',
    reason: expect.stringContaining('leaves themselves off'),
  });
  expect(guardDecision(request, '1, 2, 6')).toBeUndefined();
});

test('pipeline: when a guard replaces the roster of an admitting Evil leader, the admission matches the published words', async () => {
  // Morgana leads and leaves herself off; the guard puts her on 1, 2, 6 (review of PR #18).
  const table = (stage = 'selectTeam') => ({
    ...game({
      players: 7,
      observer: 1,
      roles: { 1: 'morgana', 5: 'mordred' },
      history: [mission(0, [3, 4], 1)],
      stage,
      mission: 1,
      leader: 1,
      team: stage === 'selectTeam' ? [] : [1, 2, 6],
    }),
    speak: stage === 'selectTeam',
    ...(stage === 'selectTeam' ? { choices: ['2, 3, 6', '1, 2, 6', '1, 2, 3', '1, 3, 6', '2, 5, 6'] } : {}),
  });
  const plan = {
    mode: 'direct' as const,
    promotedSeat: 5,
    desiredSeat: 5,
    audienceSeat: 6,
    rationale: '6 still follows my lead on rosters.',
    reconsiderWhen: '6 stops following my rosters.',
  };
  const admits = (choice: number) => ({
    choice,
    speech: 'My cover is gone.',
    publicReason: 'Fine, I am evil. This team still deserves a look.',
    admitEvil: true,
    exposedStrategy: plan,
    evidence: [],
  });
  const run = async (admission?: ReturnType<typeof admits>) => {
    const contexts: Record<string, unknown>[] = [];
    const decide = decisionPipeline(async (request, options) => {
      contexts.push(options.context as Record<string, unknown>);
      if (options.phase === 'decision')
        return request.publicDiscussion ? { choice: 0, speech: 'Talk.', evidence: [] } : admits(0);
      if (options.phase === 'admission' && admission) return admission;
      throw Error('optional call unavailable');
    });
    const reply = await decide(table());
    // The next turn: a discussion before the following proposal.
    await decide({ ...table(), publicDiscussion: true });
    return { reply, next: contexts[contexts.length - 1] };
  };
  // Every optional call unavailable: the substituted roster goes out without the admission, which waits.
  const unavailable = await run();
  expect(table().choices[unavailable.reply.choice]).toBe('1, 2, 6');
  expect(unavailable.reply.speech).not.toMatch(/evil/i);
  expect(unavailable.next.publicEvilAdmissions).toEqual([]);
  expect(unavailable.next).not.toHaveProperty('exposedEvil');
  // An admission for the server's roster is published with it.
  const again = await run(admits(1));
  expect(table().choices[again.reply.choice]).toBe('1, 2, 6');
  expect(again.reply.speech).toContain('I am evil');
  expect(again.next.publicEvilAdmissions).toEqual([1]);
  expect(again.next.exposedEvil).toEqual({ admitted: true, plan });
  // One for another roster is not taken.
  const elsewhere = await run(admits(2));
  expect(elsewhere.reply.speech).not.toMatch(/evil/i);
  expect(elsewhere.next.publicEvilAdmissions).toEqual([]);
});

test('pipeline: a withheld line records none of its claims', async () => {
  // Percival leads the opener and claims Morgana, but the line also invents a vote, so it is withheld.
  const table = (observer: number, stage: string) => ({
    ...game({
      players: 7,
      observer,
      roles: { 3: 'percival', 5: 'morgana' },
      history: [],
      stage,
      mission: 0,
      leader: 3,
      team: stage === 'selectTeam' ? [] : [3, 6],
    }),
    speak: stage === 'selectTeam',
    ...(stage === 'selectTeam' ? { choices: ['3, 6', '1, 3', '3, 5'] } : {}),
  });
  const requests: BotRequest[] = [];
  const decide = decisionPipeline(async (request, options) => {
    requests.push(request);
    if (options.phase !== 'decision') throw Error('optional call unavailable');
    return request.state.stage === 'selectTeam'
      ? {
          choice: 0,
          speech: 'Claim Percival.',
          publicReason: 'I am Percival. 1 is Morgana. 4 approved earlier.',
          claimMorgana: 1,
          claimStances: [],
          evidence: [],
        }
      : { choice: 0, speech: 'Vote.', evidence: [] };
  });
  expect((await decide(table(3, 'selectTeam'))).speech).toBe('');
  await decide(table(5, 'votingForTeam'));
  expect(requests[requests.length - 1].publicRoleClaims ?? []).toEqual([]);
});

test('speech: a long restatement of a proposal two players already backed is flagged, new points are not', () => {
  const request = {
    ...game({ players: 7, observer: 5, roles: { 5: 'servant' }, history: [], stage: 'selectTeam', mission: 0 }),
    publicDiscussion: true,
    chat: [
      { name: '1', text: "I'd start with 1 and 3." },
      { name: '2', text: 'Fine with 1 and 3 as the opener.' },
      { name: '3', text: 'Happy to go with 1 and me.' },
    ],
  } as BotRequest;
  const long = 'No record separates the pairs yet, and 1 and 3 already have support. I am fine starting there.';
  expect(restatedRoster(request, long)).toBe('1,3');
  expect(restatedRoster(request, 'Sure, 1 and 3.')).toBeUndefined();
  expect(restatedRoster(request, long.replace('there.', 'there, but why did 2 reject earlier?'))).toBeUndefined();
  expect(restatedRoster(request, long.replace('1 and 3', '1 and 4'))).toBeUndefined();
  expect(restatedRoster({ ...request, publicDiscussion: false }, long)).toBeUndefined();
});

test('guards: a Good leader does not vote down its own proposal unless it likely fails', () => {
  const own = (team: number[], mission = 0, history: Record<string, unknown>[] = []) =>
    game({
      players: 7,
      observer: 1,
      roles: { 1: 'servant' },
      history,
      stage: 'votingForTeam',
      mission,
      leader: 1,
      team,
    });
  // A two-seat opener with itself on it is as safe as any: the leader keeps its own proposal.
  expect(guardDecision(own([1, 2]), 'reject')).toMatchObject({ choice: 'approve' });
  // Without itself the same leader rated the team worse than its best, so the rejection may stand.
  expect(guardDecision(own([2, 3]), 'reject')?.reason ?? '').not.toContain('You proposed');
  expect(guardDecision(own([1, 2]), 'approve')).toBeUndefined();
  // Seat 1 played Success on the failed pair with 2, so 2 is proven Evil and a one-Fail team with 2 can fail.
  expect(guardDecision(own([1, 2, 3], 1, [mission(0, [1, 2], 1, 1)]), 'reject')).toBeUndefined();
  const follower = game({
    players: 7,
    observer: 3,
    roles: { 3: 'servant' },
    history: [],
    stage: 'votingForTeam',
    mission: 0,
    leader: 1,
    team: [1, 2],
  });
  expect(guardDecision(follower, 'reject')?.reason ?? '').not.toContain('You proposed');
});

test('speech: an Evil bot wanting a Fail in public is flagged; a Good warning about Fails is not', () => {
  const seat = (role: string) =>
    game({ players: 7, observer: 5, roles: { 5: role }, history: [], stage: 'selectTeam', mission: 3 });
  // Both lines were said by Evil bots in a human-table match that Evil then won.
  expect(
    failWish(seat('mordred'), 'We need a team that can actually reach two Fails; let us not recycle it.'),
  ).toBeTruthy();
  expect(failWish(seat('oberon'), 'If we are taking a shot at two Fails, 5 is the obvious seat.')).toBeTruthy();
  expect(
    failWish(seat('mordred'), 'This roster could hold two Evil, and two Fails end the game. Reject.'),
  ).toBeUndefined();
  expect(failWish(seat('servant'), 'We need a team that can actually reach two Fails.')).toBeUndefined();
});

test('guards: at two failures Merlin may name the Evil it sees', () => {
  const merlin = (history: Record<string, unknown>[]) =>
    game({
      players: 7,
      observer: 1,
      roles: { 1: 'merlin', 3: 'evil', 7: 'evil' },
      history,
      stage: 'selectTeam',
      mission: 3,
    });
  const text = 'Keep 3 off this team.';
  expect(merlinSpeechExposure(merlin([]), text)).toEqual([3]);
  expect(merlinSpeechExposure(merlin([mission(0, [5, 7], 1), mission(1, [2, 6, 7], 1)]), text)).toBeUndefined();
});

test('a pair of Evil fails a decisive two-Fail mission almost surely', () => {
  const context = { failsRequired: 2, successesBefore: 1, failuresBefore: 1, first: false };
  expect(missionFailChance(2, context)).toBeCloseTo(0.75 ** 2);
  expect(missionFailChance(2, { ...context, failuresBefore: 2 })).toBeGreaterThan(0.9);
  expect(missionFailChance(1, { ...context, failuresBefore: 2 })).toBe(0);
});

test('speech: a phrase in three chat lines is worn out, game words alone are not', () => {
  const request = game({
    players: 7,
    observer: 2,
    roles: { 2: 'servant' },
    history: [],
    stage: 'selectTeam',
    mission: 1,
  });
  request.chat = [
    '1: Keep the clean team, the first mission passed.',
    '3: I like the clean team; first mission was fine.',
    '4: Clean team again, 1, 3 and 5. First mission passed.',
  ].map((text, i) => ({ id: String(i), name: text[0], text: text.slice(3) }));
  expect(stalePhrases(request).slice(1)).toEqual(['clean team', '"clean run" phrases']);
  expect(usedStalePhrases(request, 'Same clean team, why change it?')).toEqual(['clean team', '"clean run" phrases']);
  expect(usedStalePhrases(request, 'The first mission passed, so keep 1 and 3.')).toEqual([]);
});

test('guards: an Evil leader does not re-propose a roster the table voted down this mission', () => {
  // Mission 2: seat 2 proposed 2, 4, 5 and it was rejected 2-5; now Evil seat 4 leads.
  const history: Event[] = [mission(0, [1, 3], 0), vote(2, [2, 4, 5], [4, 5], 7)];
  const request = game({
    players: 7,
    observer: 4,
    roles: { 4: 'morgana', 5: 'mordred' },
    history,
    stage: 'selectTeam',
    mission: 1,
    vote: 1,
    leader: 4,
  });
  request.choices = ['2, 4, 5', '1, 4, 5', '3, 4, 6', '1, 3, 4'];
  const guard = guardDecision(request, '2, 4, 5');
  expect(guard).toMatchObject({ reason: expect.stringContaining('voted 2, 4, 5 down') });
  expect(guard!.choice).not.toBe('2, 4, 5');
  expect(guard!.choice.split(', ')).toContain('4');
  // The automatic fifth proposal still goes through, so repeating it there is allowed.
  expect(guardDecision({ ...request, state: { ...request.state, vote: 4 } }, '2, 4, 5')?.reason ?? '').not.toContain(
    'voted 2, 4, 5 down',
  );
});

test('guards: a roster substitution uses the exact legal text, which runs in seat order from the leader', () => {
  // Leader 6 lists rosters as "6, 1, 2"; a sorted "1, 2, 6" never matched, so the substitution was skipped.
  const request = game({
    players: 7,
    observer: 6,
    roles: { 6: 'servant' },
    history: [mission(0, [3, 4], 1)],
    stage: 'selectTeam',
    mission: 1,
    leader: 6,
  });
  request.choices = ['6, 7, 1', '6, 1, 2', '7, 1, 2', '1, 2, 3'];
  const guard = guardDecision(request, '7, 1, 2');
  expect(request.choices).toContain(guard!.choice);
  expect(guard!.choice.split(', ')).toContain('6');
});

test('guards: Oberon holds its Fail when the record already puts another Evil on a one-Fail roster', () => {
  // 2, 4 failed the opener without Oberon (5): one of them is Evil, and both are on this roster.
  const request = game({
    players: 7,
    observer: 5,
    roles: { 5: 'oberon' },
    history: [mission(0, [2, 4], 1)],
    stage: 'onMission',
    mission: 1,
    team: [2, 4, 5],
  });
  expect(guardDecision(request, 'fail')).toMatchObject({ choice: 'success' });
  // Alone among cleared seats it still decides for itself.
  const alone = game({
    players: 7,
    observer: 5,
    roles: { 5: 'oberon' },
    history: [mission(0, [2, 4], 1)],
    stage: 'onMission',
    mission: 1,
    team: [1, 3, 5],
  });
  expect(guardDecision(alone, 'fail')).toBeUndefined();
});

test('servant vote: before any mission an opener that likely passes is approved off-team', () => {
  const opener = game({
    players: 7,
    observer: 3,
    roles: { 3: 'servant' },
    history: [],
    stage: 'votingForTeam',
    mission: 0,
    team: [1, 2],
  });
  expect(codeVote(opener)).toBe('approve');
});

test('guards: Merlin cover never votes down a team Merlin sits on and sees as clean', () => {
  const vote = (team: number[]) =>
    game({
      players: 7,
      observer: 5,
      roles: { 5: 'merlin', 1: 'evil', 6: 'evil' },
      history: [mission(0, [3, 6], 1), mission(1, [1, 2, 4], 0)],
      stage: 'votingForTeam',
      mission: 2,
      team,
      vote: 1,
    });
  expect(servantLikeVote(vote([2, 3, 5]))).toBe('reject');
  expect(guardDecision(vote([2, 3, 5]), 'approve')).toBeUndefined();
  // Off the team, Merlin still votes like a Servant early on.
  expect(servantLikeVote(vote([2, 3, 4]))).toBe('reject');
  expect(guardDecision(vote([2, 3, 4]), 'approve')).toMatchObject({ choice: 'reject' });
});

test("speech: a seat with secret knowledge gets a Servant's reason for a vote that set it apart, for when asked", () => {
  const posture = (observer: number, roles: Record<number, string>, approvers: number[]) => {
    const request = game({
      players: 7,
      observer,
      roles,
      history: [vote(3, [3, 7], [1, 2, 3, 4, 5, 6, 7], 7), mission(0, [3, 7], 0), vote(3, [3, 5, 7], approvers, 7)],
      stage: 'selectTeam',
      mission: 1,
      leader: 4,
    });
    return String(speakerContext(request, { choice: 0, speech: '' }, {}, 'draft').plan?.posture);
  };
  // A Servant on 3, 5, 7 after 3 and 7 passed the opener would approve it; Merlin, seeing 7, rejected it.
  const merlin = posture(5, { 5: 'merlin', 6: 'evil', 7: 'evil' }, [1, 2, 3, 4, 6, 7]);
  expect(merlin).toContain('Your rejection of 3, 5, 7 stood out. Only if someone asks');
  // The seat Merlin "wanted on instead" is never one it knows is Evil.
  expect(merlin).not.toContain('wanted 6');
  expect(posture(5, { 5: 'merlin', 6: 'evil', 7: 'evil' }, [1, 2, 3, 4, 5, 6, 7])).not.toContain('stood out');
  // An Evil seat backing its ally's team, which a Servant off it would have voted down, gets the same kind of cover.
  expect(posture(6, { 6: 'morgana', 7: 'evil' }, [1, 2, 3, 4, 5, 6, 7])).toContain(
    'Your approval of 3, 5, 7 stood out. Only if someone asks about it, give a reason a Servant could have had: not wanting to burn a proposal.',
  );
  // Percival, who knows one of 3 and 7 is Morgana, voted down a team holding both; its excuse never names a wizard.
  const percival = posture(5, { 5: 'percival', 3: 'mysteryWizard', 7: 'mysteryWizard' }, [1, 2, 3, 4, 6, 7]);
  expect(percival).toContain('Your rejection of 3, 5, 7 stood out');
});

test("servant vote: on the fourth proposal a roster safer than an Evil fifth leader's is approved", () => {
  const fourth = (vote: number, leader: number) =>
    game({
      players: 7,
      observer: 1,
      roles: { 1: 'servant' },
      history: [
        mission(0, [1, 2], 0),
        mission(1, [1, 2, 3], 0),
        { type: 'announceLoyalty', announcerID: '3', targetID: '7', announced: 'evil' },
      ],
      stage: 'votingForTeam',
      mission: 2,
      team: [2, 3, 4],
      vote,
      leader,
    });
  expect(codeVote(fourth(2, 5))).toBe('reject');
  expect(codeVote(fourth(3, 6))).toBe('approve');
  // With the fifth pick its own, the seat keeps its rejection.
  expect(codeVote(fourth(3, 7))).toBe('reject');
});

test('speech: a sentence frame used twice at the table is worn out like a phrase', () => {
  const request = game({
    players: 7,
    observer: 2,
    roles: { 2: 'servant' },
    history: [],
    stage: 'selectTeam',
    mission: 1,
  });
  request.chat = ['1: 4, can you back 1, 2, 3?', '3: Quit circling. 5, will you approve this one?'].map((text, i) => ({
    id: String(i),
    name: text[0],
    text: text.slice(3),
  }));
  expect(stalePhrases(request)).toContain('"can you back this?" requests');
  expect(usedStalePhrases(request, '6, can you back this team?')).toEqual(['"can you back this?" requests']);
  expect(usedStalePhrases(request, 'Send 1, 2, 3.')).toEqual([]);
  // Analyst words are worn out from the first line, game words are not.
  expect(usedStalePhrases(request, 'That gives us a point of comparison.')).toHaveLength(1);
  expect(usedStalePhrases(request, '6 failed it, so 6 stays off.')).toEqual([]);
  // One earlier use by the speaker is enough.
  request.chat = [{ name: '2', text: "Works for me. If it flops, I'll own it." }];
  expect(usedStalePhrases(request, "4 is fine, I'll own that pick.")).toEqual(['"I\'ll own it" lines']);
  request.chat = [{ name: '2', text: 'Fun little gamble, I am in.' }];
  expect(usedStalePhrases(request, 'Rolling the dice on 4 then.')).toEqual(['gambling talk']);
  request.chat = [{ name: '5', text: 'That was a clean run.' }];
  expect(usedStalePhrases(request, '1 and 6 had a clean success.')).toEqual([]);
});

test('guards: an Evil leader the table already reads as Evil may sit out its own roster', () => {
  // Seat 4 sat on both failed missions with different partners: the table reads it as Evil.
  const request = game({
    players: 7,
    observer: 4,
    roles: { 4: 'oberon' },
    history: [mission(0, [4, 1], 1), mission(1, [4, 2, 3], 1)],
    stage: 'selectTeam',
    mission: 2,
    leader: 4,
  });
  request.choices = ['1, 5, 6', '4, 5, 6', '4, 1, 5'];
  expect(guardDecision(request, '1, 5, 6')?.reason ?? '').not.toContain('leaves themselves off');
});

test('guards: Morgana who finds an unseen ally with the Lady announces it Good; Mordred decides for itself', () => {
  const announce = (observer: number, roles: Record<number, string>) => {
    const request = game({
      players: 7,
      observer,
      roles,
      history: [mission(0, [1, 2], 0)],
      stage: 'announceLoyalty',
      mission: 1,
      team: [5],
    });
    request.choices = ['good', 'evil'];
    request.privateCheck = 'evil';
    return request;
  };
  expect(guardDecision(announce(4, { 4: 'morgana', 6: 'mordred' }), 'evil')).toMatchObject({ choice: 'good' });
  expect(guardDecision(announce(4, { 4: 'morgana', 6: 'mordred' }), 'good')).toBeUndefined();
  expect(guardDecision(announce(6, { 6: 'mordred', 4: 'morgana' }), 'evil')).toBeUndefined();
});

test('guards: an Evil Lady holder tells the truth about an ally the table all but knows, and decides in between', () => {
  const announce = (history: Event[]) => {
    const request = game({
      players: 7,
      observer: 3,
      roles: { 3: 'oberon' },
      history,
      stage: 'announceLoyalty',
      mission: 3,
      team: [5],
    });
    request.choices = ['good', 'evil'];
    request.privateCheck = 'evil';
    return request;
  };
  // 5 sat on both failed missions with different partners, and 1, 2 and 4 then passed one together.
  const caught = announce([mission(0, [1, 5], 1), mission(1, [2, 4, 5], 1), mission(2, [1, 2, 4], 0)]);
  expect(guardDecision(caught, 'good')).toMatchObject({ choice: 'evil' });
  expect(guardDecision(caught, 'evil')).toBeUndefined();
  // A suspect the table is still unsure of: either announcement stays the holder's call.
  const unsure = announce([mission(0, [1, 2], 0), mission(1, [1, 2, 5], 1), mission(2, [1, 2, 6], 0)]);
  expect(guardDecision(unsure, 'good')).toBeUndefined();
  expect(guardDecision(unsure, 'evil')).toBeUndefined();
});
