import type { VisualGameState } from '@avalon/types';
import type { BotRequest } from './client';
import { systemFor } from './client';
import { decisionPipeline } from './pipeline';

function inspection(afterMission: number, botDifficulty: 'regular' | 'smart'): BotRequest {
  return {
    playerID: '7',
    name: '7',
    style: 'brief',
    task: 'Choose a Lady target.',
    speak: true,
    chat: [],
    choices: ['1', '2', '3', '4', '5', '6'],
    botDifficulty,
    state: {
      stage: 'checkLoyalty',
      mission: afterMission,
      players: Array.from({ length: 7 }, (_, i) => ({
        id: String(i + 1),
        index: i + 1,
        role: i === 6 ? 'servant' : 'unknown',
        features: i === 6 ? { ladyOfLake: 'active' } : {},
      })),
      history: Array.from({ length: afterMission }, (_, index) => ({
        type: 'mission',
        index,
        leaderID: '1',
        result: index % 2 === 0 ? 'fail' : 'success',
        fails: index % 2 === 0 ? 1 : 0,
        actions:
          index === 0
            ? [{ playerID: '7', value: 'success' }, { playerID: '1' }]
            : [{ playerID: '2' }, { playerID: '3' }, { playerID: '4' }],
      })),
    } as unknown as VisualGameState,
  };
}

test.each([
  ['regular', 2, [3, 4]],
  ['regular', 3, [4]],
  ['regular', 4, []],
  ['smart', 2, [3, 4]],
  ['smart', 3, [4]],
  ['smart', 4, []],
] as const)(
  '%s Lady decision after mission %i receives strategy and conditional future checks',
  async (difficulty, n, later) => {
    const generate = jest.fn().mockResolvedValue({
      choice: 0,
      speech: 'Public corroboration may justify a privately redundant inspection.',
      publicReason: 'I will check 1 to give the table a stated result.',
    });
    const input = inspection(n, difficulty);
    const reply = await decisionPipeline(generate)(input);
    const { instructions, context } = generate.mock.calls[0][1];

    expect(context.lady).toEqual({ afterMission: n, laterChecksIfGameContinues: later });
    expect(context.completedMissions[0]).toMatchObject({ team: [7, 1], fails: 1, yourCard: 'success' });
    expect(instructions).toContain('inspected player becomes the next holder');
    expect(instructions).toContain('Good already knows the partner is Evil');
    expect(instructions).toContain('public corroboration');
    expect(instructions).toContain('behavioral evidence, not verified alignment');
    // Advice must reach the model without the server banning a tactical check of known Evil.
    expect(generate.mock.calls[0][0].choices).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(reply).toMatchObject({ choice: 0, speech: 'I will check 1 to give the table a stated result.' });
  },
);

test("later team reasoning receives the Lady checker signal without another player's private card", async () => {
  const input = inspection(2, 'smart');
  input.playerID = '3';
  input.speak = false;
  input.choices = ['approve', 'reject'];
  input.state.stage = 'votingForTeam';
  input.state.players = input.state.players.map((p) => ({ ...p, role: p.id === '3' ? 'servant' : 'unknown' }));
  input.state.history.push(
    { type: 'checkLoyalty', validatorID: '7', inspectedID: '1' },
    { type: 'announceLoyalty', announcerID: '7', targetID: '1', announced: 'evil' },
  );
  const generate = jest.fn().mockResolvedValue({ choice: 1, speech: "The checker's explanation is a revisable clue." });
  await decisionPipeline(generate)(input);
  const { instructions, context } = generate.mock.calls[0][1];

  expect(instructions).toContain('claimed Good viewpoint');
  expect(instructions).toContain('behavioral evidence, not verified alignment');
  expect(context.checks).toEqual([{ by: 7, target: 1, announced: 'evil', actual: undefined }]);
  expect(context.completedMissions[0]).toMatchObject({ participated: false, yourCard: undefined, cards: undefined });
});

test.each(['regular', 'smart'] as const)(
  '%s Evil receives the Lady cover tradeoff at target selection and announcement without forced choices',
  async (difficulty) => {
    for (const stage of ['checkLoyalty', 'announceLoyalty'] as const) {
      const input = inspection(4, difficulty);
      input.state.stage = stage;
      input.state.players[6].role = 'mordred';
      input.state.players[0].role = 'evil';
      if (stage === 'announceLoyalty') {
        input.choices = ['good', 'evil'];
        input.privateCheck = 'evil';
        input.speak = false;
        input.state.players[0].features.isSelected = true;
      }
      const generate = jest.fn().mockResolvedValue({ choice: 0, speech: 'A tactical choice.', publicReason: '' });
      const reply = await decisionPipeline(generate)(input);
      for (const instructions of [generate.mock.calls[0][1].instructions, systemFor(input)]) {
        expect(instructions).toContain('Evaluate the target and intended announcement together');
        expect(instructions).toContain('Merlin can identify you specifically as Mordred');
        expect(instructions).toContain('after mission 4 there is no next check to control');
        expect(instructions).toContain('decisive Evil gain can justify exposure');
        expect(instructions).toContain('Among comparably valuable plans');
        expect(instructions).toContain('known Evil target followed by a truthful Evil announcement');
        expect(instructions).toContain('Never give up a decisive winning opportunity for variety');
      }
      expect(generate.mock.calls[0][0].choices).toEqual(input.choices);
      expect(reply.choice).toBe(0);
      expect(generate).toHaveBeenCalledTimes(1);
    }
  },
);

test('Mordred can truthfully expose the inspected ally without the server replacing that choice', async () => {
  const input = inspection(3, 'smart');
  input.state.stage = 'announceLoyalty';
  input.state.players[6].role = 'mordred';
  input.state.players[0].role = 'evil';
  input.state.players[0].features.isSelected = true;
  input.choices = ['good', 'evil'];
  input.privateCheck = 'evil';
  input.speak = false;
  const generate = jest.fn().mockResolvedValue({ choice: 1, speech: 'Truth preserves my cover.' });
  const result = await decisionPipeline(generate)(input);
  expect(result).toMatchObject({ choice: 1, speech: '', privateReason: 'Truth preserves my cover.' });
  expect(generate).toHaveBeenCalledTimes(1);
});

test.each(['onMission', 'votingForTeam'] as const)(
  'Lady variety advice does not change the %s winning-action instructions',
  async (stage) => {
    const input = inspection(3, 'smart');
    input.state.stage = stage;
    input.state.players[6].role = 'mordred';
    input.choices = stage === 'onMission' ? ['success', 'fail'] : ['approve', 'reject'];
    input.speak = false;
    const generate = jest.fn().mockResolvedValue({ choice: stage === 'onMission' ? 1 : 0, speech: 'Win now.' });
    await decisionPipeline(generate)(input);
    for (const instructions of [generate.mock.calls[0][1].instructions, systemFor(input)]) {
      expect(instructions).not.toContain('Among comparably valuable plans');
    }
  },
);
