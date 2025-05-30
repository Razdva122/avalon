import { Game, IPlayerInGame } from '@/core/game';
import { GameOptions, TLoyalty, TAssassinateType, TRoles, TVoteOption, TPlotCardNames } from '@avalon/types';
import { LeadToVictoryCard } from '@/core/game/addons/plot-cards/cards/usable/leadToVictory';
import { KingReturnsCard } from '@/core/game/addons/plot-cards/cards/usable/kingReturns';
import { AmbushCard } from '@/core/game/addons/plot-cards/cards/usable/ambush';
import { RestoreHonorCard } from '@/core/game/addons/plot-cards/cards/instant/restoreHonor';
import { ChargeCard } from '@/core/game/addons/plot-cards/cards/effects/charge';
import { TPlotCard } from '@/core/game/addons/plot-cards/interface';
import { WeFoundYouCard } from '@/core/game/addons/plot-cards/cards';

// Using userIDs directly instead of User objects
const userIDs = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export class GameTestHelper {
  game!: Game;
  stateChangedNumber: number = 0;

  constructor(playersAmount: number, options: GameOptions, preInit?: (game: Game) => void) {
    this.restartGame(playersAmount, options, preInit);
  }

  restartGame(playersAmount: number, options: GameOptions, preInit?: (game: Game) => void) {
    this.stateChangedNumber = 0;
    this.game = new Game(
      userIDs.slice(0, playersAmount),
      options,
      {
        gameStateChanged: () => (this.stateChangedNumber += 1),
      },
      preInit,
    );
  }

  selectPlayersOnMission(evil: number = 0, extraPlayers = 0): this {
    const amount = this.game.currentMission.data.settings.players + extraPlayers;
    const evilPlayers = this.game.players.filter((player) => player.role.validMissionResult.includes('fail'));

    for (let i = 0; i < amount; i += 1) {
      if (evil > 0) {
        evil -= 1;
        this.game.selectPlayer(this.game.leader.userID, evilPlayers[evil].userID);
      } else {
        const unselectedPlayer = this.game.players.find(
          (player) => player.features.isSelected === false && player.role.validMissionResult.includes('success'),
        )!;
        this.game.selectPlayer(this.game.leader.userID, unselectedPlayer?.userID);
      }
    }

    return this;
  }

  makeVotes(rejects: number = 0): this {
    this.game.players.forEach((player) => {
      if (player.features.waitForAction) {
        if (rejects > 0) {
          rejects -= 1;
          this.game.voteForMission(player.userID, 'reject');
        } else {
          this.game.voteForMission(player.userID, 'approve');
        }
      }
    });

    return this;
  }

  makeActions(fails: number = 0): this {
    this.game.currentMission.data.actions.forEach((action) => {
      if (action.player.features.waitForAction) {
        if (action.player.role.loyalty === 'evil' && fails > 0) {
          this.game.actionOnMission(action.player.userID, 'fail');
          fails -= 1;
        } else {
          this.game.actionOnMission(action.player.userID, 'success');
        }
      }
    });

    return this;
  }

  sentSelectedPlayers(): this {
    this.game.sentSelectedPlayers(this.game.leader.userID);
    return this;
  }

  pickRole(role: TAssassinateType, correct: boolean = false): this {
    const id = this.game.players.find((player) => {
      return correct ? player.role.role === role : player.role.role !== role && player.role.loyalty !== 'evil';
    })!.userID;

    const assassinID = this.game.players.find((player) => {
      return player.features.isAssassin;
    })!.userID;

    this.game.selectPlayer(assassinID, id);
    this.game.addons.assassin!.assassinate(assassinID, role);

    return this;
  }

  pickCustomRole(roleName: TRoles, type: TAssassinateType, correct: boolean = false): this {
    const id = this.game.players.find((player) => {
      return correct ? player.role.role === roleName : player.role.role !== roleName && player.role.loyalty !== 'evil';
    })!.userID;

    const assassinID = this.game.players.find((player) => {
      return player.features.isAssassin;
    })!.userID;

    this.game.selectPlayer(assassinID, id);

    this.game.addons.assassin!.assassinate(assassinID, type, roleName);

    return this;
  }

  pickLovers(correctLovers: Array<'isolde' | 'tristan'> = []): this {
    const ids: string[] = [];

    correctLovers.forEach((loverRole) => {
      ids.push(this.game.players.find((player) => player.role.role === loverRole)!.userID);
    });

    const assassinID = this.game.players.find((player) => {
      return player.features.isAssassin;
    })!.userID;

    ids.forEach((id) => {
      this.game.selectPlayer(assassinID, id);
    });

    while (this.game.selectedPlayers.length < 2) {
      const playerToSelectId = this.game.players.find(
        (player) =>
          player.role.role !== 'isolde' &&
          player.role.role !== 'tristan' &&
          !player.features.isSelected &&
          player.role.loyalty !== 'evil',
      )!.userID;

      this.game.selectPlayer(assassinID, playerToSelectId);
    }

    this.game.addons.assassin!.assassinate(assassinID, 'lovers');

    return this;
  }

  useLadyOfLake(userID?: string): this {
    const playerID = userID ?? this.game.players.find((player) => player.features.ladyOfLake === undefined)!.userID;

    const ownerID = this.game.players.find((player) => {
      return player.features.ladyOfLake == 'active';
    })!.userID;

    this.game.selectPlayer(ownerID, playerID);
    this.game.addons.ladyOfLake!.checkLoyalty(ownerID);
    return this;
  }

  useLadyOfSea(userID?: string): this {
    const playerID = userID ?? this.game.players.find((player) => player.features.ladyOfSea === undefined)!.userID;

    const ownerID = this.game.players.find((player) => {
      return player.features.ladyOfSea === 'active';
    })!.userID;

    this.game.selectPlayer(ownerID, playerID);
    this.game.addons.ladyOfSea!.checkLoyalty(ownerID);
    return this;
  }

  moveLadyOfLake(ownerID: string): this {
    this.game.players.find((player) => player.features.ladyOfLake === 'has')!.features.ladyOfLake = undefined;
    this.game.players.find((player) => player.userID === ownerID)!.features.ladyOfLake = 'has';

    return this;
  }

  announceLoyalty(loyalty: TLoyalty | TRoles): this {
    const id = this.game.players.find((player) => {
      return player.features.ladyOfLake == 'active' || player.features.ladyOfSea === 'active';
    })!.userID;

    (this.game.addons.ladyOfLake || this.game.addons.ladyOfSea)!.announceLoyalty(id, loyalty);
    return this;
  }

  giveExcalibur(giveExcalibur: true | string = true): this {
    const playerToExcalibur =
      giveExcalibur === true
        ? this.game.players.find((player) => player.features.isSent && !player.features.isLeader)
        : this.game.players.find((player) => player.userID === giveExcalibur);

    this.game.selectPlayer(this.game.leader.userID, playerToExcalibur!.userID);

    this.game.addons.excalibur!.giveExcalibur(this.game.leader.userID);

    return this;
  }

  useExcalibur(useExcalibur: boolean = true, useOnSuccess: boolean = true): this {
    const playerWithExcaliburId = this.game.players.find((player) => player.features.excalibur)!.userID;

    if (useExcalibur) {
      const actionWithCorrectRes = this.game.currentMission.data.actions.find((action) => {
        return useOnSuccess ? action.value === 'success' : action.value === 'fail' && !action.player.features.excalibur;
      })!;

      this.game.selectPlayer(playerWithExcaliburId, actionWithCorrectRes.player.userID);
    }

    this.game.addons.excalibur!.useExcalibur(playerWithExcaliburId);

    return this;
  }

  useWitchAbility(result: boolean = true): this {
    const playerWitchId = this.game.players.find((player) => player.role.role === 'witch')!.userID;

    this.game.addons.witch!.useWitchAbility(playerWitchId, result);

    return this;
  }

  announceWitchLoyalty(result: TLoyalty = 'good'): this {
    const playerWitchCheckID = this.game.players.find((player) => player.features.witchLoyalty)!.userID;

    this.game.addons.witch!.announceLoyalty(playerWitchCheckID, result);

    return this;
  }

  useWitchCheck(userID?: string): this {
    const playerID = userID ?? this.game.players.find((player) => !player.features.witchLoyalty)!.userID;

    const ownerID = this.game.players.find((player) => {
      return player.features.witchLoyalty === 'active';
    })!.userID;

    this.game.selectPlayer(ownerID, playerID);
    this.game.addons.witch!.checkLoyalty(ownerID);

    return this;
  }

  // Plot Cards methods
  giveCard(targetPlayerIDs: Array<string | undefined>): this {
    targetPlayerIDs.forEach((targetPlayerId) => {
      // If no target is specified, give the card to a non-leader player
      const targetPlayer = targetPlayerId
        ? this.game.players.find((player) => player.userID === targetPlayerId)
        : this.game.players.find((player) => player !== this.game.leader);

      this.game.selectPlayer(this.game.leader.userID, targetPlayer!.userID);
      this.game.addons.plotCards!.giveCardToPlayer(this.game.leader.userID);
    });

    return this;
  }

  getActiveCardPlayer(): IPlayerInGame {
    const activeCard =
      this.game.addons.plotCards!.activeCards[0] ||
      this.game.addons.plotCards!.cardsInGame.find((card) => card.stage === 'active');

    if (!activeCard) {
      throw new Error('No active card found');
    }

    return this.game.findPlayerByID(activeCard.ownerID!);
  }

  useLeadToVictory(use: boolean = true): this {
    const playerWithCard = this.getActiveCardPlayer();

    const leadToVictoryCard = this.game.addons.plotCards!.cardsInGame.find(
      (plotCard) => plotCard.name === 'leadToVictory' && plotCard.ownerID === playerWithCard.userID,
    )!;
    (leadToVictoryCard as LeadToVictoryCard).leadToVictory(playerWithCard.userID, use);

    return this;
  }

  useKingReturns(use: boolean = true): this {
    const playerWithCard = this.getActiveCardPlayer();

    const kingReturnsCard = this.game.addons.plotCards!.cardsInGame.find(
      (plotCard) => plotCard.name === 'kingReturns' && plotCard.ownerID === playerWithCard.userID,
    )!;
    (kingReturnsCard as KingReturnsCard).kingReturns(use);

    return this;
  }

  useAmbush(targetPlayerId?: string): this {
    const playerWithCard = this.getActiveCardPlayer();

    const targetPlayer = targetPlayerId
      ? this.game.players.find((player) => player.userID === targetPlayerId)!
      : this.game.currentMission.data.actions[0]?.player;

    this.game.selectPlayer(playerWithCard.userID, targetPlayer.userID);

    const ambushCard = this.game.addons.plotCards!.cardsInGame.find(
      (plotCard) => plotCard.name === 'ambush' && plotCard.ownerID === playerWithCard.userID,
    )!;
    (ambushCard as AmbushCard).ambush();

    return this;
  }

  useWeFoundYou(targetPlayerId?: string, use: boolean = false): this {
    const playerWithCard = this.getActiveCardPlayer();

    const weFoundYouCard = this.game.addons.plotCards!.cardsInGame.find(
      (plotCard) => plotCard.name === 'weFoundYou' && plotCard.ownerID === playerWithCard.userID,
    )!;

    if (use === true) {
      const targetPlayer = targetPlayerId
        ? this.game.players.find((player) => player.userID === targetPlayerId)!
        : this.game.currentMission.data.actions[0]?.player;

      this.game.selectPlayer(playerWithCard.userID, targetPlayer.userID);

      (weFoundYouCard as WeFoundYouCard).weFoundYou(playerWithCard.userID, use, targetPlayer);
    } else {
      (weFoundYouCard as WeFoundYouCard).weFoundYou(playerWithCard.userID, use, undefined);
    }

    return this;
  }

  useRestoreHonor(targetPlayerId?: string, cardId?: string): this {
    const playerWithCard = this.getActiveCardPlayer();

    if (playerWithCard) {
      // If no target is specified, select the first player who has a card
      const targetPlayer = targetPlayerId
        ? this.game.players.find((player) => player.userID === targetPlayerId)
        : this.game.players.find((player) => {
            return (
              player !== playerWithCard &&
              this.game.addons.plotCards!.cardsInGame.some((plotCard) => plotCard.ownerID === player.userID)
            );
          });

      if (targetPlayer) {
        this.game.selectPlayer(playerWithCard.userID, targetPlayer.userID);

        // If no card ID is specified, use the first card the target player has
        const cardToSteal = cardId
          ? this.game.addons.plotCards!.cardsInGame.find((plotCard) => plotCard.id === cardId)
          : this.game.addons.plotCards!.cardsInGame.find(
              (plotCard) => plotCard.ownerID === targetPlayer.userID && plotCard.name !== 'restoreHonor',
            );

        if (cardToSteal) {
          const restoreHonorCard = this.game.addons.plotCards!.cardsInGame.find(
            (plotCard) => plotCard.name === 'restoreHonor' && plotCard.ownerID === playerWithCard.userID,
          )!;
          (restoreHonorCard as RestoreHonorCard).restoreHonor(
            cardToSteal.id,
            targetPlayer.userID,
            playerWithCard.userID,
          );
        }
      }
    }

    return this;
  }

  makePreVote(option: TVoteOption = 'approve'): this {
    const playerWithCharge = this.game.players.find((player) => {
      const playerCard = this.game.addons.plotCards!.cardsInGame.find(
        (plotCard) => plotCard.name === 'charge' && plotCard.ownerID === player.userID && plotCard.stage === 'active',
      );
      return playerCard !== undefined;
    });

    if (playerWithCharge) {
      const chargeCard = this.game.addons.plotCards!.cardsInGame.find(
        (plotCard) => plotCard.name === 'charge' && plotCard.ownerID === playerWithCharge.userID,
      )!;
      (chargeCard as ChargeCard).makeVote(option);
    }

    return this;
  }
}

export function movePlotCardsToStart(game: Game, cards: TPlotCardNames[]) {
  const movedCards: TPlotCard[] = [];

  cards.reverse().forEach((cardName) => {
    const cardIndex = game.addons.plotCards!.cards.findIndex(
      (card) => card.name === cardName && !movedCards.includes(card),
    );
    const card = game.addons.plotCards!.cards.splice(cardIndex, 1)[0];
    game.addons.plotCards!.cards.unshift(card);
    movedCards.push(card);
  });
}
