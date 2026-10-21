import { compactRequest } from './client';
import { claimContext, claimInstructions } from './claims';
import { decisionInstructions, publicContext } from './pipeline';
import type { BotRequest } from './client';

test.each(['regular', 'smart'] as const)(
  '%s Percival keeps optional claims and testimony handling without the expanded strategy',
  (botDifficulty) => {
    const request = {
      playerID: '1',
      name: '1',
      botDifficulty,
      speak: true,
      publicDiscussion: true,
      chat: [],
      choices: ['1, 2'],
      state: {
        stage: 'selectTeam',
        mission: 0,
        vote: 0,
        history: [],
        players: [
          { id: '1', index: 1, role: 'percival', features: {} },
          { id: '2', index: 2, role: 'mysteryWizard', features: {} },
          { id: '3', index: 3, role: 'mysteryWizard', features: {} },
        ],
      },
    } as unknown as BotRequest;
    const context = compactRequest(request);
    expect(context.roleAdvice).not.toContain('compare staying concealed with an intentional Percival claim');
    const instructions = decisionInstructions(request) + claimInstructions;
    expect(instructions).toContain('Use claimMorgana only when deliberately claiming Percival this turn');
    expect(instructions).toContain('Understand role claims by meaning in chat and humanStatements');
    expect(instructions).toContain('A false Percival claim could also be Merlin using cover');
    expect(instructions).toContain('Never identify the other wizard as Merlin');
    expect(context.privateKnowledge?.rolesVisibleToYou).toEqual([
      [1, 'percival'],
      [2, 'mysteryWizard'],
      [3, 'mysteryWizard'],
    ]);
    expect(context.choices).toEqual(['1, 2']);
    expect(claimContext(request).targets).toEqual([2, 3]);
    expect(claimContext({ ...request, speak: false }).targets).toEqual([]);
    expect(publicContext(request, '1, 2')).not.toHaveProperty('roleAdvice');
    const servant = {
      ...request,
      state: {
        ...request.state,
        players: request.state.players.map((p) => (p.id === '1' ? { ...p, role: 'servant' } : p)),
      },
    } as BotRequest;
    expect(compactRequest(servant).roleAdvice).not.toContain(
      'compare staying concealed with an intentional Percival claim',
    );
  },
);
