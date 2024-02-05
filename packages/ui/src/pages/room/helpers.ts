import { IVisualGameState, TAvailableRoom, TRoomState } from '@avalon/types';
import { TPageRoomStateRef } from '@/pages/room/const';

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

export function mutateRoomState({
  roomState,
  newRoomState,
  newGameState,
}: {
  roomState: TPageRoomStateRef;
  newRoomState?: TRoomState;
  newGameState?: IVisualGameState;
}): void {
  if (newRoomState) {
    if (newRoomState.stage === 'started') {
      const game = newRoomState.game;

      roomState.value = {
        ...newRoomState,
        pointer: 0,
        gameStates: [game],
      };
    } else {
      roomState.value = {
        ...newRoomState,
      };
    }
  }

  if (newGameState && roomState.value.stage === 'started') {
    if (roomState.value.gameStates.length - 1 === newGameState.history.length) {
      roomState.value.gameStates[roomState.value.gameStates.length - 1] = newGameState;
    } else {
      while (roomState.value.gameStates.length - 1 !== newGameState.history.length) {
        roomState.value.gameStates[roomState.value.gameStates.length - 1].history = newGameState.history.slice(
          0,
          roomState.value.gameStates.length,
        );
        roomState.value.gameStates.push(newGameState);
        roomState.value.pointer += 1;
      }
    }
  }
}
