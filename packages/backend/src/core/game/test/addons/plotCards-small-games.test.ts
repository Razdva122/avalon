import { generateNewGame } from '@/core/game/test/const';
import * as _ from 'lodash';

let { game, gameHelper } = generateNewGame();

describe('PlotCards in 5-6 player games', () => {
  beforeAll(() => {
    const restart = generateNewGame({ plotCards: true }, {}, 5);
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('Should initialize with correct number of cards and cardsPerRound=1', () => {
    expect(game.addons.plotCards!.cards.length).toBe(7); // Total cards for 5-6 player games
    expect(game.addons.plotCards!.cardsPerRound).toBe(1); // Only 1 card per round
  });

  test('Should activate only one card per round', () => {
    const initialPointer = game.addons.plotCards!.pointer;

    // Complete a round to trigger card activation
    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();

    // Check that only one card was activated
    expect(game.addons.plotCards!.pointer).toBe(initialPointer + 1); // Pointer should have moved by 1
  });

  test('Should have the correct cards for 5-6 player games', () => {
    // Reset the game for a clean state
    const restart = generateNewGame({ plotCards: true }, {}, 5);
    game = restart.game;

    // Get all card names
    const cardNames = game.addons.plotCards!.cards.map((card) => card.name);

    // Count occurrences of each card
    const cardCounts: Record<string, number> = {};
    cardNames.forEach((name) => {
      cardCounts[name] = cardCounts[name] ?? 0;
      cardCounts[name] += 1;
    });

    // Check that we have the expected cards for 5-6 player games
    expect(cardCounts['leadToVictory']).toBe(2); // 2 LeadToVictory cards
    expect(cardCounts['ambush']).toBe(2); // 2 Ambush cards
    expect(cardCounts['kingReturns']).toBe(1); // 1 KingReturns card
    expect(cardCounts['restoreHonor']).toBe(1); // 1 RestoreHonor card
    expect(cardCounts['charge']).toBe(1); // 1 Charge card
  });

  test('Should not have cards specific to 7+ player games', () => {
    // Reset the game for a clean state
    const restart = generateNewGame({ plotCards: true }, {}, 5);
    game = restart.game;

    // Get all card names
    const cardNames = game.addons.plotCards!.cards.map((card) => card.name);

    // Check that we don't have cards specific to 7+ player games
    expect(cardNames.includes('showNature')).toBe(false);
    expect(cardNames.includes('areYouTheOne')).toBe(false);
    expect(cardNames.includes('weFoundYou')).toBe(false);
    expect(cardNames.includes('showStrength')).toBe(false);
  });
});

// Tests for the actual card logic
describe('Plot Cards Logic', () => {
  // Test for LeadToVictory card
  describe('LeadToVictory card', () => {
    test('Should allow player to become leader', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5);

      const originalLeader = game.leader;
      const nonLeaderPlayer = game.players.find(
        (player) => !player.features.isLeader && originalLeader.next !== player,
      )!;

      gameHelper.giveCard('leadToVictory', nonLeaderPlayer.user.id);

      expect(
        game.addons.plotCards!.cardsInGame.find(
          (card) => card.name === 'leadToVictory' && card.ownerID === nonLeaderPlayer.user.id,
        ),
      ).toBeDefined();

      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes(5);

      expect(game.stage).toBe('leadToVictory');

      gameHelper.useLeadToVictory(true);

      expect(game.leader).not.toBe(originalLeader);
      expect(game.leader).toBe(nonLeaderPlayer);

      const lastHistoryEl = _.last(game.history)!;
      expect(lastHistoryEl.type).toBe('leadToVictory');

      expect(game.addons.plotCards!.cardsInGame.find((card) => card.name === 'leadToVictory')).toBeUndefined();
    });
  });

  // Test for Ambush card
  describe('Ambush card', () => {
    test("Should allow player to see another player's mission action", () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5);

      const playerWithAmbush = game.players.find((player) => player !== game.leader)!;

      gameHelper.giveCard('ambush', playerWithAmbush.user.id);

      expect(
        game.addons.plotCards!.cardsInGame.find(
          (card) => card.name === 'ambush' && card.ownerID === playerWithAmbush.user.id,
        ),
      ).toBeDefined();

      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();

      expect(game.stage).toBe('ambush');

      const targetPlayer = game.currentMission.data.actions[0].player;

      gameHelper.useAmbush(targetPlayer.user.id);

      const lastHistoryEl = _.last(game.history)!;
      expect(lastHistoryEl.type).toBe('mission');
      expect(game.history[game.history.length - 2].type).toBe('ambush');

      expect(game.addons.plotCards!.cardsInGame.find((card) => card.name === 'ambush')).toBeUndefined();
      expect(game.addons.plotCards!.crossCardsStorage.ambushUsedOn).toContain(targetPlayer.user.id);
    });

    test('Should not allow using Ambush on a player who was already targeted', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5, (game) => {
        game.addons.plotCards!.cardsPerRound = 2;
      });

      const playerWithFirstAmbush = game.players.find((player) => player !== game.leader)!;
      const playerWithSecondAmbush = game.players.find(
        (player) => player !== game.leader && player.user.id !== playerWithFirstAmbush.user.id,
      )!;

      gameHelper.giveCard('ambush', playerWithFirstAmbush.user.id);
      gameHelper.giveCard('ambush', playerWithSecondAmbush.user.id);

      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();

      expect(game.stage).toBe('ambush');

      const targetPlayer = game.currentMission.data.actions[0].player;

      gameHelper.useAmbush(targetPlayer.user.id);

      expect(game.addons.plotCards!.crossCardsStorage.ambushUsedOn).toContain(targetPlayer.user.id);
      expect(game.stage).toBe('ambush');

      expect(() => gameHelper.useAmbush(targetPlayer.user.id)).toThrow(
        'This player has already been checked by another «ambush» card.',
      );
    });
  });
});
