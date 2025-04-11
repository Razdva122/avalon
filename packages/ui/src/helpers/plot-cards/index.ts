import { computed } from 'vue';
import type { VisualGameState, TPlotCardNames } from '@avalon/types';
import type { Ref } from 'vue';

/**
 * Check if a player has a card (any stage)
 * @param game The game state
 * @param playerID The ID of the player to check
 * @param cardName The name of the card to check for
 * @returns Boolean indicating if the player has the card
 */
export const hasCard = (game: VisualGameState, playerID?: string, cardName?: TPlotCardNames): boolean => {
  if (!playerID || !cardName || !game.addonsData?.plotCards?.cardsInGame) {
    return false;
  }

  return game.addonsData.plotCards.cardsInGame.some((card) => card.name === cardName && card.ownerID === playerID);
};

/**
 * Check if a player has a card in the active stage
 * @param game The game state
 * @param playerID The ID of the player to check
 * @param cardName The name of the card to check for
 * @returns Boolean indicating if the player has the active card
 */
export const hasActiveCard = (game: VisualGameState, playerID?: string, cardName?: TPlotCardNames): boolean => {
  if (!playerID || !cardName || !game.addonsData?.plotCards?.cardsInGame) {
    return false;
  }

  return game.addonsData.plotCards.cardsInGame.some(
    (card) => card.name === cardName && card.ownerID === playerID && card.stage === 'active',
  );
};

/**
 * Get all cards owned by a player
 * @param game The game state
 * @param playerID The ID of the player
 * @returns Array of cards owned by the player
 */
export const getPlayerCards = (game: VisualGameState, playerID?: string) => {
  if (!playerID || !game.addonsData?.plotCards?.cardsInGame) {
    return [];
  }

  return game.addonsData.plotCards.cardsInGame
    .filter((card) => card.ownerID === playerID)
    .map((card) => ({ id: card.id, name: card.name, stage: card.stage }));
};

/**
 * Check if a player is adjacent (left or right) to another player
 * @param game The game state
 * @param playerID The ID of the player
 * @param targetPlayerID The ID of the target player to check adjacency with
 * @returns Boolean indicating if the target player is adjacent to the player
 */
export const isAdjacentPlayer = (game: VisualGameState, playerID?: string, targetPlayerID?: string): boolean => {
  if (!playerID || !targetPlayerID || playerID === targetPlayerID) {
    return false;
  }

  const players = game.players;

  // Find the indices of both players
  const playerIndex = players.findIndex((player) => player.id === playerID);
  const targetIndex = players.findIndex((player) => player.id === targetPlayerID);

  if (playerIndex === -1 || targetIndex === -1) {
    return false;
  }

  const playerCount = players.length;

  // Check if target is to the right (next)
  const rightIndex = (playerIndex + 1) % playerCount;

  // Check if target is to the left (previous)
  const leftIndex = (playerIndex - 1 + playerCount) % playerCount;

  return targetIndex === rightIndex || targetIndex === leftIndex;
};

/**
 * Create a computed property that checks if a player has an active card
 * @param game Ref to the game state
 * @param playerID Ref to the player ID
 * @param cardName The name of the card to check for
 * @returns Computed boolean indicating if the player has the active card
 */
export const useHasActiveCard = (
  game: Ref<VisualGameState>,
  playerID: Ref<string | undefined>,
  cardName: TPlotCardNames,
) => {
  return computed(() => hasActiveCard(game.value, playerID.value, cardName));
};

export const useHaveActiveLoyaltyCard = (game: Ref<VisualGameState>, playerID: Ref<string | undefined>) => {
  return computed(
    () =>
      hasActiveCard(game.value, playerID.value, 'showNature') ||
      hasActiveCard(game.value, playerID.value, 'areYouTheOne') ||
      hasActiveCard(game.value, playerID.value, 'showStrength'),
  );
};

/**
 * Create a computed property that checks if a player has a card (any stage)
 * @param game Ref to the game state
 * @param playerID Ref to the player ID
 * @param cardName The name of the card to check for
 * @returns Computed boolean indicating if the player has the card
 */
export const useHasCard = (game: Ref<VisualGameState>, playerID: Ref<string | undefined>, cardName: TPlotCardNames) => {
  return computed(() => hasCard(game.value, playerID.value, cardName));
};

/**
 * Create a computed property that gets all cards owned by a player
 * @param game Ref to the game state
 * @param playerID Ref to the player ID
 * @returns Computed array of cards owned by the player
 */
export const usePlayerCards = (game: Ref<VisualGameState>, playerID: Ref<string | undefined>) => {
  return computed(() => getPlayerCards(game.value, playerID.value));
};

/**
 * Create a computed property that checks if a player is adjacent to another player
 * @param game Ref to the game state
 * @param playerID Ref to the player ID
 * @param targetPlayerID Ref to the target player ID
 * @returns Computed boolean indicating if the target player is adjacent to the player
 */
export const useIsAdjacentPlayer = (
  game: Ref<VisualGameState>,
  playerID: Ref<string | undefined>,
  targetPlayerID: Ref<string | undefined>,
) => {
  return computed(() => isAdjacentPlayer(game.value, playerID.value, targetPlayerID.value));
};
