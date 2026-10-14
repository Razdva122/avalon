import type { AiPlayerCount } from './index';

export type AiHumanRole = 'merlin' | 'percival' | 'servant' | 'mordred' | 'morgana' | 'oberon' | 'minion';

/** Roles present in the fixed bot table composition. */
export function aiHumanRoles(playerCount: AiPlayerCount): AiHumanRole[] {
  return [
    'merlin',
    'percival',
    'servant',
    'mordred',
    'morgana',
    ...(playerCount === 7 ? ['oberon' as const] : []),
    ...(playerCount === 8 ? ['minion' as const] : []),
  ];
}
