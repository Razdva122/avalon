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
      gameHelper.giveCard([playerWithCard.user.id]);

      // Verify card was given
      expect(
        game.addons.plotCards!.cardsInGame.find(
          (card) => card.name === 'areYouTheOne' && card.ownerID === playerWithCard.user.id,
        ),
      ).toBeDefined();

      // Check that the card is activated
      expect(game.stage).toBe('checkLoyalty');

      // Target player to check
      const targetPlayer = playerWithCard.next; // Adjacent player

      // Select the player to check
      game.selectPlayer(playerWithCard.user.id, targetPlayer.user.id);

      // Get the active card
      const activeCard = game.addons.plotCards!.cardsInGame.find(
        (card) => card.name === 'areYouTheOne' && card.stage === 'active',
      ) as LoyaltyPlotCard;

      // Use the card by calling the loyalty checker directly
      activeCard.loyaltyChecker.checkLoyalty(playerWithCard.user.id, playerWithCard, targetPlayer);

      // Announce the loyalty
      activeCard.loyaltyChecker.announceLoyalty(playerWithCard.user.id, targetPlayer, targetPlayer.role.loyalty);

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
      gameHelper.giveCard([playerWithCard.user.id]);

      // Find a non-adjacent player (not next and not previous)
      const nonAdjacentPlayer = game.players.find(
        (player) => player !== playerWithCard && player !== playerWithCard.next && player.next !== playerWithCard,
      )!;

      // Select the non-adjacent player
      game.selectPlayer(playerWithCard.user.id, nonAdjacentPlayer.user.id);

      // Get the active card
      const activeCard = game.addons.plotCards!.cardsInGame.find(
        (card) => card.name === 'areYouTheOne' && card.stage === 'active',
      ) as LoyaltyPlotCard;

      // Attempt to use the card with a non-adjacent player should throw an error
      expect(() => {
        activeCard.loyaltyChecker.checkLoyalty(playerWithCard.user.id, playerWithCard, nonAdjacentPlayer);
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
      gameHelper.giveCard([playerWithCard.user.id]);

      // Check that the card is activated
      expect(game.stage).toBe('revealLoyalty');

      // Target player to reveal
      const targetPlayer = game.players.find((player) => player !== playerWithCard)!;

      // Select the player to reveal
      game.selectPlayer(playerWithCard.user.id, targetPlayer.user.id);

      // Get the active card
      const activeCard = game.addons.plotCards!.cardsInGame.find(
        (card) => card.name === 'showNature' && card.stage === 'active',
      ) as LoyaltyPlotCard;

      // Use the card by calling the loyalty checker directly
      activeCard.loyaltyChecker.revealLoyalty(playerWithCard.user.id, playerWithCard, targetPlayer);

      // Announce the loyalty
      activeCard.loyaltyChecker.announceLoyalty(targetPlayer.user.id, playerWithCard, playerWithCard.role.loyalty);

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
      game.selectPlayer(playerWithCard.user.id, targetPlayer.user.id);

      // Get the active card
      const activeCard = game.addons.plotCards!.cardsInGame.find(
        (card) => card.name === 'showStrength' && card.stage === 'active',
      ) as LoyaltyPlotCard;

      // Use the card by calling the loyalty checker directly
      activeCard.loyaltyChecker.revealLoyalty(playerWithCard.user.id, playerWithCard, targetPlayer);

      // Announce the loyalty
      activeCard.loyaltyChecker.announceLoyalty(targetPlayer.user.id, playerWithCard, playerWithCard.role.loyalty);

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
      gameHelper.giveCard([playerWithCard.user.id]);

      gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes();

      // Check that the card is activated
      expect(game.stage).toBe('weFoundYou');

      const targetPlayer = game.players.find((player) => player.features.isSent);

      gameHelper.useWeFoundYou(targetPlayer?.user.id, true).makeActions();

      // Verify the card was removed
      expect(game.addons.plotCards!.cardsInGame.find((card) => card.name === 'weFoundYou')).toBeUndefined();
      expect(game.missions[0].data.actions.find((el) => el.player === targetPlayer)!.openToEveryone).toBe(true);
    });
  });
});

describe('Plot Cards Interactions', () => {
  test('Should handle multiple active cards in the correct order', () => {
    const { game, gameHelper } = generateNewGame({ plotCards: true }, {}, 7, (game) => {
      game.addons.plotCards!.cardsPerRound = 2;
      movePlotCardsToStart(game, ['kingReturns', 'ambush']);
    });

    // Give cards to different players
    const player1 = game.players.find((player) => player !== game.leader)!;
    const player2 = game.players.find((player) => player !== game.leader && player !== player1)!;

    gameHelper.giveCard([player1.user.id, player2.user.id]);

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
});
