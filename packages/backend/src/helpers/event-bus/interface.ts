import { Room } from '@/room';
import { VisualGameState } from '@avalon/types';

export type IBusEvents = {
  roomUpdated: (roomOrID: Room | string) => void;
  processGame: (game: VisualGameState) => void;
  playerReachTop1: (playerID: string) => void;
  playerRevealSecret: (playerID: string) => void;
  gameEnded: (roomID: string) => void;
  restartRoom: (room: Room) => void;
  destroyRoom: (room: Room) => void;
};
