import type { PlayerGameSummary, PlayerGameSummaryPage } from '@avalon/types';

/** Each response is bounded; preserve complete lifetime statistics across pages. */
export async function loadPlayerGames(
  load: (cursor?: string) => Promise<PlayerGameSummaryPage | { error: string }>,
  current: () => boolean,
): Promise<PlayerGameSummary[]> {
  const games: PlayerGameSummary[] = [];
  const visited = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await load(cursor);
    if (!current()) return [];
    if ('error' in page || !Array.isArray(page.games)) throw Error('Player statistics unavailable');
    games.push(...page.games);
    cursor = page.nextCursor;
    if (cursor && visited.has(cursor)) throw Error('Repeated history cursor');
    if (cursor) visited.add(cursor);
  } while (cursor);
  return games;
}
