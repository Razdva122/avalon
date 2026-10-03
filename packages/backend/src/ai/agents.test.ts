import { BOT_AGENTS, selectBotAgents, getBotProfile } from './agents';
import { compactRequest } from './client';
import { BotRoom } from './room';
import type { Server } from '@avalon/types';
import type { BotRequest } from './client';
import { commonAvatars } from '@/user/avatars/common';
import { achievementsAvatars } from '@/user/avatars/achievements';
import { existsSync } from 'fs';
import { resolve } from 'path';

const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;

test('ten persistent agents have distinct profiles, personalities and existing avatar IDs', () => {
  expect(BOT_AGENTS).toHaveLength(10);
  for (const key of ['id', 'name', 'avatar', 'style'] as const)
    expect(new Set(BOT_AGENTS.map((agent) => agent[key])).size).toBe(10);
  const avatars = [...commonAvatars, ...achievementsAvatars].map((a) => a.id);
  for (const agent of BOT_AGENTS) {
    expect(avatars).toContain(agent.avatar);
    const group = ['lady_of_lake', 'excalibur'].includes(agent.avatar) ? 'features' : 'roles';
    expect(existsSync(resolve(__dirname, '../../../ui/src/assets/images', group, agent.avatar + '.webp'))).toBe(true);
    expect(getBotProfile(agent.id)?.aiPersona?.description).toBeTruthy();
  }
  expect(getBotProfile('avalon-ai-1')).toEqual({ id: 'avalon-ai-1', name: 'Alice · AI', avatar: 'servant' });
  expect(getBotProfile('human')).toBeUndefined();
});

test('a fresh roster draws seven unique agents without changing the persistent pool', () => {
  const before = BOT_AGENTS.map((a) => a.id);
  const first = selectBotAgents(() => 0);
  const second = selectBotAgents((bound) => bound - 1);
  expect(first).toHaveLength(7);
  expect(new Set(first.map((a) => a.id)).size).toBe(7);
  expect(first.map((a) => a.id)).not.toEqual(second.map((a) => a.id));
  expect(BOT_AGENTS.map((a) => a.id)).toEqual(before);
});

test.each([5, 6, 8] as const)('a %i-player roster draws unique agents from the same persistent pool', (count) => {
  const before = BOT_AGENTS.map((agent) => agent.id);
  const first = selectBotAgents(() => 0, count);
  const second = selectBotAgents((bound) => bound - 1, count);
  expect(first).toHaveLength(count);
  expect(new Set(first.map((agent) => agent.id)).size).toBe(count);
  expect(first.every((agent) => BOT_AGENTS.includes(agent))).toBe(true);
  expect(first.map((agent) => agent.id)).not.toEqual(second.map((agent) => agent.id));
  expect(BOT_AGENTS.map((agent) => agent.id)).toEqual(before);
});

test('the selected agent personality reaches actual decision context and the roster stays fixed', async () => {
  const seen: BotRequest[] = [];
  const room = new BotRoom('agent-room', 'admin', io, async (request) => {
    seen.push(request);
    room.stop();
    return { choice: 0, speech: '' };
  });
  const players = [...room.players];
  await room.run();
  expect(room.players).toEqual(players);
  expect(seen).toHaveLength(1);
  const agent = BOT_AGENTS.find((a) => a.id === seen[0].playerID)!;
  expect(seen[0].style).toBe(agent.style);
  expect(compactRequest(seen[0]).personality).toBe(agent.style);
});

test('all new agents use English nicknames and model instructions with a stable persona translation key', () => {
  for (const agent of BOT_AGENTS) {
    expect(agent.name).toMatch(/^[A-Za-z]+ · AI$/);
    expect(agent.style).not.toMatch(/[А-Яа-яЁё]/);
    expect(agent.aiPersona?.key).toMatch(/^[a-z]+$/);
  }
});
