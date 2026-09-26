import { claimContext, claimSpeech } from './claims';
import type { BotRequest, BotReply } from './client';
const request = (role = 'merlin', stage = 'selectTeam') =>
  ({
    playerID: 'a',
    speak: true,
    state: {
      stage,
      players: [
        { id: 'a', index: 1, role },
        { id: 'b', index: 2, role: 'unknown' },
        { id: 'c', index: 3, role: 'unknown' },
      ],
    },
    chat: [{ name: '2', text: 'I vote reject. I am Percival. 3 is Morgana. Include me in missions and exclude 3.' }],
  }) as unknown as BotRequest;
test('claims are testimony available to everyone, while only eligible roles can make one', () => {
  expect(claimContext(request()).targets).toEqual([2, 3]);
  expect(claimContext(request('servant')).targets).toEqual([]);
  expect(claimContext(request('mordred', 'onMission')).claimants).toEqual([]);
  expect(claimContext(request()).claims).toEqual([{ by: 2, target: 3, status: 'claim' }]);
  expect(claimContext(request()).claimants).toEqual([2]);
});
test('a public turn requires a stance on other claims and allows an intentional Percival claim', () => {
  const reply = { choice: 0, speech: '', claimMorgana: 3, claimStances: [{ seat: 2, stance: 'distrust' }] } as BotReply;
  expect(claimSpeech(request(), reply)).toContain("I distrust 2's Percival claim.");
  expect(claimSpeech(request(), reply)).toContain('I am Percival. 3 is Morgana.');
  expect(() => claimSpeech(request('servant'), reply)).toThrow();
  expect(() => claimSpeech(request(), { choice: 0, speech: '' })).toThrow();
  expect(() => claimSpeech(request(), { ...reply, claimMorgana: 1 })).toThrow();
});

test('past public positions survive recent-chat truncation, and private turns require no response', () => {
  const r = request();
  r.chat.push({ name: '1', text: "I trust 2's Percival claim." });
  expect(claimContext(r).previousStances).toEqual([{ seat: 2, stance: 'trust' }]);
  expect(claimSpeech({ ...r, speak: false }, { choice: 0, speech: '' })).toBe('');
  expect(claimSpeech({ ...r, privateDiscussion: true }, { choice: 0, speech: '' })).toBe('');
  expect(() =>
    claimSpeech(r, {
      choice: 0,
      speech: '',
      claimStances: [
        { seat: 2, stance: 'trust' },
        { seat: 2, stance: 'distrust' },
      ],
    }),
  ).toThrow();
});
