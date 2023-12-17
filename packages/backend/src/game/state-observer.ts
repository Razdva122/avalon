/**
 * Сlass for monitoring the state of the game
 */
export abstract class StateObserver {
  abstract gameStateChanged(): void;
}
