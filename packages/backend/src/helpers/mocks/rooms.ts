import type { TRoomsList } from '@avalon/types';
import { fakeGames } from './game';

// Derive the lobby projection from the same room states so IDs and counts stay consistent.
export const fakeRooms: TRoomsList = fakeGames.map((room) => ({
  hostID: room.leaderID,
  state: room.stage,
  uuid: room.roomID,
  options: room.options,
  createAt: room.createAt,
  players: room.players.length,
  ...(room.stage === 'started' ? { startAt: room.startAt, result: room.game.result } : {}),
}));
