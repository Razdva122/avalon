import { Room } from '@/room';

export type IBusEvents = {
  roomUpdated: (room: Room) => void;
  restartRoom: (room: Room) => void;
};
