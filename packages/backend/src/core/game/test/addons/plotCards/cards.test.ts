import { generateNewGame } from '@/core/game/test/const';
import { movePlotCardsToStart } from '@/core/game/test/helpers';
import * as _ from 'lodash';
import { LoyaltyPlotCard } from '@/core/game/addons/plot-cards/cards/abstract';

describe('Plot Cards Individual Tests', () => {
  // Test for AreYouTheOne card
  describe('AreYouTheOne card', () => {
    test("Should allow player to check another player's loyalty", () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 7, (game) => {
        movePlotCardsToStart(game, ['areYouTheOne', 'charge']);
      });

      const playerWithCard = game.players.find((player) => player !== game.leader)!;
      gameHelper.giveCard([playerWithCard.userID]);

      // Verify card was given
      expect(
        game.addons.plotCards!.cardsInGame.find(
          (card) => card.name === 'areYouTheOne' && card.ownerID === playerWithCard.userID,
        ),
      ).toBeDefined();

      // Check that the card is activated
      expect(game.stage).toBe('checkLoyalty');

      // Target player to check
      const targetPlayer = playerWithCard.next; // Adjacent player

      // Select the player to check
      game.selectPlayer(playerWithCard.userID, targetPlayer.userID);

      // Get the active card
      const activeCard = game.addons.plotCards!.cardsInGame.find(
        (card) => card.name === 'areYouTheOne' && card.stage === 'active',
      ) as LoyaltyPlotCard;

      // Use the card by calling the loyalty checker directly
      activeCard.loyaltyChecker.checkLoyalty(playerWithCard.userID, playerWithCard, targetPlayer);

      // Announce the loyalty
      activeCard.loyaltyChecker.announceLoyalty(playerWithCard.userID, targetPlayer, targetPlayer.role.loyalty);

      // Verify the card was used and removed
      expect(game.addons.plotCards!.cardsInGame.find((card) => card.name === 'areYouTheOne')).toBeUndefined();

      // Verify history entry
      const lastHistoryEl = _.last(game.history)!;
      expect(lastHistoryEl.type).toBe('announceLoyalty');
    });

    test('Should throw an error when selecting a non-adjacent player', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 7, (game) => {
        movePlotCardsToStart(game, ['areYouTheOne', 'charge']);
      });

      const playerWithCard = game.players.find((player) => player !== game.leader)!;
      gameHelper.giveCard([playerWithCard.userID]);

      // Find a non-adjacent player (not next and not previous)
      const nonAdjacentPlayer = game.players.find(
        (player) => player !== playerWithCard && player !== playerWithCard.next && player.next !== playerWithCard,
      )!;

      // Select the non-adjacent player
      game.selectPlayer(playerWithCard.userID, nonAdjacentPlayer.userID);

      // Get the active card
      const activeCard = game.addons.plotCards!.cardsInGame.find(
        (card) => card.name === 'areYouTheOne' && card.stage === 'active',
      ) as LoyaltyPlotCard;

      // Attempt to use the card with a non-adjacent player should throw an error
      expect(() => {
        activeCard.loyaltyChecker.checkLoyalty(playerWithCard.userID, playerWithCard, nonAdjacentPlayer);
      }).toThrow('The check can only be used on an adjacent player');
    });
  });

  // Test for ShowNature card
  describe('ShowNature card', () => {
    test('Should force a player to reveal their loyalty', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 7, (game) => {
        movePlotCardsToStart(game, ['showNature', 'charge']);
      });

      // Give card to a player
      const playerWithCard = game.players.find((player) => player !== game.leader)!;
      gameHelper.giveCard([playerWithCard.userID]);

      // Check that the card is activated
      expect(game.stage).toBe('revealLoyalty');

      // Target player to reveal
      const targetPlayer = game.players.find((player) => player !== playerWithCard)!;

      // Select the player to reveal
      game.selectPlayer(playerWithCard.userID, targetPlayer.userID);

      // Get the active card
      const activeCard = game.addons.plotCards!.cardsInGame.find(
        (card) => card.name === 'showNature' && card.stage === 'active',
      ) as LoyaltyPlotCard;

      // Use the card by calling the loyalty checker directly
      activeCard.loyaltyChecker.revealLoyalty(playerWithCard.userID, playerWithCard, targetPlayer);

      // Announce the loyalty
      activeCard.loyaltyChecker.announceLoyalty(targetPlayer.userID, playerWithCard, playerWithCard.role.loyalty);

      // Verify the card was used and removed
      expect(game.addons.plotCards!.cardsInGame.find((card) => card.name === 'showNature')).toBeUndefined();

      // Verify history entry
      const lastHistoryEl = _.last(game.history)!;
      expect(lastHistoryEl.type).toBe('announceLoyalty');
    });
  });

  // Test for ShowStrength card
  describe('ShowStrength card', () => {
    test('Should force a player to reveal their loyalty', () => {
      const { game } = generateNewGame({ plotCards: true }, {}, 7, (game) => {
        movePlotCardsToStart(game, ['showStrength', 'charge']);
      });

      // Give card to a player
      const playerWithCard = game.players.find((player) => player === game.leader)!;

      // Check that the card is activated
      expect(game.stage).toBe('revealLoyalty');

      // Target player to reveal
      const targetPlayer = game.players.find((player) => player !== playerWithCard)!;

      // Select the player to reveal
      game.selectPlayer(playerWithCard.userID, targetPlayer.userID);

      // Get the active card
      const activeCard = game.addons.plotCards!.cardsInGame.find(
        (card) => card.name === 'showStrength' && card.stage === 'active',
      ) as LoyaltyPlotCard;

      // Use the card by calling the loyalty checker directly
      activeCard.loyaltyChecker.revealLoyalty(playerWithCard.userID, playerWithCard, targetPlayer);

      // Announce the loyalty
      activeCard.loyaltyChecker.announceLoyalty(targetPlayer.userID, playerWithCard, playerWithCard.role.loyalty);

      // Verify the card was used and removed
      expect(game.addons.plotCards!.cardsInGame.find((card) => card.name === 'showStrength')).toBeUndefined();

      // Verify history entry
      const lastHistoryEl = _.last(game.history)!;
      expect(lastHistoryEl.type).toBe('announceLoyalty');
    });
  });

  // Test for WeFoundYou card
  describe('WeFoundYou card', () => {
    test('Should display one action visible', () => {
      const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 7, (game) => {
        game.addons.plotCards!.cardsPerRound = 1;
        movePlotCardsToStart(game, ['weFoundYou']);
      });

      // Give card to a player
      const playerWithCard = game.players.find((player) => player !== game.leader)!;
      gameHelper.giveCard([playerWithCard.userID]);

      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes();

      // Check that the card is activated
      expect(game.stage).toBe('weFoundYou');

      const targetPlayer = game.players.find((player) => player.features.isSent);

      gameHelper.useWeFoundYou(targetPlayer?.userID, true).makeActions();

      // Verify the card was removed
      expect(game.addons.plotCards!.cardsInGame.find((card) => card.name === 'weFoundYou')).toBeUndefined();
      expect(game.missions[0].data.actions.find((el) => el.player === targetPlayer)!.openToEveryone).toBe(true);
    });
  });
});

describe('Plot Cards Interactions', () => {
  test('Should handle multiple active cards in the correct order', () => {
    const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 7, (game) => {
      movePlotCardsToStart(game, ['kingReturns', 'ambush']);
    });

    // Give cards to different players
    const player1 = game.players.find((player) => player !== game.leader)!;
    const player2 = game.players.find((player) => player !== game.leader && player !== player1)!;

    gameHelper.giveCard([player1.userID, player2.userID]);

    // Complete a round to trigger card activation
    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes();

    // First kingReturns should be activated
    expect(game.stage).toBe('kingReturns');
    gameHelper.useKingReturns(true);

    expect(game.stage).toBe('selectTeam');
    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();

    // Then ambush should be activated
    expect(game.stage).toBe('ambush');

    gameHelper.useAmbush();

    // Verify the correct order of activation
    const historyTypes = game.history.map((history) => history.type);
    const kingReturnsIndex = historyTypes.lastIndexOf('kingReturns');
    const missionIndex = historyTypes.lastIndexOf('mission');

    expect(kingReturnsIndex).toBeLessThan(missionIndex);
  });

  test('Two charge cards to same player should work', () => {
    const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 7, (game) => {
      movePlotCardsToStart(game, ['charge', 'charge']);
    });

    const playerWithCharge = game.players.find((player) => player !== game.leader)!;

    gameHelper.giveCard([playerWithCharge.userID, playerWithCharge.userID]);

    // Complete a round to trigger card activation
    gameHelper.selectPlayersOnMission().sentSelectedPlayers();

    gameHelper.makePreVote('approve');

    gameHelper.makeVotes();

    expect(game.stage).toBe('onMission');
  });

  test('Two charge cards to different players player should work', () => {
    const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 7, (game) => {
      movePlotCardsToStart(game, ['charge', 'charge']);
    });

    const playerWithCharge = game.players.find((player) => player !== game.leader)!;
    const player2WithCharge = game.players.find((player) => player !== game.leader && player !== playerWithCharge)!;

    gameHelper.giveCard([playerWithCharge.userID, player2WithCharge.userID]);

    // Complete a round to trigger card activation
    gameHelper.selectPlayersOnMission().sentSelectedPlayers();

    gameHelper.makePreVote('approve');

    expect(game.stage).toBe('preVote');

    gameHelper.makePreVote('approve');

    expect(game.stage).toBe('votingForTeam');

    expect(playerWithCharge.features.waitForAction).toBeFalsy();
    expect(player2WithCharge.features.waitForAction).toBeFalsy();
  });
});
