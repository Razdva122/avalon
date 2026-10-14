import fixture from './fixtures/decisive-match.json';
import { decisionPipeline } from './pipeline';
import type { BotRequest } from './client';

const request = () =>
  structuredClone(fixture.cases.find((entry) => entry.id === 'm5-accuser-discuss')!.request) as unknown as BotRequest;

test.each([
  'I choose 2, 4, 5, 6 because the decisive successes are stronger evidence.',
  'Я выбираю команду 2, 4, 5, 6 после сравнения успешных походов.',
  '我改選2、4、5、6的理由很強：兩敗後這隊曾成功。',
])('an unbracketed selected roster must agree with the action: %s', async (speech) => {
  const input = request();
  const generate = jest
    .fn()
    .mockResolvedValueOnce({ choice: input.choices.indexOf('1, 2, 4, 6'), speech, publicReason: '' })
    .mockResolvedValueOnce({
      choice: input.choices.indexOf('2, 4, 5, 6'),
      speech: 'I choose 2, 4, 5, 6 after comparing the decisive successes.',
      publicReason: '',
    });
  const result = await decisionPipeline(generate)(input);
  expect(generate).toHaveBeenCalledTimes(2);
  expect(generate.mock.calls[1][1].phase).toBe('decision-repair');
  expect(input.choices[result.choice]).toBe('2, 4, 5, 6');
});

test('an explicit public roster also must agree with the action before publication', async () => {
  const input = request();
  const generate = jest.fn().mockResolvedValue({
    choice: input.choices.indexOf('1, 2, 4, 6'),
    speech: 'Compare the successful teams.',
    publicReason: 'I propose 2, 4, 5, 6.',
  });
  await expect(decisionPipeline(generate)(input)).rejects.toThrow('roster');
  expect(generate).toHaveBeenCalledTimes(2);
});

test('historical and hypothetical teams do not become a different selected roster', async () => {
  const input = request();
  const generate = jest.fn().mockResolvedValue({
    choice: input.choices.indexOf('2, 4, 5, 6'),
    speech: 'Mission 1 used 1, 2. An alternative 1, 2, 4, 6 contains that failed pair.',
    publicReason: '第三輪2、4、5、6成功；相比1、2、4、6，我保留原成功隊。',
  });
  const reply = await decisionPipeline(generate)(input);
  expect(generate).toHaveBeenCalledTimes(1);
  expect(input.choices[reply.choice]).toBe('2, 4, 5, 6');
});

test.each([
  'If this is rejected, I propose 1, 2, 4, 6 next. My selected team is 2, 4, 5, 6.',
  'Instead of choosing 1, 2, 4, 6, I choose 2, 4, 5, 6.',
  'I am not choosing 1, 2, 4, 6. I choose 2, 4, 5, 6.',
  'If I choose 1, 2, 4, 6, it contains a failed pair. I choose 2, 4, 5, 6.',
  '如果我選1、2、4、6，就有較大風險。我改選2、4、5、6。',
  '第二輪我選3、4、5；現在我改選2、4、5、6。',
  'I choose 2, 4, 5 and 6.',
  'I choose 2, 4, 5, and 6.',
  'Я выбираю 2, 4, 5 и 6.',
  '我選2、4、5和6。',
  'I choose 2, 4, 5, 6, 1, will you approve?',
  'I propose 1, 2, 4, 6 if this team is rejected. I choose 2, 4, 5, 6.',
  '我選1、2、4、6的話，就有較大風險。我改選2、4、5、6。',
  'Я предлагаю 1, 2, 4, 6 если эту команду отклонят. Я выбираю 2, 4, 5, 6.',
])('a historical, conditional or negative declaration is not the selected team: %s', async (speech) => {
  const input = request();
  const generate = jest.fn().mockResolvedValue({
    choice: input.choices.indexOf('2, 4, 5, 6'),
    speech,
    publicReason: '',
  });
  const reply = await decisionPipeline(generate)(input);
  expect(generate).toHaveBeenCalledTimes(1);
  expect(input.choices[reply.choice]).toBe('2, 4, 5, 6');
});
