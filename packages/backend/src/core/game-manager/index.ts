import { Game } from '@/core/game';
import type { User } from '@/user';
import type { TRoomState, TGameMethodsParams, TGetLoyaltyData } from '@/core/game-manager/interface';
import { eventBus } from '@/helpers';
import { Mission } from '@/core/game/history/mission';
import {
  isChargeCard,
  isLeadToVictoryCard,
  isAmbushCard,
  isRestoreHonorCard,
  isKingReturnsCard,
  isWeFoundYouCard,
} from '@/core/game/addons/plot-cards';
import type { TPlotCard } from '@/core/game/addons/plot-cards/interface';

import * as _ from 'lodash';

import {
  Server,
  VisualGameState,
  Player,
  GameOptions,
  TVisibleRole,
  MissionWithResult,
  TLoyalty,
  TRoles,
} from '@avalon/types';

export * from '@/core/game-manager/interface';

export class GameManager {
  game: Game;
  roomState!: TRoomState;
  io: Server;
  roomID: string;

  constructor(users: User[], options: GameOptions, io: Server, roomID: string) {
    this.roomID = roomID;
    this.io = io;
    this.game = new Game(users, options, { gameStateChanged: () => this.gameStateChanged() });
    this.initRoomState();
  }

  /**
   * Initializing the state room
   */
  initRoomState(): void {
    (<Partial<TRoomState>>this.roomState) = {
      uuid: this.roomID,
      stage: this.game.stage,
      vote: this.game.turn,
      mission: this.game.round,
      settings: this.game.settings,
      result: this.game.result,
      addonsData: this.game.addonsData,
      features: this.game.features,
    };

    this.roomState = {
      ...this.roomState,
      ...this.prepareHistoryAndPlayerForRoomState(),
    };
  }

  /**
   * Handler, the state of the game has changed, need to update the state of the room
   */
  gameStateChanged(): void {
    if (!this.roomState || !this.game) {
      return;
    }

    this.roomState.stage = this.game.stage;

    this.roomState = {
      ...this.roomState,
      ...this.prepareHistoryAndPlayerForRoomState(),
    };

    this.roomState.vote = this.game.turn;

    this.roomState.mission = this.game.round;

    this.roomState.result = this.game.result;

    this.roomState.addonsData = this.game.addonsData;

    if (this.game.result) {
      eventBus.emit('roomUpdated', this.roomID);
    }

    if (this.game.stage === 'end') {
      eventBus.emit('gameEnded', this.roomID);
    }

    this.sendNewStateToUsers();
  }

  prepareHistoryAndPlayerForRoomState(): Pick<TRoomState, 'history' | 'players' | 'missionState'> {
    const missionsState: MissionWithResult[] = _.cloneDeep(this.roomState.settings.missions);

    this.game.history
      .filter((el): el is Mission => el.type === 'mission')
      .forEach((mission, index) => {
        const data = mission.calculateMissionData();

        missionsState[index].hidden = data.hidden;
        missionsState[index].fails = data.fails;
        missionsState[index].result = data.result;
      });

    return {
      history: this.game.history.map((el, index) => {
        if (this.game.features.hiddenHistory && this.game.stage !== 'end' && index !== this.game.history.length - 1) {
          const currentHistoryIndex = this.roomState.history.length;

          if (index < currentHistoryIndex && el.canBeHidden) {
            return () => ({ type: 'hidden' });
          }
        }

        return el.dataForManager.bind(el);
      }),
      missionState: missionsState,
      players: this.game.players.map((player) => {
        return {
          id: player.user.id,
          index: player.index,
          name: player.user.name,
          features: player.features,
        };
      }),
    };
  }

  /**
   * Sends the new game state to all users
   */
  sendNewStateToUsers(): void {
    this.game.players.forEach((player) => {
      this.io.to(player.user.id).emit('gameUpdated', this.prepareStateForUser(player.user.id));
    });

    this.io
      .except(this.game.players.map((player) => player.user.id))
      .to(this.roomID)
      .emit('gameUpdated', this.prepareStateForUser());
  }

  /**
   * Transform a state of rooms into a state for a specific user
   *
   * @param [userID] - the ID of the user to prepare the state for
   */
  prepareStateForUser(userID?: string): VisualGameState {
    return {
      result: this.roomState.result,
      uuid: this.roomState.uuid,
      stage: this.roomState.stage,
      vote: this.roomState.vote,
      mission: this.roomState.mission,
      settings: this.roomState.settings,
      addonsData: this.roomState.addonsData,
      features: this.roomState.features,
      missionState: this.roomState.missionState,
      history: this.roomState.history.map((el) => el({ game: this.game, userID })),
      players: this.roomState.players.map((player, index) => {
        const playerData: Player = { ...player, role: this.getPlayerVisibleRole(player.id, userID) };

        if (player.id === userID) {
          playerData.validMissionsResult = this.game.players[index].role.validMissionResult;
        }

        return playerData;
      }),
    };
  }

  getPlayerVisibleRole(playerID: string, userID?: string): TVisibleRole {
    // Role known for all -> Role known for user -> Self Role -> Role known for role -> unknown
    let role: TVisibleRole | undefined = this.game.getVisibleRoleState('all', playerID);

    if (!role && userID) {
      role = this.game.getVisibleRoleState(userID, playerID);
    }

    role = role ?? 'unknown';

    return role;
  }

  callGameMethods(userID: string, params: TGameMethodsParams): void {
    switch (params.method) {
      // Core game methods
      case 'voteForMission':
        this.game.voteForMission(userID, params.option);
        break;

      case 'selectPlayer':
        this.game.selectPlayer(userID, params.playerID);
        break;

      case 'sentSelectedPlayers':
        this.game.sentSelectedPlayers(userID);
        break;

      case 'actionOnMission':
        this.game.actionOnMission(userID, params.result);
        break;

      // Addon-specific methods
      case 'assassinate':
        this.ensureAddonExists(this.game.addons.assassin, 'assassin');
        this.game.addons.assassin.assassinate(userID, params.type, params.customRole);
        break;

      case 'giveExcalibur':
        this.ensureAddonExists(this.game.addons.excalibur, 'excalibur');
        this.game.addons.excalibur.giveExcalibur(userID);
        break;

      case 'useExcalibur':
        this.ensureAddonExists(this.game.addons.excalibur, 'excalibur');
        this.game.addons.excalibur.useExcalibur(userID);
        break;

      case 'witchAbility':
        this.ensureAddonExists(this.game.addons.witch, 'witch');
        this.game.addons.witch.useWitchAbility(userID, params.result);
        break;

      case 'givePlotCard':
        this.ensureAddonExists(this.game.addons.plotCards, 'plot cards');
        this.game.addons.plotCards.giveCardToPlayer(userID);
        break;

      // Loyalty-related methods
      case 'checkLoyalty':
        this.handleLoyaltyAction(userID, 'checkLoyalty');
        break;

      case 'revealLoyalty':
        this.handleLoyaltyAction(userID, 'revealLoyalty');
        break;

      case 'announceLoyalty':
        this.handleLoyaltyAction(userID, 'announceLoyalty', {
          loyalty: params.loyalty,
        });
        break;

      // Plot card methods
      case 'preVote': {
        const activeCard = this.getActivePlotCard(params.cardID, userID);

        if (isChargeCard(activeCard)) {
          activeCard.makeVote(params.option);
        } else {
          throw new Error(`Active card ${activeCard.name} does not support pre-voting`);
        }
        break;
      }

      case 'useLeadToVictory':
        this.handlePlotCardAction(
          'lead to victory',
          isLeadToVictoryCard,
          (card) => card.leadToVictory(userID, params.use),
          params.cardID,
          userID,
        );
        break;

      case 'useAmbush':
        this.handlePlotCardAction('ambush', isAmbushCard, (card) => card.ambush(), params.cardID, userID);
        break;

      case 'useRestoreHonor': {
        this.handlePlotCardAction(
          'restore honor',
          isRestoreHonorCard,
          (card) => {
            // Get the selected player from the game
            const selectedPlayers = this.game.players.filter((player) => player.features.isSelected);

            if (selectedPlayers.length !== 1) {
              throw new Error('You must select exactly one player to use restore honor');
            }

            const targetPlayerId = selectedPlayers[0].user.id;
            card.restoreHonor(params.cardID, targetPlayerId, userID);
          },
          params.restoreHonorCardID,
          userID,
        );
        break;
      }

      case 'useKingReturns':
        this.handlePlotCardAction(
          'king returns',
          isKingReturnsCard,
          (card) => card.kingReturns(params.use),
          params.cardID,
          userID,
        );
        break;

      case 'useWeFoundYou':
        this.handlePlotCardAction(
          'we found you',
          isWeFoundYouCard,
          (card) => {
            if (params.use) {
              // Get the selected player if use is true
              const selectedPlayers = this.game.players.filter((player) => player.features.isSelected);

              if (selectedPlayers.length !== 1) {
                throw new Error('You must select exactly one player to use We Found You');
              }

              const selectedPlayer = this.game.findPlayerByID(selectedPlayers[0].user.id);
              card.weFoundYou(userID, true, selectedPlayer);
            } else {
              card.weFoundYou(userID, false, undefined);
            }
          },
          params.cardID,
          userID,
        );
        break;
    }
  }

  /**
   * Ensures that an addon exists, throws an error if it doesn't
   */
  private ensureAddonExists<T>(addon: T | undefined, addonName: string): asserts addon is T {
    if (!addon) {
      throw new Error(`You can't use ${addonName} in game without ${addonName} addon`);
    }
  }

  /**
   * Gets the active plot card and ensures it exists
   */
  /**
   * Gets the active plot card with the specified ID and ensures it exists
   */
  private getActivePlotCard(cardID?: string, playerID?: string): TPlotCard {
    this.ensureAddonExists(this.game.addons.plotCards, 'plot cards');

    // If no cardID is provided, maintain backward compatibility
    if (!cardID) {
      // Find any active card for the player if playerID is provided
      if (playerID) {
        const playerCards = this.game.addons.plotCards.activeCards.filter((card) => card.ownerID === playerID);

        if (playerCards.length > 0) {
          return playerCards[0];
        }
      }

      // Otherwise, just return the first active card
      if (this.game.addons.plotCards.activeCards.length > 0) {
        return this.game.addons.plotCards.activeCards[0];
      }

      throw new Error('No active cards found');
    }

    // Find the specific card with the given ID
    const card = this.game.addons.plotCards.activeCards.find((card) => card.id === cardID);

    if (!card) {
      throw new Error(`No active card found with ID ${cardID}`);
    }

    // If playerID is provided, validate ownership
    if (playerID && card.ownerID !== playerID) {
      throw new Error(`Card with ID ${cardID} is not owned by player ${playerID}`);
    }

    return card;
  }

  /**
   * Validates and executes a plot card action
   */
  /**
   * Validates and executes a plot card action
   */
  private handlePlotCardAction<T extends TPlotCard>(
    cardName: string,
    typeGuard: (card: TPlotCard) => card is T,
    action: (card: T) => void,
    cardID: string,
    playerID: string,
  ): void {
    const activeCard = this.getActivePlotCard(cardID, playerID);

    if (typeGuard(activeCard)) {
      action(activeCard);
    } else {
      throw new Error(`Active card ${activeCard.name} is not ${cardName}`);
    }
  }

  /**
   * Handles loyalty-related actions
   */
  private handleLoyaltyAction(
    userID: string,
    method: 'checkLoyalty' | 'revealLoyalty' | 'announceLoyalty',
    params?: { loyalty: TLoyalty | TRoles; cardID?: string },
  ): void {
    const activeType = this.getActiveLoyaltyCheckerType();

    if (activeType === 'plot-card') {
      if (method === 'checkLoyalty') {
        this.checkLoyaltyFromCard(userID, params?.cardID);
        return;
      } else if (method === 'revealLoyalty') {
        this.revealLoyaltyFromCard(userID, params?.cardID);
        return;
      } else if (method === 'announceLoyalty' && params) {
        this.announceLoyaltyFromCard(userID, params.loyalty, params.cardID);
        return;
      }

      return;
    }

    if (this.game.addons[activeType]) {
      if (method === 'checkLoyalty') {
        this.game.addons[activeType].checkLoyalty(userID);
        return;
      } else if (method === 'announceLoyalty' && params) {
        this.game.addons[activeType].announceLoyalty(userID, params.loyalty);
        return;
      }
    }

    throw new Error(`You can't use ${method} in this game with the current active features`);
  }

  /**
   * Gets the active loyalty checker type
   */
  private getActiveLoyaltyCheckerType() {
    // Check player features first
    for (const player of this.game.players) {
      if (player.features.ladyOfLake === 'active') {
        return 'ladyOfLake';
      }
      if (player.features.ladyOfSea === 'active') {
        return 'ladyOfSea';
      }
      if (player.features.witchLoyalty === 'active') {
        return 'witch';
      }
    }

    // Check for plot cards with loyalty checker
    if (this.game.addons.plotCards?.activeCards.some((card) => card.loyaltyChecker)) {
      return 'plot-card';
    }

    throw new Error('There is no active loyalty check');
  }

  /**
   * Checks loyalty from a plot card
   */
  private checkLoyaltyFromCard(userID: string, cardID?: string): void {
    // Find the card with the loyalty checker
    const cards = this.game.addons.plotCards!.activeCards.filter((card) => card.loyaltyChecker);

    // If cardID is provided, find that specific card
    const card = cardID ? cards.find((c) => c.id === cardID) : cards[0];

    if (!card) {
      throw new Error('No active card with loyalty checker found');
    }

    const owner = this.game.findPlayerByID(card.ownerID!);
    if (this.game.selectedPlayers.length !== 1) {
      throw new Error('Only one player can be selected to check loyalty');
    }

    card.loyaltyChecker!.checkLoyalty(userID, owner, this.game.selectedPlayers[0]);
  }

  /**
   * Reveals loyalty from a plot card
   */
  private revealLoyaltyFromCard(userID: string, cardID?: string): void {
    // Find the card with the loyalty checker
    const cards = this.game.addons.plotCards!.activeCards.filter((card) => card.loyaltyChecker);

    // If cardID is provided, find that specific card
    const card = cardID ? cards.find((c) => c.id === cardID) : cards[0];

    if (!card) {
      throw new Error('No active card with loyalty checker found');
    }

    const owner = this.game.findPlayerByID(card.ownerID!);
    if (this.game.selectedPlayers.length !== 1) {
      throw new Error('Only one player can be selected to reveal loyalty to');
    }

    card.loyaltyChecker!.revealLoyalty(userID, owner, this.game.selectedPlayers[0]);
  }

  /**
   * Gets loyalty from a plot card
   */
  private getLoyaltyFromCard(userID: string, cardID?: string): TLoyalty | TRoles {
    // Find the card with the loyalty checker
    const cards = this.game.addons.plotCards!.activeCards.filter((card) => card.loyaltyChecker);

    // If cardID is provided, find that specific card
    const card = cardID ? cards.find((c) => c.id === cardID) : cards[0];

    if (!card) {
      throw new Error('No active card with loyalty checker found');
    }

    return card.loyaltyChecker!.getLoyalty(userID, this.game.selectedPlayers[0]);
  }

  /**
   * Announces loyalty from a plot card
   */
  private announceLoyaltyFromCard(userID: string, loyalty: TLoyalty | TRoles, cardID?: string): void {
    // Find the card with the loyalty checker
    const cards = this.game.addons.plotCards!.activeCards.filter((card) => card.loyaltyChecker);

    // If cardID is provided, find that specific card
    const card = cardID ? cards.find((c) => c.id === cardID) : cards[0];

    if (!card) {
      throw new Error('No active card with loyalty checker found');
    }

    card.loyaltyChecker!.announceLoyalty(userID, this.game.selectedPlayers[0], loyalty);
  }

  getGameData<T extends TGetLoyaltyData>(userID: string, params: T['params']): T['result'] {
    const activeType = this.getActiveLoyaltyCheckerType();

    switch (params.method) {
      case 'getLoyalty':
        if (activeType === 'plot-card') {
          return this.getLoyaltyFromCard(userID, params.cardID);
        }

        if (this.game.addons[activeType]) {
          return this.game.addons[activeType].getLoyalty(userID);
        }

        throw new Error('You cant get loyalty');
    }
  }
}
