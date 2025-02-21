import * as _ from 'lodash';

import {
  TRoles,
  GameSettings,
  IGameOptions,
  GameRoles,
  TEvilRoles,
  TGoodRoles,
  evilRolesImportance,
  goodRolesImportance,
} from '@avalon/types';

import type { Character } from '@/core/roles';

import type { Game } from '@/core/game';

import roles from '@/core/roles';

type TGenerateRolesResult = {
  characters: Character[];
  roles: GameRoles;
};

/**
 * Generate roles for game
 */
export function generateRolesForGame(settings: GameSettings, options: IGameOptions, game: Game): TGenerateRolesResult {
  const gameRoles: Character[] = [];

  const loyalty = { ...settings.players };

  Object.entries(options.roles).forEach((role) => {
    const [roleName, inGame] = <[TRoles, number]>role;

    for (let i = 0; i < inGame; i += 1) {
      const character = new roles[roleName](game);
      gameRoles.push(new roles[roleName](game));
      loyalty[character.loyalty] -= 1;
    }
  });

  if (loyalty.evil < 0 || loyalty.good < 0) {
    throw new Error(`It is not possible to create a game with selected roles`);
  }

  for (let i = 0; i < loyalty.evil; i += 1) {
    gameRoles.push(new roles.minion(game));
  }

  for (let i = 0; i < loyalty.good; i += 1) {
    gameRoles.push(new roles.servant(game));
  }

  const characters = _.shuffle(gameRoles);

  return {
    characters,
    roles: calculateRolesForView(characters),
  };
}

/**
 * Generate roles view in info section
 */
export function calculateRolesForView(characters: Character[]): GameRoles {
  const rolesInGame = characters.reduce<GameRoles>(
    (acc, el) => {
      if (el.loyalty === 'evil') {
        const loyalty = acc[el.loyalty];
        const role = <TEvilRoles>el.role;
        loyalty.push(role);
      } else {
        const loyalty = acc[el.loyalty];
        const role = <TGoodRoles>el.role;
        loyalty.push(role);
      }

      return acc;
    },
    { evil: [], good: [] },
  );

  rolesInGame.good.sort((a, b) => goodRolesImportance[a] - goodRolesImportance[b]);
  rolesInGame.evil.sort((a, b) => evilRolesImportance[a] - evilRolesImportance[b]);

  return rolesInGame;
}
