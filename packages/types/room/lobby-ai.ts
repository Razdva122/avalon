import type { AiPlayerCount } from './index';

export function needsLargeBotGameAccess(playerCount: number, humans: number, arena = false) {
  return playerCount >= 7 && (arena || playerCount - humans > 2);
}

/** Keep locked sizes visible so the lobby can explain their limits. */
export function lobbyAiSizes(humans: number, premium: boolean, weeklyAvailable = false) {
  if (!Number.isInteger(humans) || humans < 1) return [];
  return ([5, 6, 7, 8] as AiPlayerCount[])
    .filter((playerCount) => playerCount > humans)
    .map((playerCount) => ({
      playerCount,
      botCount: playerCount - humans,
      requiresPremium: !premium && !weeklyAvailable && needsLargeBotGameAccess(playerCount, humans),
    }));
}
