import { Room } from '@/room';

export type IBusEvents = {
  roomUpdated: (room: Room) => void;
};
