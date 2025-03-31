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
  TLoyaltyType,
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

      case 'announceLoyalty':
        this.handleLoyaltyAction(userID, 'announceLoyalty', {
          loyalty: params.loyalty,
          type: params.type,
        });
        break;

      // Plot card methods
      case 'preVote': {
        const activeCard = this.getActivePlotCard();

        if (isChargeCard(activeCard)) {
          activeCard.makeVote(userID, params.option);
        } else {
          throw new Error(`Active card ${activeCard.name} does not support pre-voting`);
        }
        break;
      }

      case 'useLeadToVictory':
        this.handlePlotCardAction('lead to victory', isLeadToVictoryCard, (card) =>
          card.leadToVictory(userID, params.use),
        );
        break;

      case 'useAmbush':
        this.handlePlotCardAction('ambush', isAmbushCard, (card) => card.ambush());
        break;

      case 'useRestoreHonor': {
        this.handlePlotCardAction('restore honor', isRestoreHonorCard, (card) => {
          // Get the selected player from the game
          const selectedPlayers = this.game.players.filter((player) => player.features.isSelected);

          if (selectedPlayers.length !== 1) {
            throw new Error('You must select exactly one player to use restore honor');
          }

          const targetPlayerId = selectedPlayers[0].user.id;
          card.restoreHonor(params.cardName, targetPlayerId, userID);
        });
        break;
      }

      case 'useKingReturns':
        this.handlePlotCardAction('king returns', isKingReturnsCard, (card) => card.kingReturns(params.use));
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
  private getActivePlotCard(): TPlotCard {
    this.ensureAddonExists(this.game.addons.plotCards, 'plot cards');

    const activeCard = this.game.addons.plotCards.activeCard;

    if (!activeCard) {
      throw new Error('No active card');
    }

    return activeCard;
  }

  /**
   * Validates and executes a plot card action
   */
  private handlePlotCardAction<T extends TPlotCard>(
    cardName: string,
    typeGuard: (card: TPlotCard) => card is T,
    action: (card: T) => void,
  ): void {
    const activeCard = this.getActivePlotCard();

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
    method: 'checkLoyalty' | 'announceLoyalty',
    params?: { loyalty: TLoyalty | TRoles; type: TLoyaltyType },
  ): void {
    // For witch loyalty check
    if (this.game.addons.witch && (this.game.stage === 'witchLoyalty' || params?.type === 'witch')) {
      if (method === 'checkLoyalty') {
        this.game.addons.witch.checkLoyalty(userID);
        return;
      } else if (method === 'announceLoyalty' && params) {
        this.game.addons.witch.announceLoyalty(userID, params.loyalty);
        return;
      }
    }

    // For Lady of Lake
    if (this.game.addons.ladyOfLake) {
      if (method === 'checkLoyalty') {
        this.game.addons.ladyOfLake.checkLoyalty(userID);
        return;
      } else if (method === 'announceLoyalty' && params) {
        this.game.addons.ladyOfLake.announceLoyalty(userID, params.loyalty);
        return;
      }
    }

    // For Lady of Sea
    if (this.game.addons.ladyOfSea) {
      if (method === 'checkLoyalty') {
        this.game.addons.ladyOfSea.checkLoyalty(userID);
        return;
      } else if (method === 'announceLoyalty' && params) {
        this.game.addons.ladyOfSea.announceLoyalty(userID, params.loyalty);
        return;
      }
    }

    throw new Error(`You can't use ${method} in this game`);
  }

  getGameData<T extends TGetLoyaltyData>(userID: string, params: T['params']): T['result'] {
    switch (params.method) {
      case 'getLoyalty':
        if (params.type === 'witch') {
          if (this.game.addons.witch) {
            return this.game.addons.witch.getLoyalty(userID);
          }

          throw new Error('You cant get loyalty of witch in game without witch addon');
        }

        if (this.game.addons.ladyOfLake) {
          return this.game.addons.ladyOfLake.getLoyalty(userID);
        }

        if (this.game.addons.ladyOfSea) {
          return this.game.addons.ladyOfSea.getLoyalty(userID);
        }

        throw new Error('You cant use lady in game without lady addon');
    }
  }
}
