import { decisionInstructions } from './pipeline';
import type { BotRequest } from './client';
import type { VisualGameState } from '@avalon/types';

const request: BotRequest = {
  playerID: '2',
  name: '2',
  style: 'Keep questioning an unanswered accusation.',
  task: 'Vote on the proposed team.',
  speak: false,
  choices: ['approve', 'reject'],
  chat: [],
  state: { stage: 'votingForTeam' } as VisualGameState,
};

test.each(['regular', 'smart'] as const)(
  '%s team decisions compare decisive successes, opposing support and a reachable coalition',
  (botDifficulty) => {
    for (const stage of ['selectTeam', 'votingForTeam'] as const) {
      const instructions = decisionInstructions({ ...request, botDifficulty, state: { ...request.state, stage } });
      expect(instructions).toContain('scoreBefore');
      expect(instructions).toContain('Replacing a reliably Good seat');
      expect(instructions).toContain('getting another result is not itself a benefit');
      // Winning-opportunity deductions and the two-Fail exception are exercised by the real-model
      // evaluate-winning-opportunity cases; their old advisory wording is no longer a contract.
      expect(instructions).toContain('Read the actual recorded votes across proposals:');
      expect(instructions).toContain('Unanswered questions');
      expect(instructions).toContain('proposal.nextLeader');
      expect(instructions).toContain('previous approvers');
      expect(instructions).toContain('include your own changed vote');
      expect(instructions).toContain('private reason');
    }
  },
);

test.each(['onMission', 'checkLoyalty', 'assassinate', 'end'] as const)(
  '%s does not receive the team risk comparison',
  (stage) => {
    expect(decisionInstructions({ ...request, state: { ...request.state, stage } })).not.toContain(
      'Good team risk comparison',
    );
  },
);
