import { generateNewGame } from '@/core/game/test/const';

let { game, gameHelper } = generateNewGame();

describe('PlotCards in 7-8 player games', () => {
  beforeAll(() => {
    const restart = generateNewGame({ plotCards: true }, {}, 7);
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('Should initialize with correct number of cards and cardsPerRound=2', () => {
    expect(game.addons.plotCards!.cards.length).toBe(15); // Cards for 7-8 player games
    expect(game.addons.plotCards!.cardsPerRound).toBe(2); // 2 cards per round for 7-8 players
  });

  test('Should activate two cards per round', () => {
    const initialPointer = game.addons.plotCards!.pointer;

    // Complete a round to trigger card activation
    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();

    // Check that two cards were activated
    expect(game.addons.plotCards!.pointer).toBe(initialPointer + 2); // Pointer should have moved by 2
  });

  test('Should have the correct cards for 7-8 player games', () => {
    // Reset the game for a clean state
    const restart = generateNewGame({ plotCards: true }, {}, 7);
    game = restart.game;

    // Get all card names
    const cardNames = game.addons.plotCards!.cards.map((card) => card.name);

    // Count occurrences of each card
    const cardCounts: Record<string, number> = {};
    cardNames.forEach((name) => {
      cardCounts[name] = cardCounts[name] ?? 0;
      cardCounts[name] += 1;
    });

    // Check that we have the expected cards for 7-8 player games
    expect(cardCounts['leadToVictory']).toBe(2); // 2 LeadToVictory cards
    expect(cardCounts['ambush']).toBe(2); // 2 Ambush cards
    expect(cardCounts['kingReturns']).toBe(3); // 3 KingReturns card
    expect(cardCounts['restoreHonor']).toBe(1); // 1 RestoreHonor card
    expect(cardCounts['charge']).toBe(2); // 2 Charge card

    // Cards specific to 7+ player games
    expect(cardCounts['showNature']).toBe(1); // 1 ShowNature card
    expect(cardCounts['areYouTheOne']).toBe(2); // 2 AreYouTheOne cards
    expect(cardCounts['weFoundYou']).toBe(1); // 1 WeFoundYou card
    expect(cardCounts['showStrength']).toBe(1); // 1 ShowStrength card
  });
});

describe('PlotCards in 9+ player games', () => {
  beforeAll(() => {
    const restart = generateNewGame({ plotCards: true }, {}, 9);
    game = restart.game;
    gameHelper = restart.gameHelper;
  });

  test('Should initialize with correct number of cards and cardsPerRound=3', () => {
    expect(game.addons.plotCards!.cards.length).toBe(15); // Cards for 9+ player games
    expect(game.addons.plotCards!.cardsPerRound).toBe(3); // 3 cards per round for 9+ players
  });

  test('Should activate three cards per round', () => {
    const initialPointer = game.addons.plotCards!.pointer;

    // Complete a round to trigger card activation
    gameHelper.selectPlayersOnMission().sentSelectedPlayers().makeVotes().makeActions();

    // Check that three cards were activated
    expect(game.addons.plotCards!.pointer).toBe(initialPointer + 3); // Pointer should have moved by 3
  });

  test('Should have all possible card types for 9+ player games', () => {
    // Reset the game for a clean state
    const restart = generateNewGame({ plotCards: true }, {}, 9);
    game = restart.game;

    // Get all card names
    const cardNames = game.addons.plotCards!.cards.map((card) => card.name);
    const uniqueCardNames = new Set(cardNames);

    // Check that we have all card types
    expect(uniqueCardNames.size).toBeGreaterThanOrEqual(9); // Should have all 9 card types

    // Check for specific cards
    expect(cardNames.includes('leadToVictory')).toBe(true);
    expect(cardNames.includes('ambush')).toBe(true);
    expect(cardNames.includes('kingReturns')).toBe(true);
    expect(cardNames.includes('restoreHonor')).toBe(true);
    expect(cardNames.includes('charge')).toBe(true);
    expect(cardNames.includes('showNature')).toBe(true);
    expect(cardNames.includes('areYouTheOne')).toBe(true);
    expect(cardNames.includes('weFoundYou')).toBe(true);
    expect(cardNames.includes('showStrength')).toBe(true);
  });
});
