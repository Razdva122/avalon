import { createSessionInput } from './session-input';
import { decisionInstructions } from './pipeline';
import type { BotRequest } from './client';

const common = 'Keep private facts private. ';
const guide = '\nShared output rules.';
function input(rules: string, context: object) {
  return common + rules + guide + '\nGAME INPUT:\n' + JSON.stringify(context);
}
function apply(state: Record<string, unknown>, message: string) {
  const update = JSON.parse(message);
  for (const key of update.state.remove || []) delete state[key];
  Object.assign(state, update.state.set);
  for (const [key, value] of Object.entries(update.state.arrays || {})) {
    const patch = value as { drop: number; append: unknown[] };
    state[key] = (state[key] as unknown[]).slice(patch.drop).concat(patch.append);
  }
  return update;
}

test('sends rules once and reconstructs corrections, removals, new messages and legal choices exactly', () => {
  const session = createSessionInput(guide);
  const state: Record<string, unknown> = {};
  const chat = Array.from({ length: 8 }, (_, n) => ({ by: (n % 5) + 1, text: `message ${n} `.repeat(12) }));
  const first = { role: 'merlin', task: 'discuss', chat, checks: [], choices: ['1, 2'], optional: 'old' };
  const a = session(input('Discuss teams.', first), common);
  expect(a.message).toContain(common);
  expect(a.instructions).toContain(guide);
  expect(a.message).not.toContain(guide);
  expect(apply(state, a.message).rules).toBe('Discuss teams.');
  expect(state).toEqual(first);
  const next = {
    role: 'merlin',
    task: 'vote',
    chat: [...chat.slice(2), { by: 3, text: 'new message' }],
    checks: [{ target: 4, side: 'evil' }],
    choices: ['approve', 'reject'],
  };
  const b = session(input('Vote now.', next), common);
  expect(b.instructions).toBe(a.instructions);
  const update = apply(state, b.message);
  expect(update.state.set).not.toHaveProperty('role');
  expect(update.state.set).not.toHaveProperty('chat');
  expect(update.state.arrays.chat).toEqual({ drop: 2, append: [{ by: 3, text: 'new message' }] });
  expect(update.state.remove).toEqual(['optional']);
  expect(update.rules).toBe('Vote now.');
  expect(state).toEqual(next);
  const corrected = { ...next, checks: [], choices: ['reject'], chat: [] };
  const c = session(input('Vote now.', corrected), common);
  expect(apply(state, c.message)).not.toHaveProperty('rules');
  expect(state).toEqual(corrected);
});

test('keeps equal-looking repeated messages and each player state independent', () => {
  const one = createSessionInput(guide);
  const two = createSessionInput(guide);
  const snapshot = { chat: ['same', 'same'], privateKnowledge: { role: 'morgana' } };
  const state: Record<string, unknown> = {};
  apply(state, one(input('Talk.', snapshot), common).message);
  const next = { ...snapshot, chat: ['same', 'same', 'same'] };
  apply(state, one(input('Talk.', next), common).message);
  expect(state).toEqual(next);
  const other = JSON.parse(two(input('Talk.', { privateKnowledge: { role: 'servant' } }), common).message);
  expect(other.turn).toBe(1);
  expect(JSON.stringify(other)).not.toContain('morgana');
});

test('replaces changed common rules while preserving state; rejects malformed snapshots', () => {
  const session = createSessionInput(guide);
  session(input('Talk.', { choices: ['a'] }), common);
  const update = JSON.parse(
    session('differentTalk.' + guide + '\nGAME INPUT:\n{"choices":["a"]}', 'different').message,
  );
  expect(update.commonRules).toBe('different');
  expect(update.state).toEqual({});
  expect(() => createSessionInput()(common + '\nGAME INPUT:\n[]', common)).toThrow();
});

test('regular bots can update real stage-dependent common advice without losing their private state', () => {
  const session = createSessionInput();
  const commonFor = (stage: string) =>
    decisionInstructions(
      { language: 'ru', botDifficulty: 'regular', state: { stage, history: [] } } as unknown as BotRequest,
      true,
    );
  const first = commonFor('votingForTeam');
  const second = commonFor('onMission');
  expect(first).not.toBe(second);
  session(first + '\nGAME INPUT:\n{"privateRole":"mordred","stage":"votingForTeam"}', first);
  const next = JSON.parse(
    session(second + '\nGAME INPUT:\n{"privateRole":"mordred","stage":"onMission"}', second).message,
  );
  expect(next.commonRules).toBe(second);
  expect(next.state.set).toEqual({ stage: 'onMission' });
});
