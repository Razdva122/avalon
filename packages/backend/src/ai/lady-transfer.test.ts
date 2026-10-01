import { systemFor } from './client';
import { decisionInstructions } from './pipeline';
import type { BotRequest } from './client';
import type { VisualGameState } from '@avalon/types';

test.each([systemFor, decisionInstructions])(
  'Lady instructions preserve a Good trust chain as a tie-breaker (%#)',
  (instructions) => {
    const request: BotRequest = {
      playerID: 'bot',
      name: '1',
      style: 'brief',
      task: 'Inspect',
      speak: true,
      state: { stage: 'checkLoyalty' } as VisualGameState,
      chat: [],
      choices: ['2', '3'],
    };
    const prompt = instructions(request);
    expect(prompt).toContain('When legal inspection targets offer comparable information and tactical value');
    expect(prompt).toContain('Good should prefer passing the Lady to a player supported as Good by reliable evidence');
    expect(prompt).toContain('trust chain');
    expect(prompt).toContain('If the Lady reaches Evil, later announcements from that holder are untrusted testimony');
    expect(prompt).toContain('This does not invalidate earlier reliable checks');
    expect(prompt).toContain('Evil should choose for its own side');
  },
);
