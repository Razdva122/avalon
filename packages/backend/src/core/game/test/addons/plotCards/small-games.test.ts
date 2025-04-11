import { generateNewGame } from '@/core/game/test/const';
import { movePlotCardsToStart } from '@/core/game/test/helpers';
import type { Vote } from '@/core/game/history/vote';
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
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5, (game) => {
        movePlotCardsToStart(game, ['leadToVictory']);
      });

      const originalLeader = game.leader;
      const nonLeaderPlayer = game.players.find(
        (player) => !player.features.isLeader && originalLeader.next !== player,
      )!;

      gameHelper.giveCard([nonLeaderPlayer.user.id]);

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
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5, (game) => {
        movePlotCardsToStart(game, ['ambush']);
      });

      const playerWithAmbush = game.players.find((player) => player !== game.leader)!;

      gameHelper.giveCard([playerWithAmbush.user.id]);

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

        movePlotCardsToStart(game, ['ambush', 'ambush']);
      });

      const playerWithFirstAmbush = game.players.find((player) => player !== game.leader)!;
      const playerWithSecondAmbush = game.players.find(
        (player) => player !== game.leader && player.user.id !== playerWithFirstAmbush.user.id,
      )!;

      gameHelper.giveCard([playerWithFirstAmbush.user.id, playerWithSecondAmbush.user.id]);

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
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5, (game) => {
        movePlotCardsToStart(game, ['kingReturns']);
      });

      const playerWithKingReturns = game.players.find((player) => player !== game.leader)!;

      gameHelper.giveCard([playerWithKingReturns.user.id]);

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
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5, (game) => {
        movePlotCardsToStart(game, ['kingReturns']);
      });

      const playerWithKingReturns = game.players.find((player) => player !== game.leader)!;

      gameHelper.giveCard([playerWithKingReturns.user.id]);

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
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5, (game) => {
        movePlotCardsToStart(game, ['kingReturns']);
      });

      gameHelper.giveCard([undefined]);

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
        movePlotCardsToStart(game, ['restoreHonor']);
      });

      gameHelper.giveCard([undefined]);

      expect(game.addons.plotCards!.cardsInGame.length).toBe(0);

      expect(game.stage).toBe('selectTeam');
    });

    test('Should transfer ambush card from one player to another', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5, (game) => {
        game.addons.plotCards!.cardsPerRound = 2;

        movePlotCardsToStart(game, ['ambush', 'restoreHonor']);
      });

      const player1 = game.players.find((player) => player !== game.leader)!;
      const player2 = game.players.find((player) => player !== game.leader && player !== player1)!;

      gameHelper.giveCard([player1.user.id, player2.user.id]);

      expect(game.stage).toBe('restoreHonor');

      const ambushCard = game.addons.plotCards!.cardsInGame.find(
        (card) => card.name === 'ambush' && card.ownerID === player1.user.id,
      );

      gameHelper.useRestoreHonor(player1.user.id, ambushCard!.id);

      expect(ambushCard!.ownerID).toBe(player2.user.id);

      expect(game.addons.plotCards!.cardsInGame.find((card) => card.name === 'restoreHonor')).toBeUndefined();

      const lastHistoryEl = _.last(game.history);
      expect(lastHistoryEl?.type).toBe('restoreHonor');
    });

    test('Should skip stage if for player dont have cards to steal (For example leader give card to player who only have card)', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5, (game) => {
        game.addons.plotCards!.cardsPerRound = 2;

        movePlotCardsToStart(game, ['restoreHonor', 'ambush']);
      });

      const player1 = game.players.find((player) => player !== game.leader)!;

      gameHelper.giveCard([player1.user.id, player1.user.id]);

      expect(game.addons.plotCards!.cardsInGame.find((card) => card.name === 'restoreHonor')).toBeUndefined();

      expect(game.addons.plotCards!.cardsInGame.length).toBe(1);
    });
  });

  describe('Charge card (preVote functionality)', () => {
    test('Should allow player to vote before regular voting phase', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 5, (game) => {
        movePlotCardsToStart(game, ['charge']);
      });

      const playerWithCharge = game.players.find((player) => player !== game.leader)!;

      gameHelper.giveCard([playerWithCharge.user.id]);

      expect(
        game.addons.plotCards!.cardsInGame.find(
          (card) => card.name === 'charge' && card.ownerID === playerWithCharge.user.id,
        ),
      ).toBeDefined();

      gameHelper.selectPlayersOnMission().sentSelectedPlayers();

      expect(game.stage).toBe('preVote');

      expect(playerWithCharge.features.waitForAction).toBe(true);

      gameHelper.makePreVote('reject');

      expect(game.stage).toBe('votingForTeam');

      game.players.forEach((player) => {
        if (player.user.id === playerWithCharge.user.id) {
          expect(player.features.waitForAction).toBe(false);
        } else {
          expect(player.features.waitForAction).toBe(true);
        }
      });

      expect(playerWithCharge.features.preVote).toBe('reject');

      gameHelper.makeVotes();

      const lastHistoryEl = _.last(game.history)!;

      expect(lastHistoryEl.type).toBe('vote');
      expect(game.history[game.history.length - 2].type).toBe('preVote');

      const playerVote = (lastHistoryEl as Vote).data.votes.find(
        (vote) => vote.player.user.id === playerWithCharge.user.id,
      );

      expect(playerVote?.value).toBe('reject');
    });
  });
});
