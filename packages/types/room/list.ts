import type { IGameOptions, TGameResults } from '@avalon/types';

export type TRoomsList = TRoomInfo[];

export type TRoomInfo = {
  host: string;
  players: number;
  state: 'created' | 'started' | 'locked';
  uuid: string;
  options: IGameOptions;
  result?: TGameResults;
};
