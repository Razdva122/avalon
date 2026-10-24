import type { DecisionEvidence } from '../client';

// Behavioral evaluations: only the acting player's private knowledge is supplied.
const mission = (n: number, team: number[], result: string, failures: number, failsRequired = 1, fails = 0) => ({
  n,
  team,
  result,
  failsRequired,
  fails: result === 'fail' ? 1 : fails,
  yourCard: team.includes(2) ? 'success' : null,
  scoreBefore: { successes: n - 1 - failures, failures },
});

const base = {
  you: { seat: 2, role: 'percival', side: 'good' },
  language: 'ru',
  playerCount: 7,
  humanSeats: [4, 6],
  alignmentCounts: { good: 4, evil: 3 },
  roleCounts: { merlin: 1, percival: 1, servant: 2, mordred: 1, morgana: 1, oberon: 1 },
  roleAdvice: 'You are Percival. Seats 4 and 5 are Merlin and Morgana in an unknown order.',
  privateKnowledge: {
    rolesVisibleToYou: [
      [1, 'unknown'],
      [2, 'percival'],
      [3, 'unknown'],
      [4, 'mysteryWizard'],
      [5, 'mysteryWizard'],
      [6, 'unknown'],
      [7, 'unknown'],
    ],
    checks: [],
    inspectionResult: null,
  },
  stage: 'checkLoyalty',
  mission: null,
  task: 'Choose the most useful legal Lady inspection for your actual side.',
  lady: { afterMission: 3, laterChecksIfGameContinues: [4] },
  score: { successes: 1, failures: 2 },
  missions: [mission(1, [1, 7], 'fail', 0), mission(2, [2, 3, 4], 'fail', 1), mission(3, [2, 4, 6], 'success', 2)],
  checks: [] as { by: number; target: number; announced: string }[],
  chat: [],
  modelHypotheses: [] as DecisionEvidence[],
  choices: ['1', '3', '4', '5', '6'],
};

export type OpportunityCase = {
  id: string;
  context: typeof base;
  expected: {
    good: number[];
    evil: number[];
    unresolved: number[];
    merlin: number | null;
    morgana: number | null;
    choice?: string;
  };
};

export function opportunityCases(): OpportunityCase[] {
  const cases: OpportunityCase[] = [
    {
      id: 'decisive-success-percival-lady',
      context: structuredClone(base),
      expected: { good: [2, 4, 6], evil: [3, 5], unresolved: [1, 7], merlin: 4, morgana: 5, choice: '1' },
    },
  ];
  // Same position under a seat permutation; no game outcome or correct answer in the input.
  const permuted = structuredClone(base);
  const seat: Record<number, number> = { 1: 5, 2: 6, 3: 1, 4: 7, 5: 2, 6: 3, 7: 4 };
  permuted.you.seat = 6;
  permuted.humanSeats = [7, 3];
  permuted.roleAdvice = 'You are Percival. Seats 7 and 2 are Merlin and Morgana in an unknown order.';
  permuted.privateKnowledge.rolesVisibleToYou = base.privateKnowledge.rolesVisibleToYou.map(([n, role]) => [
    seat[Number(n)],
    role,
  ]);
  permuted.missions = base.missions.map((m) => ({ ...m, team: m.team.map((n) => seat[n]) }));
  permuted.choices = ['5', '1', '7', '2', '3'];
  cases.push({
    id: 'decisive-success-permuted',
    context: permuted,
    expected: { good: [3, 6, 7], evil: [1, 2], unresolved: [4, 5], merlin: 7, morgana: 2, choice: '5' },
  });

  const early = structuredClone(base);
  early.missions = [
    mission(1, [1, 7], 'success', 0),
    mission(2, [2, 3, 4], 'fail', 0),
    mission(3, [2, 4, 6], 'success', 1),
  ];
  early.score = { successes: 2, failures: 1 };
  cases.push({
    id: 'early-success-does-not-clear',
    context: early,
    expected: { good: [2], evil: [], unresolved: [1, 3, 4, 5, 6, 7], merlin: null, morgana: null },
  });

  const twoFails = structuredClone(base);
  // Keep both wizard assignments feasible; otherwise the total-Evil bound itself proves 4 Evil.
  twoFails.missions[1] = mission(2, [2, 3, 5], 'fail', 1);
  twoFails.missions[2] = mission(3, [2, 4, 6], 'success', 2, 2, 1);
  cases.push({
    id: 'two-fail-threshold-does-not-clear',
    context: twoFails,
    expected: { good: [2], evil: [], unresolved: [1, 3, 4, 5, 6, 7], merlin: null, morgana: null },
  });

  const knownEvil = structuredClone(base);
  knownEvil.you.role = 'merlin';
  knownEvil.roleAdvice = 'You are Merlin. Visible Evil seats are 4 and 5. Mordred is hidden from you.';
  knownEvil.privateKnowledge.rolesVisibleToYou = [
    [1, 'unknown'],
    [2, 'merlin'],
    [3, 'unknown'],
    [4, 'evil'],
    [5, 'evil'],
    [6, 'unknown'],
    [7, 'unknown'],
  ];
  cases.push({
    id: 'private-evil-knowledge-overrides-strategic-assumption',
    context: knownEvil,
    expected: { good: [2, 3, 6], evil: [4, 5], unresolved: [1, 7], merlin: 2, morgana: null },
  });

  const oldSuccess = structuredClone(base);
  oldSuccess.missions = [
    mission(1, [2, 4, 6], 'success', 0),
    mission(2, [1, 7], 'fail', 0),
    mission(3, [2, 3, 4], 'fail', 1),
  ];
  cases.push({
    id: 'use-score-before-not-current-score',
    context: oldSuccess,
    expected: { good: [2], evil: [], unresolved: [1, 3, 4, 5, 6, 7], merlin: null, morgana: null },
  });
  return cases;
}

export function additionalOpportunityCases(): OpportunityCase[] {
  const chain = structuredClone(base);
  chain.you.role = 'servant';
  chain.roleAdvice = 'You are a Servant of Arthur. You know only your own Good alignment.';
  chain.privateKnowledge.rolesVisibleToYou = Array.from({ length: 7 }, (_, i) => [
    i + 1,
    i === 1 ? 'servant' : 'unknown',
  ]);
  chain.missions = [
    mission(1, [1, 4], 'fail', 0),
    mission(2, [3, 5, 6], 'fail', 1),
    mission(3, [2, 4, 6], 'success', 2),
  ];

  const offTeam = structuredClone(base);
  offTeam.missions = [
    mission(1, [1, 4], 'fail', 0),
    mission(2, [2, 5, 6], 'fail', 1),
    mission(3, [3, 4, 6], 'success', 2),
  ];

  const hardConflict = structuredClone(base);
  hardConflict.missions = [
    mission(1, [4, 6], 'fail', 0),
    mission(2, [1, 3, 5], 'fail', 1),
    mission(3, [2, 4, 6], 'success', 2),
  ];

  const twoFailsZeroCards = structuredClone(base);
  twoFailsZeroCards.missions[1] = mission(2, [2, 3, 5], 'fail', 1);
  twoFailsZeroCards.missions[2] = mission(3, [2, 4, 6], 'success', 2, 2, 0);

  const botCheck = structuredClone(base);
  botCheck.humanSeats = [6];
  botCheck.checks = [
    { by: 4, target: 5, announced: 'good' },
    { by: 5, target: 2, announced: 'good' },
  ];
  botCheck.missions.push(mission(4, [2, 4, 6, 7], 'success', 2, 2));
  botCheck.score = { successes: 2, failures: 2 };
  botCheck.lady = { afterMission: 4, laterChecksIfGameContinues: [] };
  botCheck.choices = ['1', '3', '6', '7'];

  const staleMemory = structuredClone(base);
  staleMemory.modelHypotheses = [
    {
      key: 'read:after-m2',
      kind: 'deduction',
      certainty: 'claim',
      fact: 'После второго похода 3 и 4 не разрешены. Пара 4/5 не разрешена; предпочитаю проверить 4.',
      source: 'Гипотеза после второго похода, до результата третьего похода.',
    },
  ];

  return [
    {
      id: 'servant-chain-through-disjoint-failures',
      context: chain,
      expected: { good: [2, 4, 6], evil: [1], unresolved: [3, 5, 7], merlin: null, morgana: null },
    },
    {
      id: 'off-team-good-completes-all-alignments',
      context: offTeam,
      expected: { good: [2, 3, 4, 6], evil: [1, 5, 7], unresolved: [], merlin: 4, morgana: 5 },
    },
    {
      id: 'hard-fail-bound-overrides-win-assumption',
      context: hardConflict,
      expected: { good: [2], evil: [], unresolved: [1, 3, 4, 5, 6, 7], merlin: null, morgana: null },
    },
    {
      id: 'two-fail-success-with-zero-fails-does-not-clear',
      context: twoFailsZeroCards,
      expected: { good: [2], evil: [], unresolved: [1, 3, 4, 5, 6, 7], merlin: null, morgana: null },
    },
    {
      id: 'bot-announcement-and-wizard-pair-override-win-assumption',
      context: botCheck,
      expected: { good: [2, 5], evil: [4], unresolved: [1, 3, 6, 7], merlin: 5, morgana: 4 },
    },
    {
      id: 'decisive-success-updates-stale-memory',
      context: staleMemory,
      expected: { good: [2, 4, 6], evil: [3, 5], unresolved: [1, 7], merlin: 4, morgana: 5, choice: '1' },
    },
  ];
}
