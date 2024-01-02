import { IVisualGameState, TAvailableRoom } from '@avalon/types';

export function mutateRoomGameForPosition<T extends TAvailableRoom | IVisualGameState>(
  roomOrGame: T,
  userID?: string,
): T {
  if (userID) {
    const indexOfPlayer = roomOrGame.players.findIndex((player) => player.id === userID);

    if (indexOfPlayer !== -1) {
      roomOrGame.players = [...roomOrGame.players.slice(indexOfPlayer), ...roomOrGame.players.slice(0, indexOfPlayer)];
    }
  }

  return roomOrGame;
}
