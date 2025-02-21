import type { GameManager } from '@/core/game-manager';

export type TRoomData = TCreatedRoomData | TLockedRoomData | TStartedRoomData;

export type TCreatedRoomData = {
  stage: 'created';
};

export type TLockedRoomData = {
  stage: 'locked';
};

export type TStartedRoomData = {
  stage: 'started';
  manager: GameManager;
};

export type ChatMessage = {
  user: {
    id: string;
    name: string;
  };
  message: string;
  timestamp: number;
};
