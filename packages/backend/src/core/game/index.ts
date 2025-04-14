import * as _ from 'lodash';

import type { IPlayerInGame, IGameAddons, IStateObserver, TSelectAvailable } from '@/core/game/interface';

import type {
  TMissionResult,
  TLoyalty,
  TVoteOption,
  TGameStage,
  GameSettingsWithRoles,
  GameOptions,
  GameOptionsFeatures,
  AddonsData,
  GameResults,
  TVisibleRole,
  Dictionary,
  TAddonsName,
} from '@avalon/types';

import type { TRolesAddonsData, TRolesWithAddons, TAdditionalAddonsData } from '@/core/game/addons';

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
  result?: GameResults;

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
  features: GameOptionsFeatures;

  /**
   * State game observer
   */
  stateObserver: IStateObserver;

  /**
   * Game settings
   */
  settings: GameSettingsWithRoles;

  /**
   * The intermediate storage where the visible roles opened during the game are stored
   */
  visibleRolesState: Dictionary<Dictionary<TVisibleRole>> = {};

  /**
   * A map with a calculation of which role can make a choice at this stage
   */
  private selectAvailable: TSelectAvailable = {
    selectTeam: [(player) => Boolean(player.features.isLeader)],
  };

  set leader({ userID }: IPlayerInGame) {
    if (this.leader) {
      this.leader.features.isLeader = false;
    }

    const nextLeader = this.players.find((player) => player.userID === userID);

    if (!nextLeader) {
      throw new Error(`Cant set new leader with id: ${userID}`);
    }

    nextLeader.features.isLeader = true;
  }

  get leader() {
    return this.players.find((player) => player.features.isLeader)!;
  }

  stage: TGameStage = 'initialization';

  constructor(userIDs: string[], options: GameOptions, stateObserver: IStateObserver, preInit?: (game: Game) => void) {
    super();

    if (userIDs.length < 5 || userIDs.length > 10) {
      throw new Error(`Invalid players count. Players count: ${userIDs.length}`);
    }

    this.stateObserver = stateObserver;

    const settings = gamesSettings[userIDs.length];

    // Generates roles
    const rolesInfo = generateRolesForGame(settings, options, this);

    this.settings = {
      ...settings,
      roles: rolesInfo.roles,
    };

    this.features = options.features;

    const players = userIDs.map((userID, index) => ({
      userID,
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
      const [role, addons] = <[TRolesWithAddons, TRolesAddonsData[]]>data;

      addons.forEach((addonData) => {
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
      });

      return acc;
    }, []);

    // Generate roles-independent addons
    Object.entries(addons).forEach((data) => {
      const [name, addonData] = <[TAddonsName, TAdditionalAddonsData]>data;

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

    this.players.forEach((player) => {
      const visibility = this.players.reduce<Dictionary<TVisibleRole>>((acc, el) => {
        const visibleRole = player.role.visibility[el.role.role];

        if (el === player) {
          acc[el.userID] = el.role.selfRole;
        } else if (visibleRole) {
          acc[el.userID] = visibleRole;
        }

        return acc;
      }, {});

      this.updateVisibleRolesState(player.userID, visibility);
    });

    if (preInit) {
      preInit(this);
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
  get addonsData(): AddonsData {
    return this.addons.reduce<AddonsData>((acc, addon) => {
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

  addSelectAvailableStage(stage: TGameStage, checker: (player: IPlayerInGame) => boolean): void {
    this.selectAvailable[stage] = this.selectAvailable[stage] || [];
    this.selectAvailable[stage].push(checker);
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
    this.moveVote(true);
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
  clearSendPlayers(): void {
    this.players.forEach((player) => {
      player.features.isSent = false;
    });
  }

  /**
   * Clear selected from all players
   */
  clearSelectedPlayers(): void {
    this.players.forEach((player) => {
      player.features.isSelected = false;
    });
  }

  /**
   * Move vote to next stage
   * @param reset - if true clear stage to 0
   */
  moveVote(reset?: true): void {
    this.clearSendPlayers();
    this.moveLeader();

    if (reset) {
      this.turn = 0;
    } else {
      this.turn += 1;

      if (this.turn === 5) {
        return this.endGame('rejectedVote');
      }
    }

    this.callHooks('beforeSelectTeam', () => {
      this.stage = 'selectTeam';
      this.stateObserver.gameStateChanged();
    });
  }

  /**
   * Init game
   */
  protected initGame(): void {
    this.callHooks(['afterInit', 'beforeSelectTeam'], () => {
      this.stage = 'selectTeam';
      this.stateObserver.gameStateChanged();
    });
  }

  /**
   * Select player
   * If player already selected his status will be toggled
   */
  selectPlayer(executorID: string, playerID: string): void {
    const executor = this.findPlayerByID(executorID);

    if (this.selectAvailable[this.stage]?.some((check) => check(executor))) {
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
    if (this.leader.userID !== executorID) {
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

      this.clearSelectedPlayers();

      this.callHooks(['afterSentTeam', 'beforeVoteForTeam'], () => {
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
      this.vote!.getUnvotedPlayers().forEach((player) => {
        player.features.waitForAction = true;
      });

      this.stage = 'votingForTeam';
    }
  }

  /**
   * Start mission
   */
  protected startMission(): void {
    this.history.push(this.vote!);

    this.callHooks('beforeStartMission', () => {
      this.currentMission.startMission(this.sentPlayers, this.leader);
      this.stage = 'onMission';

      this.sentPlayers.forEach((player) => {
        player.features.waitForAction = true;
      });

      this.stateObserver.gameStateChanged();
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
        if (!this.result) {
          this.result = { winner, reason: winner === 'evil' ? 'evilTeamMissions' : 'goodTeamMissions' };
        }

        this.stage = 'end';

        this.openAllRoles();

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
  endGame(reason: 'manualy' | 'rejectedVote'): void {
    if (reason === 'manualy') {
      this.result = {
        reason: 'manualy',
      };
    } else {
      this.result = {
        reason: 'rejectedVote',
        winner: 'evil',
      };
    }

    this.stage = 'end';
    this.openAllRoles();
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
    if (this.stage !== 'onMission') {
      throw new Error(`You cant make action on stage ${this.stage}`);
    }

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
      this.callHooks(['afterVoteForTeam'], () => {
        if (this.vote!.data.result === 'approve') {
          this.startMission();
        } else {
          this.history.push(this.vote!);
          this.moveVote();
        }

        this.stateObserver.gameStateChanged();
      });
    } else {
      this.stateObserver.gameStateChanged();
    }
  }

  /**
   * Updates visible roles state
   */
  updateVisibleRolesState(target: string, visiblePlayers: Dictionary<TVisibleRole>): void {
    this.visibleRolesState[target] = {
      ...this.visibleRolesState[target],
      ...visiblePlayers,
    };
  }

  /**
   * Get visible roles state
   */
  getVisibleRoleState(observer: string, target: string): TVisibleRole | undefined {
    return this.visibleRolesState[observer]?.[target];
  }

  /**
   * Open roles to everyone
   */
  openAllRoles(): void {
    this.updateVisibleRolesState(
      'all',
      this.players.reduce<Dictionary<TVisibleRole>>((acc, el) => {
        acc[el.userID] = el.role.role;
        return acc;
      }, {}),
    );
  }

  /**
   * Find player by id
   * If player doesnot exist throw error
   */
  findPlayerByID(id: string): IPlayerInGame {
    const player = this.players.find((player) => player.userID === id);

    if (!player) {
      throw new Error(`Player with id: ${id} not exist in game`);
    }

    return player;
  }
}
