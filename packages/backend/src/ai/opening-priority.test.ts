import type { VisualGameState } from '@avalon/types';
import { AiTechnicalPause } from './client';
import type { BotRequest } from './client';
import { decisionInstructions, decisionPipeline, publicContext } from './pipeline';

function opening(role = 'servant', botDifficulty: 'regular' | 'smart' = 'smart'): BotRequest {
  return {
    playerID: '1',
    name: '1',
    style: 'brief',
    task: 'Discuss the first team.',
    botDifficulty,
    speak: true,
    publicDiscussion: true,
    chat: [],
    choices: ['1, 2', '1, 3', '1, 4', '1, 5', '1, 6', '1, 7'],
    state: {
      stage: 'selectTeam',
      mission: 0,
      vote: 0,
      history: [],
      settings: {
        missions: [
          { players: 2, failsRequired: 1 },
          { players: 3, failsRequired: 1 },
        ],
      },
      players: Array.from({ length: 7 }, (_, i) => ({
        id: String(i + 1),
        index: i + 1,
        role: i === 0 ? role : role === 'merlin' && i < 3 ? 'evil' : 'unknown',
        features: { isLeader: i === 0 },
      })),
    } as unknown as VisualGameState,
  };
}

const reply = { choice: 0, speech: 'A starting preference.', publicReason: 'I propose 1 and 2.' };

test.each(['regular', 'smart'] as const)(
  '%s opening choices receive a full private priority regardless of role, without changing legal choices',
  async (difficulty) => {
    for (const role of ['servant', 'merlin', 'percival', 'mordred', 'morgana', 'oberon']) {
      const input = opening(role, difficulty);
      const generate = jest.fn().mockResolvedValue(reply);
      const result = await decisionPipeline(generate)(input);
      const options = generate.mock.calls[0][1];
      expect([...options.context.privateTieBreakOrder].sort()).toEqual([2, 3, 4, 5, 6, 7]);
      expect(options.instructions).toContain('Opening equivalent-choice tie-break');
      expect(options.instructions).toContain('first eligible partner in privateTieBreakOrder');
      expect(options.instructions).toContain('For Good, a known Evil is not an eligible equivalent');
      expect(generate.mock.calls[0][0].choices).toEqual(input.choices);
      expect(result.speech).toBe(reply.publicReason);
      expect(result).not.toHaveProperty('privateTieBreakOrder');
      expect(input).not.toHaveProperty('privateTieBreakOrder');
      expect(publicContext(input, input.choices[0])).not.toHaveProperty('privateTieBreakOrder');
    }
  },
);

test('a bot retains its priority through technical retry, final selection and a rejected opening proposal', async () => {
  const input = opening();
  const generate = jest.fn().mockRejectedValueOnce(new AiTechnicalPause('Worker busy.')).mockResolvedValue(reply);
  const decide = decisionPipeline(generate);
  await expect(decide(input)).rejects.toThrow('Worker busy.');
  await decide(input);
  await decide({
    ...input,
    publicDiscussion: false,
    optionalSpeech: true,
    state: { ...input.state, players: [...input.state.players].reverse() },
  });
  await decide({ ...input, publicDiscussion: false, state: { ...input.state, vote: 1 } });
  const priorities = generate.mock.calls.map(([, options]) => options.context.privateTieBreakOrder);
  expect(priorities[0]).toHaveLength(6);
  for (const priority of priorities) expect(priority).toEqual(priorities[0]);
});

test('a roster repair receives the same priority as the original decision', async () => {
  const generate = jest
    .fn()
    .mockResolvedValueOnce({ ...reply, speech: 'I choose 1, 3.' })
    .mockResolvedValue(reply);
  await decisionPipeline(generate)(opening());
  expect(generate).toHaveBeenCalledTimes(2);
  expect(generate.mock.calls[1][1].phase).toBe('decision-repair');
  expect(generate.mock.calls[1][1].context.privateTieBreakOrder).toEqual(
    generate.mock.calls[0][1].context.privateTieBreakOrder,
  );
  expect(generate.mock.calls[0][1].context.privateTieBreakOrder).toHaveLength(6);
});

test('each bot has a priority containing its own possible partners', async () => {
  const input = opening();
  const generate = jest.fn().mockResolvedValue({ choice: 0, speech: 'A preference.', publicReason: '' });
  const decide = decisionPipeline(generate);
  await decide(input);
  await decide({ ...input, playerID: '4', name: '4' });
  expect([...generate.mock.calls[0][1].context.privateTieBreakOrder].sort()).toEqual([2, 3, 4, 5, 6, 7]);
  expect([...generate.mock.calls[1][1].context.privateTieBreakOrder].sort()).toEqual([1, 2, 3, 5, 6, 7]);
});

test.each([
  ['votingForTeam', 0, 2],
  ['onMission', 0, 2],
  ['selectTeam', 1, 3],
  ['selectTeam', 0, 3],
] as const)('%s mission %i size %i receives no opening priority or advice', async (stage, mission, size) => {
  const input = opening('mordred');
  const state = {
    ...input.state,
    stage,
    mission,
    settings: {
      missions: [
        { players: size, failsRequired: 1 },
        { players: 3, failsRequired: 1 },
      ],
    },
  } as unknown as VisualGameState;
  const current = { ...input, state, speak: false, publicDiscussion: false };
  const generate = jest.fn().mockResolvedValue({ choice: 0, speech: 'A choice.', publicReason: '' });
  await decisionPipeline(generate)(current);
  expect(generate.mock.calls[0][1].context).not.toHaveProperty('privateTieBreakOrder');
  expect(decisionInstructions(current)).not.toContain('Opening equivalent-choice tie-break');
});
