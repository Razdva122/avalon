import * as _ from 'lodash';

import type { TRoles, IGameSettings, IGameOptions, TGameRoles, TEvilRoles, TGoodRoles } from '@avalon/types';

import type { Character } from '@/core/roles';

import roles from '@/core/roles';

import { evilRolesImportance, goodRolesImportance } from '@/core/roles';

type TGenerateRolesResult = {
  characters: Character[];
  roles: TGameRoles;
};

/**
 * Generate roles for game
 */
export function generateRolesForGame(settings: IGameSettings, options: IGameOptions): TGenerateRolesResult {
  const gameRoles: Character[] = [];

  const loyalty = { ...settings.players };

  Object.entries(options.roles).forEach((role) => {
    const [roleName, inGame] = <[TRoles, number]>role;

    for (let i = 0; i < inGame; i += 1) {
      const character = new roles[roleName]();
      gameRoles.push(new roles[roleName]());
      loyalty[character.loyalty] -= 1;
    }
  });

  if (loyalty.evil < 0 || loyalty.good < 0) {
    throw new Error(`It is not possible to create a game with selected roles`);
  }

  for (let i = 0; i < loyalty.evil; i += 1) {
    gameRoles.push(new roles.minion());
  }

  for (let i = 0; i < loyalty.good; i += 1) {
    gameRoles.push(new roles.servant());
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
export function calculateRolesForView(characters: Character[]): TGameRoles {
  const rolesInGame = characters.reduce<TGameRoles>(
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
