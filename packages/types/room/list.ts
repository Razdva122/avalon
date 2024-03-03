export type TRoomsList = TRoomInfo[];

export type TRoomInfo = {
  host: string;
  state: 'created' | 'started';
  uuid: string;
};
