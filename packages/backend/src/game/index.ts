import * as _ from 'lodash';

import type { User } from '@/user';

import type { IGameSettings, IGameOptions, IPlayerInGame, TGameStage, IGameAddons } from '@/game/interface';

import type { TMissionResult, TRoles, TLoyalty, TVoteOption } from '@avalon/types';

import type { TAddonsConstructor, TAfterMethods, TBeforeMethods, TRolesWithAddons } from '@/game/addons';
import { rolesWithAddons } from '@/game/const';

import { Mission } from '@/game/history/mission';
import { Vote } from '@/game/history/vote';
import { HistoryElement } from '@/game/history';

import type { Character } from '@/roles';

import { gamesSettings } from '@/game/const';
import roles from '@/roles';

export * from '@/game/interface';
export * from '@/game/const';

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
  vote: Vote;

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
   * Current leader
   */
  protected leader: IPlayerInGame;

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

  constructor(users: User[], options: IGameOptions) {
    if (users.length < 5 || users.length > 10) {
      throw new Error(`Invalid players count. Players count: ${users.length}`);
    }

    const settings = gamesSettings[users.length];

    // Generates roles and give to players
    const gameRoles = this.generateRolesForGame(settings, options);

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
    this.leader.features.isLeader = true;

    // Generate missions
    this.missions = settings.missions.map((el, index) => {
      return new Mission(index === 0 ? 'active' : 'inactive', el);
    });

    // Generate vote
    this.vote = new Vote(this.players, this.leader);

    // Generate addons
    this.addons = Object.entries(rolesWithAddons).reduce<IGameAddons>((acc, data) => {
      const [role, addon] = <[TRolesWithAddons, TAddonsConstructor]>data;

      if (options.roles[role]) {
        acc[role] = new addon(this);
        acc.push(acc[role]!);
      }

      return acc;
    }, []);

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
  protected get selectedPlayers() {
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
    this.leader.features.isLeader = false;
    this.leader = this.leader.next;
    this.leader.features.isLeader = true;
  }

  /**
   * Start next round
   */
  protected startNextRound(): void {
    this.nextVote(true);
    this.round += 1;
    this.currentMission.activateMission();
    this.updateStage('selectTeam');
  }

  /**
   * Finish active round
   */
  protected finishCurrentRound(): void {
    this.clearSelectedAndSendPlayers();
    this.moveLeader();
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

    if (reset) {
      this.turn = 0;
    } else {
      this.turn += 1;
    }

    this.vote = new Vote(this.players, this.leader, this.turn === 4 ? true : undefined);
  }

  /**
   * Leader select player for next mission
   * If player already selected his status will be toggled
   */
  selectPlayer(playerID: string): void {
    const selectedPlayer = this.findPlayerByID(playerID);

    selectedPlayer.features.isSelected = !selectedPlayer.features.isSelected;
  }

  /**
   * Leader sent selected players on vote
   */
  sentSelectedPlayers(): void {
    if (this.currentMission.data.settings.players !== this.selectedPlayers.length) {
      throw new Error(
        `You cant send ${this.selectedPlayers.length} player, on mission what required ${this.currentMission.data.settings.players}`,
      );
    }

    this.selectedPlayers.forEach((player) => {
      player.features.isSent = true;
    });

    if (this.turn === 4) {
      this.startMission();
    } else {
      this.updateStage('votingForTeam');
    }
  }

  /**
   * Start mission
   */
  protected startMission(): void {
    this.history.push(this.vote);
    this.currentMission.startMission(this.sentPlayers, this.leader);
    this.updateStage('onMission');
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
      if (this.updateStage('end') === false) {
        return;
      }

      this.openRoles();
      return;
    }

    this.startNextRound();
  }

  /**
   * Make action on mission
   */
  actionOnMission(playerID: string, result: TMissionResult): void {
    const player = this.findPlayerByID(playerID);

    if (this.currentMission.makeAction(player, result)) {
      this.finishMission();
    }
  }

  /**
   * Vote for mission
   */
  voteForMission(playerID: string, option: TVoteOption): void {
    const player = this.findPlayerByID(playerID);

    if (this.vote.makeVote(player, option)) {
      if (this.vote.data.result === 'approve') {
        this.startMission();
      } else {
        this.history.push(this.vote);
        this.nextVote();
      }
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

  /**
   * Opens the roles of the selected loyalty
   */
  openRoles(loyalty?: TLoyalty): void {
    this.players.forEach((player) => {
      player.role.makeRolesVisible(loyalty);
    });
  }
}
