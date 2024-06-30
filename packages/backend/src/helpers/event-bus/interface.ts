import { Room } from '@/room';

export type IBusEvents = {
  roomUpdated: (roomOrID: Room | string) => void;
  restartRoom: (room: Room) => void;
};
