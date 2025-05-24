import { Room } from '@/room';

export type IBusEvents = {
  roomUpdated: (roomOrID: Room | string) => void;
  playerReachTop1: (playerID: string) => void;
  playerRevealSecret: (playerID: string) => void;
  gameEnded: (roomID: string) => void;
  restartRoom: (room: Room) => void;
  destroyRoom: (room: Room) => void;
};
