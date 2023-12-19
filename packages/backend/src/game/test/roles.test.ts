import { generateNewGame, settings } from '@/game/test/const';

const { game } = generateNewGame();

describe('Roles', () => {
  test('Game have merlin in players', () => {
    expect(game.players.some((player) => player.role.role === 'merlin')).toBe(true);
  });

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
});
