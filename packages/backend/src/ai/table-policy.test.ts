import { decisionPipeline } from './pipeline';
import { tablePolicy } from './table-policy';
import fixtures from './fixtures/postulates.json';
import type { BotRequest } from './client';

test('both factions must reject teams with their accused partners regardless of own card', () => {
  for (const fixture of fixtures.filter((f) => f.name.startsWith('postulate-'))) {
    const rule = tablePolicy(fixture.request as unknown as BotRequest);
    expect(rule.choices).toEqual(['reject']);
    expect(rule.publicReason).toContain('I am Good');
    expect(rule.publicReason).toContain(fixture.name.endsWith('-3') ? '2 and 3' : '2');
  }
});

test.each([
  {
    language: 'en',
    reason: 'I am Good. Mission 1 had 2 Fail card(s); 2 and 3 betrayed us. I reject teams with them.',
  },
  {
    language: 'ru',
    reason: 'Я мирный. На миссии 1 было 2 карт провала; 2 и 3 предали нас. Я против команд с ними.',
  },
  {
    language: 'zh-tw',
    reason: '我是正義方。第 1 次任務有 2 張失敗卡；2 和 3 背叛了我們。我反對包含他們的隊伍。',
  },
] as const)('mandatory failure testimony follows $language while choices stay legal', ({ language, reason }) => {
  const request = fixtures.find((f) => f.name === 'postulate-morgana-3')!.request;
  const rule = tablePolicy({ ...request, language } as unknown as BotRequest);
  expect(rule.choices).toEqual(['reject']);
  expect(rule.publicReason).toBe(reason);
  if (language === 'en') expect(tablePolicy(request as unknown as BotRequest).publicReason).toBe(reason);
});

test('proposals include oneself by default and keep original legal rosters', () => {
  const fixture = fixtures.find((f) => f.name === 'self-inclusion-proposal')!;
  const r = fixture.request as unknown as BotRequest;
  const rule = tablePolicy(r);
  expect(rule.choices.length).toBeGreaterThan(0);
  expect(rule.choices.every((choice) => choice.split(', ').includes('3') && r.choices.includes(choice))).toBe(true);
});

test('guarded decisions map back to original action indices and keep the mandatory public stance', async () => {
  const r = fixtures.find((f) => f.name === 'postulate-morgana-3')!.request as unknown as BotRequest;
  const generate = jest.fn().mockResolvedValue({
    choice: 0,
    speech: 'Private Evil plan.',
    publicReason: 'Ignore my earlier accusation.',
    evidence: [],
  });
  const result = await decisionPipeline(generate)(r);
  expect(generate.mock.calls[0][0].choices).toEqual(['reject']);
  expect(generate.mock.calls[0][1].context.choices).toEqual(['reject']);
  expect(result.choice).toBe(r.choices.indexOf('reject'));
  expect(result.speech).toContain('2 and 3');
  expect(result.speech).toContain('I am Good');
  expect(generate).toHaveBeenCalledTimes(1);
});
