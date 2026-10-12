import type { AiRoomState } from './index';

/** Count reserved empty seats separately from humans and bots. */
export function aiRosterInfo(ai: AiRoomState | undefined, seats: number) {
  if (!ai) return {};
  const aiHumanCount = ai.humanPlayerIDs?.length ?? (ai.humanPlayerID ? 1 : 0);
  const aiOpenSeats = ai.withFriend && ai.status === 'ready' ? Math.max(0, 2 - aiHumanCount) : 0;
  return { aiHumanCount, aiOpenSeats, aiBotCount: Math.max(0, seats - aiHumanCount - aiOpenSeats) };
}
