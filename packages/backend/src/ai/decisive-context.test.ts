import fixture from './fixtures/decisive-match.json';
import { compactRequest } from './client';
import type { BotRequest } from './client';
import { publicContext } from './pipeline';

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
