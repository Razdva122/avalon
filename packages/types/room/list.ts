import type { GameOptions, GameResults } from '@avalon/types';

export type TRoomsList = TRoomInfo[];

export type TRoomInfo = {
  ai?: boolean;
  aiStatus?: import('./index').AiRoomState['status'];
  aiModel?: string;
  hostID: string;
  players: number;
  state: 'created' | 'started' | 'locked';
  uuid: string;
  options: GameOptions;
  createAt: string;
  startAt?: string;
  result?: GameResults;
};
