import { compactRequest } from './client';
import type { BotRequest } from './client';
import { focusedRetry, publicContext } from './pipeline';

const request = {
  playerID: '1',
  name: '1',
  style: 'Careful analyst.',
  task: 'Discuss the next team.',
  speak: true,
  publicDiscussion: true,
  choices: ['1, 3, 5'],
  chat: [],
  state: {
    stage: 'selectTeam',
    mission: 1,
    vote: 0,
    players: Array.from({ length: 5 }, (_, i) => ({
      id: String(i + 1),
      index: i + 1,
      role: i === 0 ? 'merlin' : 'unknown',
      features: {},
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
        result: 'reject',
        forced: false,
        votes: [
          { playerID: '1', value: 'approve' },
          { playerID: '2', value: 'approve' },
          { playerID: '3', value: 'reject' },
          { playerID: '5', value: 'reject' },
        ],
      },
      {
        type: 'vote',
        leaderID: '3',
        team: [{ id: '2' }, { id: '3' }],
        result: 'approve',
        forced: false,
        votes: [
          { playerID: '1', value: 'approve' },
          { playerID: '2', value: 'approve' },
          { playerID: '3', value: 'approve' },
          { playerID: '4', value: 'reject' },
          { playerID: '5', value: 'approve' },
        ],
      },
      {
        type: 'mission',
        index: 0,
        leaderID: '3',
        result: 'fail',
        fails: 1,
        actions: [
          { playerID: '2', value: 'fail' },
          { playerID: '3', value: 'success' },
        ],
      },
    ],
  },
} as unknown as BotRequest;

test('questions can distinguish off-team approvals of a rejected proposal from the later failed mission', () => {
  expect(compactRequest(request)).toMatchObject({
    offTeamApprovals: [
      { mission: 1, attempt: 1, team: [2, 4], seats: [1], proposalResult: 'reject' },
      {
        mission: 1,
        attempt: 2,
        team: [2, 3],
        seats: [1, 5],
        proposalResult: 'approve',
        missionResult: 'fail',
        fails: 1,
      },
    ],
  });
  const context = publicContext(request, '1, 3, 5');
  expect(context).toMatchObject({
    offTeamApprovals: [
      expect.not.objectContaining({ missionResult: 'fail' }),
      expect.objectContaining({ seats: [1, 5], missionResult: 'fail', fails: 1 }),
    ],
  });
  expect(JSON.stringify(context)).not.toMatch(/merlin|yourCard|"cards"|privateKnowledge/);
  const retry = focusedRetry({
    context: compactRequest(request),
    decisionDetails: true,
    phase: 'decision',
    maxOutput: 10000,
  });
  expect(retry.context).toMatchObject({
    offTeamApprovals: [expect.anything(), expect.objectContaining({ seats: [1, 5], missionResult: 'fail' })],
  });
});

test('an automatic proposal never invents off-team votes even if legacy history contains vote entries', () => {
  const automatic = {
    ...request,
    state: {
      ...request.state,
      history: request.state.history.map((e) => (e.type === 'vote' ? { ...e, forced: true } : e)),
    },
  } as BotRequest;
  expect(compactRequest(automatic)).toMatchObject({ offTeamApprovals: [] });
});

test('a pending or successful mission is not presented as a failed mission', () => {
  const pending = { ...request, state: { ...request.state, history: request.state.history.slice(0, 2) } } as BotRequest;
  expect(compactRequest(pending)).toMatchObject({
    offTeamApprovals: [expect.anything(), expect.not.objectContaining({ missionResult: expect.anything() })],
  });
  const successful = {
    ...request,
    state: {
      ...request.state,
      history: request.state.history.map((e) => (e.type === 'mission' ? { ...e, result: 'success', fails: 0 } : e)),
    },
  } as BotRequest;
  expect(compactRequest(successful)).toMatchObject({
    offTeamApprovals: [expect.anything(), expect.objectContaining({ missionResult: 'success', fails: 0 })],
  });
});

test('anonymous votes cannot be attributed to seats for questioning', () => {
  const anonymous = {
    ...request,
    state: {
      ...request.state,
      history: request.state.history.map((e) => (e.type === 'vote' ? { ...e, votes: { approve: 3, reject: 2 } } : e)),
    },
  } as unknown as BotRequest;
  expect(compactRequest(anonymous)).toMatchObject({ offTeamApprovals: [] });
});
