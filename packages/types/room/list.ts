import type { GameOptions, GameResults } from '@avalon/types';

export type TRoomsList = TRoomInfo[];

export type TRoomInfo = {
  host: string;
  players: number;
  state: 'created' | 'started' | 'locked';
  uuid: string;
  options: GameOptions;
  createTime: string;
  startTime?: string;
  result?: GameResults;
};
