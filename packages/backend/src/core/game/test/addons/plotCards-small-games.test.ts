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

        const ambushIndex = game.addons.plotCards!.cards.findIndex((card) => card.name === 'ambush');
        const ambushCard = game.addons.plotCards!.cards.splice(ambushIndex, 1)[0];
        game.addons.plotCards!.cards.unshift(ambushCard);

        const ambushIndex2 = game.addons.plotCards!.cards.findIndex(
          (card) => card.name === 'ambush' && card !== ambushCard,
        );
        const ambushCard2 = game.addons.plotCards!.cards.splice(ambushIndex2, 1)[0];
        game.addons.plotCards!.cards.unshift(ambushCard2);
      });

      const playerWithFirstAmbush = game.players.find((player) => player !== game.leader)!;
      const playerWithSecondAmbush = game.players.find(
        (player) => player !== game.leader && player.user.id !== playerWithFirstAmbush.user.id,
      )!;

      gameHelper.giveCard([
        ['ambush', playerWithFirstAmbush.user.id],
        ['ambush', playerWithSecondAmbush.user.id],
      ]);

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

  // Test for KingReturns card
  describe('KingReturns card', () => {
    test('Should allow player to decline voting and move leader', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5);

      const playerWithKingReturns = game.players.find((player) => player !== game.leader)!;

      gameHelper.giveCard('kingReturns', playerWithKingReturns.user.id);

      expect(
        game.addons.plotCards!.cardsInGame.find(
          (card) => card.name === 'kingReturns' && card.ownerID === playerWithKingReturns.user.id,
        ),
      ).toBeDefined();

      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes();

      expect(game.stage).toBe('kingReturns');

      gameHelper.useKingReturns(true);

      expect(game.stage).toBe('selectTeam');

      expect(game.addons.plotCards!.cardsInGame.find((card) => card.name === 'kingReturns')).toBeUndefined();

      const lastHistoryEl = _.last(game.history)!;
      expect(lastHistoryEl.type).toBe('kingReturns');
    });

    test('Should allow player to skip using the kingReturns card', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5);

      const playerWithKingReturns = game.players.find((player) => player !== game.leader)!;

      gameHelper.giveCard('kingReturns', playerWithKingReturns.user.id);

      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes();

      expect(game.stage).toBe('kingReturns');

      gameHelper.useKingReturns(false);

      expect(game.stage).toBe('onMission');

      const kingReturnsCard = game.addons.plotCards!.cardsInGame.find(
        (card) => card.name === 'kingReturns' && card.ownerID === playerWithKingReturns.user.id,
      );
      expect(kingReturnsCard).toBeDefined();
      expect(kingReturnsCard!.stage).toBe('has');

      const lastHistoryEl = _.last(game.history)!;
      expect(lastHistoryEl.type).not.toBe('kingReturns');
    });

    test('Should end game if 5 vote will be rejected', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5);

      gameHelper.giveCard('kingReturns');

      for (let i = 0; i < 4; i += 1) {
        gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes(5);
      }

      gameHelper.selectPlayersOnMission().sentSelectedPlayers().useKingReturns(true);

      expect(game.stage).toBe('end');
      expect(game.result?.winner).toBe('evil');
      expect(game.result?.reason).toBe('rejectedVote');
    });
  });

  // Test for RestoreHonor card
  describe('RestoreHonor card', () => {
    test('Should skip stage if cards for steal does not exist', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5, (game) => {
        const restoreHonorIndex = game.addons.plotCards!.cards.findIndex((card) => card.name === 'restoreHonor');
        const restoreHonorCard = game.addons.plotCards!.cards.splice(restoreHonorIndex, 1)[0];
        game.addons.plotCards!.cards.unshift(restoreHonorCard);
      });

      gameHelper.giveCard('restoreHonor');

      expect(game.addons.plotCards!.cardsInGame.length).toBe(0);

      expect(game.stage).toBe('selectTeam');
    });

    test('Should transfer ambush card from one player to another', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5, (game) => {
        game.addons.plotCards!.cardsPerRound = 2;

        const restoreHonorIndex = game.addons.plotCards!.cards.findIndex((card) => card.name === 'restoreHonor');
        const restoreHonorCard = game.addons.plotCards!.cards.splice(restoreHonorIndex, 1)[0];
        game.addons.plotCards!.cards.unshift(restoreHonorCard);

        const ambushIndex = game.addons.plotCards!.cards.findIndex((card) => card.name === 'ambush');
        const ambushCard = game.addons.plotCards!.cards.splice(ambushIndex, 1)[0];
        game.addons.plotCards!.cards.unshift(ambushCard);
      });

      // Get two different players
      const player1 = game.players.find((player) => player !== game.leader)!;
      const player2 = game.players.find((player) => player !== game.leader && player !== player1)!;

      gameHelper.giveCard([
        ['ambush', player1.user.id],
        ['restoreHonor', player2.user.id],
      ]);

      expect(game.stage).toBe('restoreHonor');

      const ambushCard = game.addons.plotCards!.cardsInGame.find(
        (card) => card.name === 'ambush' && card.ownerID === player1.user.id,
      );

      // Use restoreHonor card to take ambush card from player1
      gameHelper.useRestoreHonor(player1.user.id, ambushCard!.id);

      // Verify ambush card now belongs to player2
      expect(ambushCard!.ownerID).toBe(player2.user.id);

      // Verify restoreHonor card has been removed from the game
      expect(game.addons.plotCards!.cardsInGame.find((card) => card.name === 'restoreHonor')).toBeUndefined();

      // Check that the history contains a restoreHonor entry
      const lastHistoryEl = _.last(game.history.filter((h) => h.type === 'restoreHonor'))!;
      expect(lastHistoryEl).toBeDefined();
      expect(lastHistoryEl.type).toBe('restoreHonor');
    });
  });
});
