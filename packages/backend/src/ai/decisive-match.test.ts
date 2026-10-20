import fixture from './fixtures/decisive-match.json';
import { compactRequest } from './client';
import type { BotRequest } from './client';
import { evaluateCase, evaluationOutcome } from './evaluate-decisive-match';

const saved = (id: string) => fixture.cases.find((entry) => entry.id === id)!;
const request = (id: string) => structuredClone(saved(id).request) as unknown as BotRequest;
type Cues = {
  missions: { n: number; scoreBefore?: { successes: number; failures: number }; approvers?: number[] }[];
  proposal?: { nextLeader?: number };
};
const cues = (input: BotRequest) => compactRequest(input) as unknown as Cues;

test('completed successes retain the score and actual approving coalition from their own proposal', () => {
  const context = cues(request('m5-gambler-vote'));
  expect(context.missions.find((mission) => mission.n === 3)).toMatchObject({
    scoreBefore: { successes: 0, failures: 2 },
    approvers: [2, 4, 5, 6],
  });
  expect(context.missions.find((mission) => mission.n === 4)).toMatchObject({
    scoreBefore: { successes: 1, failures: 2 },
    approvers: [2, 4, 5, 6],
  });
});

test('the final first proposal identifies the next leader rather than the fifth leader', () => {
  expect(cues(request('m5-gambler-vote')).proposal).toMatchObject({ nextLeader: 4 });
});

test.each(['forced', 'anonymous'])('%s acceptance does not supply an invented approving coalition', (kind) => {
  const input = request('m5-gambler-vote');
  input.state.history = input.state.history.map((event) =>
    event.type === 'vote' && event.team.length === 4
      ? { ...event, ...(kind === 'forced' ? { forced: true } : { votes: 'anonymous' }) }
      : event,
  ) as BotRequest['state']['history'];
  const mission = cues(input).missions.find((entry) => entry.n === 3);
  expect(mission?.scoreBefore).toEqual({ successes: 0, failures: 2 });
  expect(mission?.approvers).toBeUndefined();
});

test.each(fixture.cases.map((entry) => [entry.id]))(
  '%s preserves legal choices and selected historical human testimony',
  (id) => {
    const entry = saved(id);
    const input = request(id);
    input.humanMemory = input.chat
      .filter((message) => entry.original.context.humanSeats.includes(Number(message.name)))
      .slice(0, 8)
      .map((message) => [message]);
    const context = compactRequest(input);
    expect(context.choices).toEqual(entry.request.choices);
    const testimony = [...(context.humanStatements || []), ...(context.chat || [])];
    for (const statement of entry.original.context.humanStatements) {
      expect(testimony.some((m) => String(m.by) === String(statement.by) && m.text.startsWith(statement.text))).toBe(
        true,
      );
    }
    expect(context.chat).toEqual(entry.original.context.chat);
    expect(context.privateKnowledge?.rolesVisibleToYou).toEqual(
      entry.original.context.privateKnowledge.rolesVisibleToYou,
    );
    expect(context.missions.map(({ yourCard }) => yourCard ?? null)).toEqual(
      entry.original.context.completedMissions.map(({ yourCard }) => yourCard),
    );
  },
);

test('saved regression positions contain no room or user identifiers or unobserved mission cards', () => {
  expect(JSON.stringify(fixture)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  for (const entry of fixture.cases) {
    const input = entry.request;
    expect(input.state.players.filter((player) => player.id !== input.playerID).map((player) => player.role)).toEqual(
      Array(5).fill('unknown'),
    );
    for (const event of input.state.history) {
      if (event.type !== 'mission') continue;
      for (const action of event.actions || []) {
        if (action.playerID !== input.playerID) expect(action).not.toHaveProperty('value');
      }
    }
  }
});

test('saved-position evaluation restores the original notes and leaves a legal model decision unchanged', async () => {
  const entry = saved('m5-gambler-vote');
  const result = await evaluateCase(entry.id, 'after', async (prompt) => {
    const context = JSON.parse(prompt.split('GAME INPUT:\n')[1]);
    expect(context.modelHypotheses).toEqual(entry.original.context.modelHypotheses);
    expect(context.previousDecisions).toEqual(entry.original.context.previousDecisions);
    expect(context.completedMissions.find((mission: { n: number }) => mission.n === 3)).toMatchObject({
      scoreBefore: { successes: 0, failures: 2 },
      approvers: [2, 4, 5, 6],
    });
    expect(context.privateKnowledge.rolesVisibleToYou).toEqual(
      entry.original.context.privateKnowledge.rolesVisibleToYou,
    );
    expect(context.choices).toEqual(entry.request.choices);
    for (const field of ['offTeamApprovals', 'offTeamVotingPatterns', 'votingPatterns']) {
      expect(context).not.toHaveProperty(field);
      expect(prompt).not.toContain(field);
    }
    return {
      text: JSON.stringify({
        choice: entry.original.choice,
        speech: entry.original.privateReason,
        publicReason: entry.original.publicReason,
        evidence: [],
        claimMorgana: null,
        claimStances: [],
      }),
      usage: {},
    };
  });
  expect(result).toMatchObject({ choice: 'approve', expectedChoice: 'reject', passed: false });
});

test('the baseline evaluation sends the historical observer context without newly added cues', async () => {
  const entry = saved('m5-gambler-vote');
  await evaluateCase(entry.id, 'before', async (prompt) => {
    const context = JSON.parse(prompt.split('GAME INPUT:\n')[1]);
    expect(context).toEqual(entry.original.context);
    expect(context).not.toHaveProperty('votingPatterns');
    return {
      text: JSON.stringify({
        choice: entry.original.choice,
        speech: entry.original.privateReason,
        publicReason: entry.original.publicReason,
        evidence: [],
        claimMorgana: null,
        claimStances: [],
      }),
      usage: {},
    };
  });
});

test.each([
  ['strict after target mismatch', [{ variant: 'after', strict: true, passed: false }], 1, 0, true, 1, 1],
  ['budget exhaustion skips a position', [{ variant: 'after', strict: true, passed: true }], 2, 0, false, 0, 1],
  ['provider failure', [], 1, 1, false, 0, 1],
  ['baseline target mismatch', [{ variant: 'before', strict: true, passed: false }], 1, 0, true, 0, 0],
  ['exploratory target mismatch', [{ variant: 'after', strict: false, passed: false }], 1, 0, true, 0, 0],
  ['complete passing after result', [{ variant: 'after', strict: true, passed: true }], 1, 0, true, 0, 0],
] as const)('evaluation gate handles %s', (_, results, expectedCases, errors, complete, failedTargets, exitCode) => {
  expect(evaluationOutcome(results, expectedCases, errors)).toEqual({
    expectedCases,
    complete,
    failedTargets,
    exitCode,
  });
});
