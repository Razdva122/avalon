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
  TRoles,
  TLoyalty,
  TVoteOption,
  TGameStage,
  IGameSettings,
  IGameSettingsWithRoles,
  IGameOptions,
  TEvilRoles,
  TGoodRoles,
} from '@avalon/types';

import type {
  TRolesAddonsConstructor,
  TAfterMethods,
  TBeforeMethods,
  TRolesWithAddons,
  TAdditionalAddons,
  TAdditionalAddonsConstructor,
} from '@/core/game/addons';

import { rolesWithAddons, addons } from '@/core/game/const';

import { Mission } from '@/core/game/history/mission';
import { Vote } from '@/core/game/history/vote';
import { HistoryElement } from '@/core/game/history';

import type { Character } from '@/core/roles';

import { gamesSettings } from '@/core/game/const';
import roles from '@/core/roles';

export * from '@/core/game/interface';
export * from '@/core/game/const';

export class Game {
  winner?: TLoyalty;

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

  private _stage: TGameStage = 'initialization';

  get stage() {
    return this._stage;
  }

  /**
   * Trying to update the stage, addons may take over control
   * @returns false if addon has taken control
   */
  updateStage(value: TGameStage): boolean {
    for (let i = 0; i < this.addons.length; i += 1) {
      const afterMethod = `after${_.upperFirst(this._stage)}` as TAfterMethods;
      const beforeMethod = `before${_.upperFirst(value)}` as TBeforeMethods;

      if (this.addons[i][afterMethod]?.(value) === false) {
        return false;
      }

      if (this.addons[i][beforeMethod]?.(this._stage) === false) {
        return false;
      }
    }

    this._stage = value;
    return true;
  }

  constructor(users: User[], options: IGameOptions, stateObserver: IStateObserver) {
    if (users.length < 5 || users.length > 10) {
      throw new Error(`Invalid players count. Players count: ${users.length}`);
    }

    this.stateObserver = stateObserver;

    const settings = gamesSettings[users.length];

    // Generates roles and give to players
    const gameRoles = this.generateRolesForGame(settings, options);

    const roles = gameRoles.reduce<IGameSettingsWithRoles['roles']>(
      (acc, el) => {
        if (el.loyalty === 'evil') {
          const loyalty = acc[el.loyalty];
          const role = <TEvilRoles>el.role;
          loyalty[role] = loyalty[role] ? loyalty[role]! + 1 : 1;
        } else {
          const loyalty = acc[el.loyalty];
          const role = <TGoodRoles>el.role;
          loyalty[role] = loyalty[role] ? loyalty[role]! + 1 : 1;
        }

        return acc;
      },
      { evil: {}, good: {} },
    );

    this.settings = {
      ...settings,
      roles,
    };

    const players = users.map((user, index) => ({
      user,
      role: gameRoles[index],
      features: {
        isSelected: false,
        isLeader: false,
        isSent: false,
      },
    }));

    const playersWithNext = players.map((player, index) => {
      const next = <IPlayerInGame>(index === players.length - 1 ? players[0] : players[index + 1]);

      (<IPlayerInGame>player).next = next;

      return <IPlayerInGame>player;
    });

    this.players = playersWithNext;

    this.leader = _.sample(playersWithNext)!;
    this.leader.features.waitForAction = true;

    // Generate missions
    this.missions = this.settings.missions.map((el, index) => {
      return new Mission(index === 0 ? 'active' : 'inactive', el, index);
    });

    // Generate roles addons
    this.addons = Object.entries(rolesWithAddons).reduce<IGameAddons>((acc, data) => {
      const [role, addon] = <[TRolesWithAddons, TRolesAddonsConstructor]>data;

      if (options.roles[role]) {
        acc[role] = new addon(this);
        acc.push(acc[role]!);
      }

      return acc;
    }, []);

    // Generate roles-independent addons
    Object.entries(addons).forEach((data) => {
      const [name, addon] = <[TAdditionalAddons, TAdditionalAddonsConstructor]>data;

      if (options.addons[name]) {
        this.addons[name] = new addon(this);
        this.addons.push(this.addons[name]!);
      }
    });

    this.updateStage('selectTeam');
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
   * Players sent in the current mission
   */
  protected get sentPlayers() {
    return this.players.filter((player) => player.features.isSent);
  }

  /**
   * Generate roles for game
   */
  protected generateRolesForGame(settings: IGameSettings, options: IGameOptions): Character[] {
    const gameRoles: Character[] = [];

    const loyalty = { ...settings.players };

    Object.entries(options.roles).forEach((role) => {
      const [roleName, inGame] = <[TRoles, number]>role;

      for (let i = 0; i < inGame; i += 1) {
        const character = new roles[roleName]();
        gameRoles.push(new roles[roleName]());
        loyalty[character.loyalty] -= 1;
      }
    });

    if (loyalty.evil < 0 || loyalty.good < 0) {
      throw new Error(`It is not possible to create a game with selected roles`);
    }

    for (let i = 0; i < loyalty.evil; i += 1) {
      gameRoles.push(new roles.minion());
    }

    for (let i = 0; i < loyalty.good; i += 1) {
      gameRoles.push(new roles.servant());
    }

    return _.shuffle(gameRoles);
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
  protected startNextRound(): void {
    this.round += 1;
    this.currentMission.activateMission();
    this.nextVote(true);
  }

  /**
   * Finish active round
   */
  protected finishCurrentRound(): void {
    this.clearSelectedAndSendPlayers();
    this.history.push(this.currentMission);
  }

  /**
   * Remove features from all players
   */
  protected clearSelectedAndSendPlayers(): void {
    this.players.forEach((player) => {
      player.features.isSelected = false;
      player.features.isSent = false;
    });
  }

  /**
   * Move vote to next stage
   * @param reset - if true clear stage to 0
   */
  protected nextVote(reset?: true): void {
    this.clearSelectedAndSendPlayers();
    this.moveLeader();

    if (reset) {
      this.turn = 0;
    } else {
      this.turn += 1;
    }

    this.updateStage('selectTeam');
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

    this.selectedPlayers.forEach((player) => {
      player.features.isSent = true;
    });

    this.leader.features.waitForAction = false;

    this.vote = new Vote(this.players, this.leader, this.turn, this.turn === 4 ? true : undefined);

    if (this.turn === 4) {
      this.startMission();
    } else {
      this.updateStage('votingForTeam');

      this.players.forEach((player) => {
        player.features.waitForAction = true;
      });
    }

    this.stateObserver.gameStateChanged();
  }

  /**
   * Start mission
   */
  protected startMission(): void {
    this.history.push(this.vote!);
    this.currentMission.startMission(this.sentPlayers, this.leader);
    this.updateStage('onMission');

    this.sentPlayers.forEach((player) => {
      player.features.waitForAction = true;
    });
  }

  /**
   * Switches the game to the correct status after the end of the mission
   */
  protected finishMission(): void {
    this.finishCurrentRound();
    let needEndGame = false;

    if (this.missions.filter((mission) => mission.data.result === 'fail').length === 3) {
      this.winner = 'evil';
      needEndGame = true;
    }

    if (this.missions.filter((mission) => mission.data.result === 'success').length === 3) {
      this.winner = 'good';
      needEndGame = true;
    }

    if (needEndGame) {
      this.updateStage('end');
      return;
    }

    this.startNextRound();
  }

  /**
   * Make action on mission
   */
  actionOnMission(playerID: string, result: TMissionResult): void {
    const player = this.findPlayerByID(playerID);
    player.features.waitForAction = false;

    if (this.currentMission.makeAction(player, result)) {
      this.finishMission();
    }

    this.stateObserver.gameStateChanged();
  }

  /**
   * Vote for mission
   */
  voteForMission(playerID: string, option: TVoteOption): void {
    const player = this.findPlayerByID(playerID);
    player.features.waitForAction = false;

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
    }

    this.stateObserver.gameStateChanged();
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
