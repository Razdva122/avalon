import { applyGameRating } from './rating-operations';
import { VisualGameState } from '@avalon/types';
import { publishTrueSkillSnapshot } from './trueSkillSnapshotStorage';

/**
 * Updates TrueSkill for a single game
 * This can be called immediately when a game ends
 */
export async function updateTrueSkillForGame(gameState: VisualGameState): Promise<void> {
  await applyGameRating(gameState);
}

/**
 * Creates a snapshot of current TrueSkill ratings for historical tracking
 */
export async function createTrueSkillRatingSnapshot(): Promise<void> {
  await publishTrueSkillSnapshot();
}
