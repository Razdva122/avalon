import type { TRoomState, Server, GameOptions, TVoteTarget, VoteInRoom } from '@avalon/types';
import type { TRoomData } from '@/room/interface';
import { eventBus } from '@/helpers';
import { GameManager } from '@/core/game-manager';
import { Chat } from '@/room/chat';
import * as _ from 'lodash';

export class Room {
  roomID: string;
  nextRoomID?: string;
  players: string[];
  leaderID: string;
  vote?: VoteInRoom;
  chat: Chat;
  options: GameOptions;
  data: TRoomData = { stage: 'created' };
  maxCapacity = 10;
  createAt: string;
  startAt?: string;
  io: Server;

  constructor(roomID: string, leaderID: string, players: string[], io: Server, options?: GameOptions) {
    this.io = io;
    this.roomID = roomID;
    this.players = players;
    this.leaderID = leaderID;
    this.chat = new Chat();
    this.options = options || { addons: {}, roles: {}, features: { wtfMode: false } };
    this.createAt = String(new Date());
  }

  joinGame(userID: string) {
    if (this.data.stage !== 'created') {
      throw new Error(`${userID} try to join game with id ${this.roomID} with stage ${this.data.stage}`);
    }

    if (!this.players.find((id) => id === userID) && this.players.length < this.maxCapacity) {
      this.players.push(userID);
      this.updateRoomState();
    }
  }

  leaveGame(userID: string) {
    if (this.data.stage === 'started') {
      throw new Error(`${userID} try to leave game with id ${this.roomID} with stage 'started'`);
    }

    const userIndex = this.players.findIndex((id) => id === userID);

    if (userIndex !== -1) {
      this.players.splice(userIndex, 1);
    }

    if (userID === this.leaderID) {
      if (this.players.length === 0) {
        this.destroyRoom();
        return;
      } else {
        this.leaderID = this.players[0];
      }
    }

    this.updateRoomState();
  }

  addMessage(userID: string, message: string) {
    this.chat.addMessage(message, userID);
    this.io.to(this.roomID).emit('newMessage', { text: message, author: userID });
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
      this.players.forEach((playerID) => {
        this.io.to(playerID).emit('roomUpdated', this.calculateRoomState(playerID));
      });

      this.io.except(this.players).to(this.roomID).emit('roomUpdated', this.calculateRoomState());
    } else {
      this.io.to(this.roomID).emit('roomUpdated', this.calculateRoomState());
    }
  }

  startGame() {
    this.startAt = String(new Date());
    this.data = {
      stage: 'started',
      startAt: this.startAt,
      manager: new GameManager(this.players, this.options, this.io, this.roomID),
    };
    this.updateRoomState(true);
  }

  calculateRoomState(userID?: string): TRoomState {
    const roomState = {
      roomID: this.roomID,
      leaderID: this.leaderID,
      vote: this.vote,
      chat: this.chat.history,
      options: this.options,
      players: this.players.map((id) => ({ id, isLeader: id === this.leaderID })),
      createAt: this.createAt,
    };

    if (this.data.stage === 'started') {
      return {
        ...roomState,
        startAt: this.data.startAt,
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

  updateOptions(options: GameOptions) {
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
        votes: this.players.map((id) => ({
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

      this.data.manager.game.endGame('manualy');
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
    eventBus.emit('destroyRoom', this);
  }
}
