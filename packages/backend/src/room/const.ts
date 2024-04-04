import type { TVoteTarget } from '@avalon/types';

export const votesText: { [key in TVoteTarget]: string } = {
  endGame: 'Voting to end the game',
  endAndRestartGame: 'Voting to end the game and start a new one',
};
