import type { VisualGameState } from '../game/state';

/** Only the fields needed by player statistics; excludes history, chat and actions. */
export type PlayerGameSummary = {
  /** Optional archive timestamp for restoring chronological order after pagination. */
  startAt?: string;
  uuid: string;
  players: Pick<VisualGameState['players'][number], 'id' | 'role'>[];
  result?: Pick<NonNullable<VisualGameState['result']>, 'winner'>;
};

export type PlayerGameSummaryPage = { games: PlayerGameSummary[]; nextCursor?: string };
