import type { AiPlayerCount } from './index';

/** Keep Premium-locked sizes visible so the lobby can explain their limits. */
export function lobbyAiSizes(humans: number, premium: boolean) {
  if (!Number.isInteger(humans) || humans < 1) return [];
  return ([5, 6, 7, 8] as AiPlayerCount[])
    .filter((playerCount) => playerCount > humans)
    .map((playerCount) => ({
      playerCount,
      botCount: playerCount - humans,
      requiresPremium: !premium && playerCount >= 7 && playerCount - humans > 2,
    }));
}
