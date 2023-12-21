import type { GameManager } from '@/core/game-manager';

export type TRoomState = TCreatedRoomState | TLockedRoomState | TStartedRoomState;

export type TCreatedRoomState = {
  stage: 'generated';
};

export type TLockedRoomState = {
  stage: 'locked';
};

export type TStartedRoomState = {
  stage: 'started';
  manager: GameManager;
};
