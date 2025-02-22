import cloneDeep from 'lodash/cloneDeep';
import last from 'lodash/last';

import type { VisualGameState, TRoomState, THistoryResults, TGameStage, Player, RoomPlayer } from '@avalon/types';
import { Ref, computed, ref, provide, InjectionKey } from 'vue';
import { TPageRoomStateRef, TStartedPageRoomState } from '@/helpers/game-state-manager/interface';

export const gameStateKey = Symbol() as InjectionKey<Ref<VisualGameState>>;
export const stateManagerKey = Symbol() as InjectionKey<GameStateManager>;

export * from '@/helpers/game-state-manager/interface';

export class GameStateManager {
  state: TPageRoomStateRef;
  game: Ref<VisualGameState>;
  viewMode: Ref<'live' | 'history'> = ref('live');

  constructor() {
    this.state = ref() as TPageRoomStateRef;

    this.game = computed(() => {
      if (this.state.value.stage === 'started') {
        return this.state.value.gameStates[this.state.value.pointer];
      }
    }) as Ref<VisualGameState>;

    provide(gameStateKey, this.game);
    provide(stateManagerKey, this);
  }

  moveToNextStage(): void {
    if (this.state.value.stage === 'started') {
      if (this.state.value.pointer === this.state.value.gameStates.length - 1) {
        return;
      }

      this.state.value.pointer += 1;
    }
  }

  moveToPrevStage(): void {
    if (this.state.value.stage === 'started') {
      if (this.state.value.pointer === 0) {
        return;
      }

      this.state.value.pointer -= 1;
    }
  }

  mutateRoomState({
    newRoomState,
    newGameState,
    userID,
  }: {
    newRoomState?: TRoomState;
    newGameState?: VisualGameState;
    userID?: string;
  }): void {
    if (userID) {
      if (newRoomState) {
        this.mutateRoomGameForPosition(newRoomState, userID);

        if ('game' in newRoomState) {
          this.mutateRoomGameForPosition(newRoomState.game, userID);
        }
      }

      if (newGameState) {
        this.mutateRoomGameForPosition(newGameState, userID);
      }
    }

    if (newRoomState) {
      if (newRoomState.stage === 'started') {
        const game = newRoomState.game;

        this.state.value = {
          ...newRoomState,
          pointer: 0,
          gameStates: [],
        };

        this.generateGameStatesFromHistory(this.state.value.gameStates, game.history, game);
        this.state.value.pointer = this.state.value.gameStates.length - 1;
      } else {
        this.state.value = {
          ...newRoomState,
        };
      }
    }

    if (newGameState && this.state.value.stage === 'started') {
      this.state.value.game = newGameState;

      if (this.state.value.gameStates.length - 1 === newGameState.history.length) {
        this.state.value.gameStates[this.state.value.gameStates.length - 1] = newGameState;
      } else {
        this.generateGameStatesFromHistory(this.state.value.gameStates, newGameState.history, newGameState);
      }
    }
  }

  generateGameStatesFromHistory(
    gameStates: VisualGameState[],
    history: THistoryResults[],
    newState: VisualGameState,
  ): void {
    const prevState = gameStates[gameStates.length - 1] ?? newState;
    const indexStart = gameStates.length;

    while (gameStates.length - 1 !== history.length) {
      const state = cloneDeep(newState);
      const prevStateClone = this.normalizeState(cloneDeep(prevState));

      if (gameStates[gameStates.length - 1]) {
        this.mutateStateForHistory(gameStates[gameStates.length - 1], gameStates.length, history);
      }

      if (gameStates.length === history.length) {
        gameStates.push(state);
      } else {
        gameStates.push(prevStateClone);
      }
    }

    this.calculateViewFromHistory(gameStates, indexStart);
  }

  normalizeState(state: VisualGameState): VisualGameState {
    state.players.forEach((player) => {
      player.features.isAssassin = false;
      player.features.isSelected = false;
      player.features.isSent = false;
      player.features.waitForAction = false;
    });

    return state;
  }

  mutateStateForHistory(state: VisualGameState, index: number, history: THistoryResults[]): void {
    state.history = history.slice(0, index);
    state.stage = this.getStageFromHistory(last(state.history)!);
  }

  calculateViewFromHistory(gameStates: VisualGameState[], startIndex: number): void {
    let index = gameStates.length - 1;
    let current: VisualGameState;
    let prev: VisualGameState | undefined;
    let next: VisualGameState | undefined;
    let skipedFirstCrown = false;

    while (index > startIndex) {
      index -= 1;
      current = gameStates[index];
      prev = gameStates[index - 1];
      next = gameStates[index + 1];

      if ((current.stage === 'votingForTeam' && prev?.stage === 'votingForTeam') || prev?.stage === 'onMission') {
        if (skipedFirstCrown === false) {
          skipedFirstCrown = true;
        } else {
          let mutateIndex = index;

          while (mutateIndex >= startIndex) {
            const players = gameStates[mutateIndex].players;
            const leader = players.find((player) => player.features.isLeader)!;
            leader.features.isLeader = false;
            const prevLeader = this.getClosePlayer(players, leader, -1);
            prevLeader.features.isLeader = true;
            mutateIndex -= 1;
          }
        }
      }

      if (current.stage === 'checkLoyalty') {
        let mutateIndex = index;

        const history = last(current.history)!;

        if (history.type !== 'checkLoyalty') {
          return;
        }

        const target = current.players.find((player) => player.id === history.inspectedID)!;
        target.features.isSelected = true;
        const validator = current.players.find((player) => player.id === history.validatorID)!;
        validator.features.waitForAction = true;

        const typeOfLady = validator.features.ladyOfLake ? 'ladyOfLake' : 'ladyOfSea';

        while (mutateIndex >= startIndex) {
          const players = gameStates[mutateIndex].players;
          const target = players.find((player) => player.id === history.inspectedID)!;
          const validator = players.find((player) => player.id === history.validatorID)!;
          target.features[typeOfLady] = undefined;
          validator.features[typeOfLady] = 'has';
          mutateIndex -= 1;
        }
      }

      if (current.stage === 'onMission') {
        const history = last(current.history)!;
        const excaliburHistory = prev.stage === 'useExcalibur' ? last(prev.history) : undefined;
        const excaliburOwnerID = excaliburHistory?.type === 'switchResult' ? excaliburHistory.switcherID : undefined;

        current.players.forEach((player) => {
          if (history.type === 'mission') {
            const action = history.actions?.find((action) => action.playerID === player.id);

            if (action) {
              player.features.isSent = true;

              if (player.id === excaliburOwnerID) {
                player.features.excalibur = true;
              }
            }
          }
        });
      }

      if (current.stage === 'votingForTeam') {
        const history = last(current.history)!;

        if (history.type === 'vote') {
          history.team.forEach((teamMember) => {
            const player = current.players.find((player) => teamMember.id === player.id);

            if (player) {
              player.features.excalibur = teamMember.excalibur;
              player.features.isSent = true;
            }
          });
        }

        if (next.stage === 'useExcalibur') {
          next.players = cloneDeep(current.players);
        }
      }

      if (current.stage === 'assassinate') {
        const history = last(current.history)!;

        if (history.type === 'assassinate') {
          current.players.forEach((player) => {
            if (player.id === history.assassinID) {
              player.features.isAssassin = true;
            }

            if (history.killedIDs.includes(player.id)) {
              player.features.isSelected = true;
            }
          });
        }
      }

      if (current.stage === 'switchLancelots') {
        const history = last(current.history)!;

        if (history.type === 'switchLancelots' && history.result === true) {
          let mutateIndex = index - 1;

          while (mutateIndex >= startIndex) {
            const players = gameStates[mutateIndex].players;
            const goodLancelot = players.find((player) => player.role === 'goodLancelot');
            const evilLancelot = players.find((player) => player.role === 'evilLancelot');

            if (goodLancelot && evilLancelot) {
              goodLancelot.role = 'evilLancelot';
              evilLancelot.role = 'goodLancelot';
            }

            mutateIndex -= 1;
          }
        }
      }
    }
  }

  getClosePlayer(players: Player[], closeTo: Player, shift: number): Player {
    let index = players.findIndex((player) => player === closeTo) + shift;

    if (index === -1) {
      index = players.length - 1;
    }

    if (index === players.length) {
      index = 0;
    }

    return players[index];
  }

  getStageFromHistory(history: THistoryResults): TGameStage {
    return (
      {
        vote: 'votingForTeam',
        assassinate: 'assassinate',
        checkLoyalty: 'checkLoyalty',
        mission: 'onMission',
        switchLancelots: 'switchLancelots',
        switchResult: 'useExcalibur',
        hidden: 'hidden',
      } as const
    )[history.type];
  }

  toggleViewMode(): void {
    if (this.state.value.stage === 'started') {
      if (this.viewMode.value === 'history') {
        this.state.value.pointer = this.state.value.gameStates.length - 1;
        this.viewMode.value = 'live';
      } else {
        this.viewMode.value = 'history';
      }
    }
  }

  get startedRoomState(): Ref<TStartedPageRoomState> {
    if (this.state.value.stage !== 'started') {
      throw new Error('You cant get started room state');
    }

    return this.state as Ref<TStartedPageRoomState>;
  }

  protected mutateRoomGameForPosition<T extends TRoomState | VisualGameState>(roomOrGame: T, userID?: string): T {
    if (userID) {
      const indexOfPlayer = roomOrGame.players.findIndex((player) => player.id === userID);

      if (indexOfPlayer !== -1) {
        roomOrGame.players = <Player[] | RoomPlayer[]>[
          ...roomOrGame.players.slice(indexOfPlayer),
          ...roomOrGame.players.slice(0, indexOfPlayer),
        ];
      }
    }

    return roomOrGame;
  }
}
