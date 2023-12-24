// import type { GameManager } from '@/core/game-manager';

export type TRoomData = TCreatedRoomData | TLockedRoomData | TStartedRoomData | TUnavailableData;

export type TCreatedRoomData = {
  stage: 'created';
};

export type TLockedRoomData = {
  stage: 'locked';
};

export type TUnavailableData = {
  stage: 'unavailable';
};

export type TStartedRoomData = {
  stage: 'started';
  // manager: GameManager;
};
