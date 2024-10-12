import { User } from '@/user';
import type { TRoomState, Server, IGameOptions, TVoteTarget, TVoteInRoom } from '@avalon/types';
import type { TRoomData } from '@/room/interface';
import { eventBus } from '@/helpers';
import { GameManager } from '@/core/game-manager';
import { Chat } from '@/room/chat';
import * as _ from 'lodash';

export class Room {
  roomID: string;
  players: User[];
  leaderID: string;
  vote?: TVoteInRoom;
  chat: Chat;
  options: IGameOptions;
  data: TRoomData = { stage: 'created' };
  maxCapacity = 10;
  createTime: string;
  startTime?: string;
  io: Server;

  constructor(roomID: string, leaderID: string, players: User[], io: Server, options?: IGameOptions) {
    this.io = io;
    this.roomID = roomID;
    this.players = players;
    this.leaderID = leaderID;
    this.chat = new Chat();
    this.options = options || { addons: {}, roles: {}, features: {} };
    this.createTime = String(new Date());
  }

  joinGame(userID: string, name: string) {
    if (this.data.stage !== 'created') {
      throw new Error(`${userID} try to join game with id ${this.roomID} with stage ${this.data.stage}`);
    }

    if (!this.players.find((player) => player.id === userID) && this.players.length < this.maxCapacity) {
      this.players.push(new User(userID, name));
      this.updateRoomState();
    }
  }

  leaveGame(userID: string) {
    if (this.data.stage === 'started') {
      throw new Error(`${userID} try to leave game with id ${this.roomID} with stage 'started'`);
    }

    const userIndex = this.players.findIndex((player) => player.id === userID);

    if (userIndex !== -1) {
      this.players.splice(userIndex, 1);
    }

    if (userID === this.leaderID) {
      if (this.players.length === 0) {
        this.destroyRoom();
      } else {
        this.leaderID = this.players[0].id;
      }
    }

    this.updateRoomState();
  }

  addMessage(userID: string, userName: string, message: string) {
    this.chat.addMessage(message, userID, userName);
    this.updateRoomState(true);
  }

  toggleLockedState() {
    if (this.data.stage === 'created') {
      this.data = { stage: 'locked' };
    } else if (this.data.stage === 'locked') {
      this.data = { stage: 'created' };
    }

    this.updateRoomState();
  }

  updateRoomState(direct: boolean = false) {
    if (direct) {
      this.players.forEach((player) => {
        this.io.to(player.id).emit('roomUpdated', this.calculateRoomState(player.id));
      });

      this.io
        .except(this.players.map((player) => player.id))
        .to(this.roomID)
        .emit('roomUpdated', this.calculateRoomState());
    } else {
      this.io.to(this.roomID).emit('roomUpdated', this.calculateRoomState());
    }
  }

  startGame() {
    this.data = { stage: 'started', manager: new GameManager(this.players, this.options, this.io, this.roomID) };
    this.startTime = String(new Date());
    this.updateRoomState(true);
  }

  calculateRoomState(userID?: string): TRoomState {
    const roomState = {
      roomID: this.roomID,
      leaderID: this.leaderID,
      vote: this.vote,
      chat: this.chat.history,
      options: this.options,
      players: this.players.map(({ name, id }) => ({ name, id, isLeader: id === this.leaderID })),
    };

    if (this.data.stage === 'started') {
      return {
        ...roomState,
        stage: this.data.stage,
        game: this.data.manager.prepareStateForUser(userID),
      };
    } else {
      return {
        ...roomState,
        stage: this.data.stage,
      };
    }
  }

  updateOptions(options: IGameOptions) {
    this.options = options;
    this.updateRoomState();
  }

  startVoteFor(target: TVoteTarget) {
    if (target === 'endGame' || target === 'endAndRestartGame') {
      if (this.data.stage !== 'started' || this.data.manager.game.stage === 'end') {
        throw new Error(`Cant vote: ${target} in room with stage: ${this.data.stage}`);
      }

      if (this.vote) {
        throw new Error(`Cant start vote: ${target} in room with vote: ${this.vote.target}`);
      }

      this.vote = {
        target,
        votes: this.players.map(({ name, id }) => ({
          name,
          id,
          isLeader: id === this.leaderID,
          voteResult: undefined,
        })),
        result: {
          total: this.players.length,
          yes: 0,
          no: 0,
          required: Math.floor(this.players.length / 2) + 1,
        },
      };
    }

    this.updateRoomState(true);
  }

  makeVote(userID: string, result: boolean) {
    if (!this.vote) {
      throw new Error('There are no active votes');
    }

    const userVote = this.vote.votes.find((player) => player.id === userID);

    if (!userVote || userVote.voteResult !== undefined) {
      throw new Error('You cannot participate in this vote');
    }

    userVote.voteResult = result;

    this.vote.result[result ? 'yes' : 'no'] += 1;

    if (this.vote.result.yes >= this.vote.result.required) {
      this.endVoteFor(this.vote.target);
    } else if (this.vote.result.no >= this.vote.result.total - this.vote.result.required + 1) {
      this.vote = undefined;
    }

    this.updateRoomState(true);
  }

  endVoteFor(target: TVoteTarget) {
    this.vote = undefined;

    if (target === 'endAndRestartGame' || target === 'endGame') {
      if (this.data.stage !== 'started' || this.data.manager.game.stage === 'end') {
        throw new Error(`Cant end vote: ${target} in room with stage: ${this.data.stage}`);
      }

      this.data.manager.game.endGame();
    }

    if (target === 'endAndRestartGame') {
      eventBus.emit('restartRoom', this);
    }
  }

  shuffle() {
    if (this.data.stage === 'started') {
      throw new Error('You cant shuffle started game');
    }

    this.players = _.shuffle(this.players);

    this.updateRoomState();
  }

  protected destroyRoom() {
    // TODO
  }
}
