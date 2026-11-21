import fixture from './fixtures/decisive-match.json';
import { compactRequest } from './client';
import type { BotRequest } from './client';
import { decisionInstructions, decisionPipeline, publicContext } from './pipeline';

const request = () =>
  structuredClone(fixture.cases.find((entry) => entry.id === 'm5-gambler-vote')!.request) as unknown as BotRequest;

test('private and public contexts retain recorded votes without derived voting summaries', () => {
  const input = request();
  for (const context of [compactRequest(input), publicContext(input, 'reject')]) {
    for (const field of ['offTeamApprovals', 'offTeamVotingPatterns', 'votingPatterns']) {
      expect(context).not.toHaveProperty(field);
    }
    expect(context.votes).toHaveLength(8);
    expect(context.votes).toContainEqual(
      expect.objectContaining({
        mission: 4,
        attempt: 2,
        team: [2, 3, 6],
        votes: [
          [1, 'approve'],
          [2, 'approve'],
          [3, 'approve'],
          [4, 'reject'],
          [5, 'reject'],
          [6, 'reject'],
        ],
      }),
    );
  }
});

test('forced proposals neither invent mission approvers nor cast votes', () => {
  const input = request();
  input.state.history = input.state.history.map((event) =>
    event.type === 'vote' ? { ...event, forced: true } : event,
  );
  const context = compactRequest(input);
  expect(context.missions.every((mission) => mission.approvers === undefined)).toBe(true);
  expect(context.votes.every((vote) => vote.votes === 'automatic: no vote cast')).toBe(true);
});

test('anonymous vote totals cannot identify individual approvers', () => {
  const input = request();
  input.state.history = input.state.history.map((event) =>
    event.type === 'vote' ? { ...event, anonymous: true, votes: { approve: 4, reject: 2 } } : event,
  );
  const context = compactRequest(input);
  expect(context.missions.every((mission) => mission.approvers === undefined)).toBe(true);
  expect(context.votes.every((vote) => !Array.isArray(vote.votes))).toBe(true);
});

test('a completed mission cannot borrow the approving coalition of a different roster', () => {
  const input = request();
  input.state.history = input.state.history.map((event, index) =>
    index === 6 && event.type === 'vote'
      ? { ...event, team: event.team.map((member, position) => (position === 0 ? { ...member, id: '3' } : member)) }
      : event,
  );
  const context = compactRequest(input);
  expect(context.missions.find((mission) => mission.n === 3)?.approvers).toBeUndefined();
  expect(context.missions.find((mission) => mission.n === 4)?.approvers).toEqual([2, 4, 5, 6]);
});

test('public mission context retains factual cues without exposing private cards or roles', () => {
  const input = request();
  input.state.history = input.state.history.map((event) =>
    event.type === 'mission'
      ? {
          ...event,
          actions: event.actions.map((action) => (action.playerID === '4' ? { ...action, value: 'fail' } : action)),
        }
      : event,
  );
  const privateContext = compactRequest(input);
  const context = publicContext(input, 'reject');
  expect(privateContext.missions.find((mission) => mission.n === 3)?.yourCard).toBe('success');
  expect(context.missions.find((mission) => mission.n === 3)).toMatchObject({
    scoreBefore: { successes: 0, failures: 2 },
    approvers: [2, 4, 5, 6],
  });
  expect(context).not.toHaveProperty('privateKnowledge');
  expect(context.missions.every((mission) => !('yourCard' in mission) && !('cards' in mission))).toBe(true);
  expect(context.votes).toEqual(privateContext.votes);
});

test('a successful two-Fail mission retains its threshold and Fail count at two prior failures', () => {
  const input = request();
  input.state.history = input.state.history.map((event) =>
    event.type === 'mission' && event.result === 'success' && event.index === 2
      ? { ...event, settings: { ...event.settings, failsRequired: 2 }, fails: 1 }
      : event,
  );
  expect(compactRequest(input).missions.find((mission) => mission.n === 3)).toMatchObject({
    failsRequired: 2,
    fails: 1,
    result: 'success',
    scoreBefore: { successes: 0, failures: 2 },
  });
});

test('next leader follows seat order and distinguishes early, fourth and forced proposals', () => {
  const input = request();
  input.state.players.reverse();
  expect(compactRequest(input).proposal).toMatchObject({ number: 1, nextLeader: 4, fifthLeader: 1 });
  input.state.vote = 3;
  input.state.players.forEach((player) => {
    player.features.isLeader = player.index === 6;
  });
  expect(compactRequest(input).proposal).toMatchObject({ number: 4, nextLeader: 1, fifthLeader: 1 });
  input.state.vote = 4;
  expect(compactRequest(input).proposal).toMatchObject({ number: 5, fifthLeader: 6, forced: true });
  expect(compactRequest(input).proposal?.nextLeader).toBeUndefined();
});

const allianceRequest = () => {
  const input = request();
  const me = input.state.players.find((player) => player.id === input.playerID)!;
  me.role = 'mordred';
  const ally = input.state.players.find((player) => player.id !== me.id)!;
  ally.role = 'evil';
  const other = input.state.players.find((player) => player.id !== me.id && player.id !== ally.id)!;
  const fourth = input.state.players.find((player) => ![me.id, ally.id, other.id].includes(player.id))!;
  const proposal = input.state.history.find((event) => event.type === 'vote')!;
  const turn = (leaderID: string, ids: string[], value: 'approve' | 'reject') => ({
    ...proposal,
    leaderID,
    anonymous: false as const,
    forced: false,
    team: ids.map((id) => ({ id })),
    votes: [{ playerID: me.id, value, onMission: ids.includes(me.id) }],
  });
  const first = turn(other.id, [ally.id, other.id], 'approve');
  input.state.history = [
    first,
    first,
    turn(other.id, [ally.id, other.id], 'reject'),
    turn(other.id, [other.id, fourth.id], 'approve'),
    turn(other.id, [other.id, fourth.id], 'reject'),
    turn(me.id, [me.id, ally.id], 'approve'),
    turn(me.id, [me.id, other.id], 'approve'),
    turn(me.id, [me.id, other.id], 'reject'),
    { ...first, forced: true },
    { ...first, anonymous: true, votes: { approve: 4, reject: 2 } },
  ];
  input.state.stage = 'votingForTeam';
  input.speak = false;
  input.choices = ['approve', 'reject'];
  return { input, ally, me, other };
};

test('Evil privately sees its actual off-team votes and self-inclusive rosters by known ally', async () => {
  const { input, ally, me } = allianceRequest();
  const expected = [
    {
      ally: ally.index,
      offTeamVotes: { withAlly: { approve: 2, reject: 1 }, withoutAlly: { approve: 1, reject: 1 } },
      selfInclusiveProposals: { withAlly: 1, withoutAlly: 2 },
    },
  ];
  expect(publicContext(input, 'approve')).not.toHaveProperty('allianceCover');
  await decisionPipeline(async (_request, options) => {
    expect(options.context).toMatchObject({ allianceCover: expected });
    expect(options.instructions).toContain('A single Fail card still matters');
    return { choice: 0, speech: 'The decisive sabotage can justify exposure.', publicReason: '' };
  })(input);
  me.role = 'oberon';
  ally.role = 'unknown';
  expect(compactRequest(input)).not.toHaveProperty('allianceCover', expect.anything());
  me.role = 'merlin';
  ally.role = 'evil';
  expect(compactRequest(input)).not.toHaveProperty('allianceCover', expect.anything());
  me.role = 'mordred';
  input.state.stage = 'onMission';
  expect(compactRequest(input)).not.toHaveProperty('allianceCover', expect.anything());
});

test('Evil can choose either vote and either self-inclusive roster after considering cover', async () => {
  const { input, ally, me, other } = allianceRequest();
  for (const stage of ['votingForTeam', 'selectTeam'] as const) {
    input.state.stage = stage;
    input.choices =
      stage === 'selectTeam' ? [`${me.index}, ${ally.index}`, `${me.index}, ${other.index}`] : ['approve', 'reject'];
    expect(decisionInstructions(input)).toContain(
      stage === 'selectTeam'
        ? 'strongest legal option also including your known ally'
        : 'compare approving now with rejecting',
    );
    for (const choice of [0, 1]) {
      const result = await decisionPipeline(async () => ({ choice, speech: 'Compared tactical value and cover.' }))(
        input,
      );
      expect(result.choice).toBe(choice);
    }
  }
});
