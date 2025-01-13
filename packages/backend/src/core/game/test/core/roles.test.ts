import { generateNewGame, settings } from '@/core/game/test/const';

const { game, gameHelper } = generateNewGame({}, { merlin: 1, percival: 1, mordred: 1, morgana: 1 });

const servantId = game.players.find((player) => player.role.role === 'servant')!.user.id;
const merlinId = game.players.find((player) => player.role.role === 'merlin')!.user.id;
const morganaId = game.players.find((player) => player.role.role === 'morgana')!.user.id;
const minionId = game.players.find((player) => player.role.role === 'minion')!.user.id;
const mordredId = game.players.find((player) => player.role.role === 'mordred')!.user.id;
const percivalId = game.players.find((player) => player.role.role === 'percival')!.user.id;

describe('Roles', () => {
  test('Game have valid amount of player in both teams', () => {
    const loyalty = game.players.reduce(
      (acc, el) => {
        acc[el.role.loyalty] += 1;
        return acc;
      },
      { evil: 0, good: 0 },
    );

    expect(loyalty).toEqual(settings.players);
  });

  test('All visibility is empty', () => {
    expect(game.visibleRolesState['all']).toBe(undefined);
  });

  test('Servant dont see anyone', () => {
    expect(game.visibleRolesState[servantId]).toStrictEqual({ [servantId]: 'servant' });
  });

  test('Merlin see morgana and minion and dont know their roles', () => {
    expect(game.visibleRolesState[merlinId]).toStrictEqual({
      [morganaId]: 'evil',
      [merlinId]: 'merlin',
      [minionId]: 'evil',
    });
  });

  test('Percival see morgana and merlin but dont know their roles', () => {
    expect(game.visibleRolesState[percivalId]).toStrictEqual({
      [percivalId]: 'percival',
      [merlinId]: 'mysteryWizard',
      [morganaId]: 'mysteryWizard',
    });
  });

  test('Minion see his teammates', () => {
    expect(game.visibleRolesState[minionId]).toStrictEqual({
      [minionId]: 'minion',
      [morganaId]: 'evil',
      [mordredId]: 'evil',
    });
  });

  test('Should reveal all roles in end of game', () => {
    for (let i = 0; i < 3; i += 1) {
      gameHelper.selectPlayersOnMission(1).sentSelectedPlayers().makeVotes().makeActions(1);
    }

    const roles = game.players.reduce<any>((acc, el) => {
      acc[el.user.id] = el.role.role;
      return acc;
    }, {});

    expect(game.visibleRolesState.all).toStrictEqual(roles);
  });
});
