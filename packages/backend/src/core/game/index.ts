import * as _ from 'lodash';

import type { User } from '@/user';

import type {
  IPlayerInGame,
  IGameAddons,
  IStateObserver,
  TStageVisibilityChange,
  TSelectAvailable,
} from '@/core/game/interface';

import type {
  TMissionResult,
  TLoyalty,
  TVoteOption,
  TGameStage,
  IGameSettingsWithRoles,
  IGameOptions,
  TGameOptionsFeatures,
  TAddonsData,
  TGameResults,
} from '@avalon/types';

import type { TRolesAddonsData, TRolesWithAddons, TAdditionalAddons, TAdditionalAddonsData } from '@/core/game/addons';

import { rolesWithAddons, addons } from '@/core/game/const';

import { Mission } from '@/core/game/history/mission';
import { Vote } from '@/core/game/history/vote';
import { HistoryElement } from '@/core/game/history';

import { gamesSettings } from '@/core/game/const';

import { generateRolesForGame } from '@/core/game/helpers';

import { GameHooks, THookNames } from '@/core/game/hooks';

export * from '@/core/game/interface';
export * from '@/core/game/const';

export class Game extends GameHooks {
  result?: TGameResults;

  /**
   * Each round is a mission that has happened
   */
  round: number = 0;

  /**
   * history of game
   */
  history: Array<HistoryElement> = [];

  /**
   * Missions state
   */
  missions: Mission[];

  /**
   * Vote for mission state
   */
  vote: Vote | undefined;

  /**
   * Each round turn is reset to 0, the turn increases when the select moves to the next player
   */
  turn: number = 0;

  /**
   * Users participating in the game
   */
  players: IPlayerInGame[];

  /**
   * Enabled addons
   */
  addons: IGameAddons;

  /**
   * Game features
   */
  features: TGameOptionsFeatures;

  /**
   * State game observer
   */
  stateObserver: IStateObserver;

  /**
   * Game settings
   */
  settings: IGameSettingsWithRoles;

  /**
   * On some stages of the game, the visibility of the roles may change
   */
  stageVisibilityChange: TStageVisibilityChange = {
    end: () => true,
  };

  /**
   * A map with a calculation of which role can make a choice at this stage
   */
  selectAvailable: TSelectAvailable = {
    selectTeam: (player) => Boolean(player.features.isLeader),
  };

  set leader({ user: { id } }: IPlayerInGame) {
    if (this.leader) {
      this.leader.features.isLeader = false;
    }

    const nextLeader = this.players.find((player) => player.user.id === id);

    if (!nextLeader) {
      throw new Error(`Cant set new leader with id: ${id}`);
    }

    nextLeader.features.isLeader = true;
  }

  get leader() {
    return this.players.find((player) => player.features.isLeader)!;
  }

  stage: TGameStage = 'initialization';

  constructor(users: User[], options: IGameOptions, stateObserver: IStateObserver) {
    super();

    if (users.length < 5 || users.length > 10) {
      throw new Error(`Invalid players count. Players count: ${users.length}`);
    }

    this.stateObserver = stateObserver;

    const settings = gamesSettings[users.length];

    // Generates roles
    const rolesInfo = generateRolesForGame(settings, options, this);

    this.settings = {
      ...settings,
      roles: rolesInfo.roles,
    };

    this.features = options.features;

    const players = users.map((user, index) => ({
      user,
      role: rolesInfo.characters[index],
      features: {
        isSelected: false,
        isLeader: false,
        isSent: false,
      },
    }));

    const playersWithNext = players.map((player, index) => {
      const next = <IPlayerInGame>(index === players.length - 1 ? players[0] : players[index + 1]);
      const playerInGame = <IPlayerInGame>player;

      playerInGame.next = next;

      return playerInGame;
    });

    this.players = playersWithNext;

    this.leader = _.sample(playersWithNext)!;
    this.leader.features.waitForAction = true;

    let index = 1;
    let currentPlayer = this.leader;

    while (!currentPlayer.index) {
      currentPlayer.index = index;
      currentPlayer = currentPlayer.next;
      index += 1;
    }

    // Generate missions
    this.missions = this.settings.missions.map((el, index) => {
      return new Mission(index === 0 ? 'active' : 'inactive', el, index);
    });

    // Generate roles addons
    this.addons = Object.entries(rolesWithAddons).reduce<IGameAddons>((acc, data) => {
      const [role, addonData] = <[TRolesWithAddons, TRolesAddonsData]>data;

      if (options.roles[role]) {
        const addon = acc[addonData.key];

        if (!addon) {
          // @ts-expect-error in order not to write if for each individual addon
          acc[addonData.key] = new addonData.addon(this, addonData.options);
          acc.push(acc[addonData.key]!);
        } else {
          if ('updateOptions' in addon) {
            addon.updateOptions(addonData.options!);
          }
        }
      }

      return acc;
    }, []);

    // Generate roles-independent addons
    Object.entries(addons).forEach((data) => {
      const [name, addonData] = <[TAdditionalAddons, TAdditionalAddonsData]>data;

      if (options.addons[name]) {
        // @ts-expect-error in order not to write if for each individual addon
        this.addons[addonData.key] = new addonData.addon(this);
        this.addons.push(this.addons[addonData.key]!);
      }
    });

    for (const addon of this.addons) {
      (<THookNames[]>Object.keys(this.hooks)).forEach((hookName) => {
        const addonMethod = addon[hookName];
        if (addonMethod) {
          const stage = addon.priority?.[hookName] || 'medium';
          this.hooks[hookName][stage].push(addonMethod.bind(addon));
        }
      });
    }

    this.initGame();
  }

  /**
   * Current mission
   */
  get currentMission() {
    return this.missions[this.round];
  }

  /**
   * Selected players for the current mission
   */
  get selectedPlayers() {
    return this.players.filter((player) => player.features.isSelected);
  }

  /**
   * Data for the operation of addons
   */
  get addonsData(): TAddonsData {
    return this.addons.reduce<TAddonsData>((acc, addon) => {
      if (addon.addonData) {
        acc = { ...acc, ...addon.addonData };
      }

      return acc;
    }, {});
  }

  /**
   * Players sent in the current mission
   */
  protected get sentPlayers() {
    return this.players.filter((player) => player.features.isSent);
  }

  /**
   * Move leader to next player
   */
  protected moveLeader(): void {
    this.leader = this.leader.next;
    this.leader.features.waitForAction = true;
  }

  /**
   * Start next round
   */
  protected startNextRound() {
    this.round += 1;
    this.currentMission.activateMission();
    this.nextVote(true);
  }

  /**
   * Finish active round
   */
  finishCurrentRound(): void {
    this.clearSendPlayers();
    this.history.push(this.currentMission);
  }

  /**
   * Remove features from all players
   */
  protected clearSendPlayers(): void {
    this.players.forEach((player) => {
      player.features.isSent = false;
    });
  }

  /**
   * Move vote to next stage
   * @param reset - if true clear stage to 0
   */
  protected nextVote(reset?: true): void {
    this.clearSendPlayers();
    this.moveLeader();

    if (reset) {
      this.turn = 0;
    } else {
      this.turn += 1;
    }

    this.callHooks('beforeSelectTeam', () => {
      this.stage = 'selectTeam';
    });
  }

  /**
   * Init game
   */
  protected initGame(): void {
    this.callHooks(['afterInit', 'beforeSelectTeam'], () => {
      this.stage = 'selectTeam';
    });
  }

  /**
   * Select player
   * If player already selected his status will be toggled
   */
  selectPlayer(executorID: string, playerID: string): void {
    const executor = this.findPlayerByID(executorID);

    if (this.selectAvailable[this.stage]?.(executor)) {
      const selectedPlayer = this.findPlayerByID(playerID);

      selectedPlayer.features.isSelected = !selectedPlayer.features.isSelected;
      this.stateObserver.gameStateChanged();
    } else {
      throw new Error(`You cant select player on stage ${this.stage}`);
    }
  }

  /**
   * Leader sent selected players on vote
   */
  sentSelectedPlayers(executorID: string): void {
    if (this.leader.user.id !== executorID) {
      throw new Error('Only leader can send selected players');
    }

    if (this.currentMission.data.settings.players !== this.selectedPlayers.length) {
      throw new Error(
        `You cant send ${this.selectedPlayers.length} player, on mission what required ${this.currentMission.data.settings.players}`,
      );
    }

    this.callHooks(['afterSelectTeam', 'beforeSentTeam'], () => {
      this.selectedPlayers.forEach((player) => {
        player.features.isSent = true;
      });

      this.leader.features.waitForAction = false;

      this.vote = new Vote(this.players, this.leader, this.turn, this.turn === 4 ? true : undefined);

      this.players.forEach((player) => {
        player.features.isSelected = false;
      });

      this.callHooks('afterSentTeam', () => {
        this.sentTeamNextStage();

        this.stateObserver.gameStateChanged();
      });
    });
  }

  /**
   * Moves the game to the next stage after sending the team
   */
  sentTeamNextStage(): void {
    if (this.turn === 4) {
      this.startMission();
    } else {
      this.players.forEach((player) => {
        player.features.waitForAction = true;
      });

      this.stage = 'votingForTeam';
    }
  }

  /**
   * Start mission
   */
  protected startMission(): void {
    this.callHooks('beforeStartMission', () => {
      this.history.push(this.vote!);
      this.currentMission.startMission(this.sentPlayers, this.leader);
      this.stage = 'onMission';

      this.sentPlayers.forEach((player) => {
        player.features.waitForAction = true;
      });

      this.callHooks('afterStartMission');
    });
  }

  /**
   * Switches the game to the correct status after the end of the mission
   */
  finishMission(): void {
    const winner = this.calculateCurrentWinner();

    this.finishCurrentRound();

    if (winner) {
      this.callHooks('beforeEndGame', () => {
        this.result = { winner, reason: winner === 'evil' ? 'evilTeamMissions' : 'goodTeamMissions' };
        this.stage = 'end';

        this.stateObserver.gameStateChanged();
        this.callHooks('afterEndMission');
      });
    } else {
      this.startNextRound();

      this.stateObserver.gameStateChanged();

      this.callHooks('afterEndMission');
    }
  }

  /**
   * Premature end of the game
   */
  endGame(): void {
    this.result = {
      reason: 'manualy',
    };
    this.stage = 'end';
    this.stateObserver.gameStateChanged();
  }

  /**
   * Calculates the results of the winner according to the missions
   *
   * @returns Current winning team
   */
  calculateCurrentWinner(): TLoyalty | undefined {
    if (this.missions.filter((mission) => mission.data.result === 'fail').length === 3) {
      return 'evil';
    }

    if (this.missions.filter((mission) => mission.data.result === 'success').length === 3) {
      return 'good';
    }
  }

  /**
   * Make action on mission
   */
  actionOnMission(playerID: string, result: TMissionResult): void {
    const player = this.findPlayerByID(playerID);

    if (this.currentMission.makeAction(player, result)) {
      this.callHooks('beforeEndMission', () => {
        this.currentMission.finishMission();
        this.finishMission();
      });
    } else {
      this.stateObserver.gameStateChanged();
    }
  }

  /**
   * Vote for mission
   */
  voteForMission(playerID: string, option: TVoteOption): void {
    const player = this.findPlayerByID(playerID);

    if (!this.vote) {
      throw new Error(`You cant vote for mission on stage ${this.stage}`);
    }

    if (this.vote.makeVote(player, option)) {
      if (this.vote.data.result === 'approve') {
        this.startMission();
      } else {
        this.history.push(this.vote);
        this.nextVote();
      }

      this.callHooks('afterVoteForTeam', () => {
        this.stateObserver.gameStateChanged();
      });
    } else {
      this.stateObserver.gameStateChanged();
    }
  }

  /**
   * Find player by id
   * If player doesnot exist throw error
   */
  findPlayerByID(id: string): IPlayerInGame {
    const player = this.players.find((player) => player.user.id === id);

    if (!player) {
      throw new Error(`Player with id: ${id} not exist in game`);
    }

    return player;
  }
}
