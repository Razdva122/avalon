import { decisionPipeline } from './pipeline';
import fixtures from './fixtures/postulates.json';
import type { BotRequest } from './client';

test.each(fixtures.filter((f) => f.request.state.stage !== 'end'))(
  'strategy remains with the model for $name',
  async (fixture) => {
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
  },
);
