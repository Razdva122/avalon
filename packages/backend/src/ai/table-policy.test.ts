import { decisionPipeline } from './pipeline';
import fixtures from './fixtures/postulates.json';
import type { BotRequest } from './client';

// These fixtures check that prompts leave strategy to the model; dominated-move guards are tested separately.
beforeAll(() => {
  process.env.AI_DECISION_GUARDS = 'off';
});
afterAll(() => {
  delete process.env.AI_DECISION_GUARDS;
});

test.each(
  fixtures.filter((f) =>
    ['mission-five-proven-evil', 'postulate-mordred-2', 'self-inclusion-proposal'].includes(f.name),
  ),
)('strategy remains with the model for $name', async (fixture) => {
  const request = fixture.request as unknown as BotRequest;
  const inputs: BotRequest[] = [];
  const result = await decisionPipeline(async (r) => {
    inputs.push(r);
    return { choice: 0, speech: 'Private strategy.', publicReason: 'Давайте разберём, что изменилось.' };
  })(request);
  expect(inputs).toHaveLength(1);
  expect(inputs[0].choices).toEqual(request.choices);
  expect(result.choice).toBe(0);
  expect(result.speech).toBe(request.speak ? 'Давайте разберём, что изменилось.' : '');
});
