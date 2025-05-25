import type { Game } from '@/core/game';
import type { TGameStage, TVoteOption, TMissionResult, TAssassinateType } from '@avalon/types';
import _ from 'lodash';

export interface TimerState {
  startTime: number;
  endTime: number;
  duration: number;
  stage: TGameStage;
  expired: boolean;
}

export class GameTimer {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private currentTimer?: TimerState;
  private game: Game;
  private pendingHistoryDelay: boolean = false;

  constructor(game: Game) {
    this.game = game;
  }

  /**
   * Mark that we need a history delay for the next timer
   */
  setHistoryDelay(): void {
    this.pendingHistoryDelay = true;
  }

  /**
   * Start a timer for the current stage
   */
  startTimer(stage: TGameStage, duration: number): void {
    this.clearTimer();

    if (!this.game.features.timerEnabled || !duration) {
      return;
    }

    // Check if we need to add a history display delay
    const delay = this.pendingHistoryDelay ? 10000 : 0; // 10 seconds for history display
    this.pendingHistoryDelay = false;

    // If there's a delay, set the timer to start in the future
    const now = Date.now();
    const startTime = now + delay;
    this.currentTimer = {
      startTime: startTime,
      endTime: startTime + duration * 1000,
      duration: duration * 1000,
      stage,
      expired: false,
    };

    const timeoutId = setTimeout(
      () => {
        this.handleTimerExpired(stage);
      },
      delay + duration * 1000,
    );

    this.timers.set(stage, timeoutId);
  }

  /**
   * Clear the current timer
   */
  clearTimer(): void {
    if (this.currentTimer) {
      const timeoutId = this.timers.get(this.currentTimer.stage);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.timers.delete(this.currentTimer.stage);
      }
      this.currentTimer = undefined;
    }
    // Clear all timers to be safe
    this.timers.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.timers.clear();
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemainingTime(): number {
    if (!this.currentTimer || this.currentTimer.expired) {
      return 0;
    }

    const elapsed = Date.now() - this.currentTimer.startTime;
    const remaining = this.currentTimer.duration - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Get timer state for frontend
   */
  getTimerState(): { active: boolean; endTime?: number; stage?: TGameStage } {
    if (!this.currentTimer || !this.game.features.timerEnabled || this.currentTimer.expired) {
      return { active: false };
    }

    // Check if timer has already expired
    const now = Date.now();
    if (now >= this.currentTimer.endTime) {
      return { active: false };
    }

    return {
      active: true,
      endTime: this.currentTimer.endTime,
      stage: this.currentTimer.stage,
    };
  }

  /**
   * Handle timer expiration
   */
  private handleTimerExpired(stage: TGameStage): void {
    if (this.currentTimer && this.currentTimer.stage === stage) {
      this.currentTimer.expired = true;

      // Clear the timer from our map
      this.timers.delete(stage);

      try {
        switch (stage) {
          case 'selectTeam':
            this.handleSelectTeamTimeout();
            break;
          case 'giveExcalibur':
            this.handleGiveExcaliburTimeout();
            break;
          case 'votingForTeam':
            this.handleVoteForTeamTimeout();
            break;
          case 'onMission':
            this.handleMissionTimeout();
            break;
          case 'useExcalibur':
            this.handleUseExcaliburTimeout();
            break;
          case 'assassinate':
            this.handleAssassinateTimeout();
            break;
          case 'checkLoyalty':
          case 'announceLoyalty':
          case 'revealLoyalty':
            this.handleLoyaltyCheckTimeout();
            break;
        }
      } finally {
        // Ensure state is updated even if an error occurs
        this.game.stateObserver.gameStateChanged();
      }
    }
  }

  /**
   * Handle select team timeout - select random valid players
   */
  private handleSelectTeamTimeout(): void {
    const requiredPlayers = this.game.currentMission.data.settings.players;
    const availablePlayers = this.game.players.filter((p) => !p.features.isSelected);

    while (this.game.selectedPlayers.length < requiredPlayers && availablePlayers.length > 0) {
      const randomPlayer = _.sample(availablePlayers);
      if (randomPlayer) {
        this.game.selectPlayer(this.game.leader.userID, randomPlayer.userID);
        _.pull(availablePlayers, randomPlayer);
      }
    }

    while (this.game.selectedPlayers.length > requiredPlayers) {
      const randomSelected = _.sample(this.game.selectedPlayers);
      if (randomSelected) {
        this.game.selectPlayer(this.game.leader.userID, randomSelected.userID);
      }
    }

    this.game.sentSelectedPlayers(this.game.leader.userID);
  }

  /**
   * Handle give Excalibur timeout - give to random team member
   */
  private handleGiveExcaliburTimeout(): void {
    const teamMembers = this.game.players.filter((p) => p.features.isSent && p !== this.game.leader);
    const randomMember = _.sample(teamMembers);

    if (randomMember && this.game.addons.excalibur) {
      this.game.selectPlayer(this.game.leader.userID, randomMember.userID);
      this.game.addons.excalibur.giveExcalibur(this.game.leader.userID);
    }
  }

  /**
   * Handle vote for team timeout - vote randomly
   */
  private handleVoteForTeamTimeout(): void {
    const unvotedPlayers = this.game.vote?.getUnvotedPlayers() || [];

    for (const player of unvotedPlayers) {
      try {
        const randomVote: TVoteOption = _.sample(['approve', 'reject'])!;
        this.game.voteForMission(player.userID, randomVote);
      } catch (error) {
        // Player might have voted while we were processing, skip them
        console.log(
          `[Timer] Could not auto-vote for player ${player.userID}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  /**
   * Handle mission timeout - good players vote success, evil vote randomly
   */
  private handleMissionTimeout(): void {
    const missionActions = this.game.currentMission.data.actions;

    for (const missionAction of missionActions) {
      if (missionAction.value === 'unvoted') {
        try {
          let action: TMissionResult = 'success';

          if (missionAction.player.role.loyalty === 'evil') {
            action = _.sample(['success', 'fail'])!;
          }

          this.game.actionOnMission(missionAction.player.userID, action);
        } catch (error) {
          // Player might have acted while we were processing, skip them
          console.log(
            `[Timer] Could not auto-act for player ${missionAction.player.userID}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }
    }
  }

  /**
   * Handle use Excalibur timeout - don't use it
   */
  private handleUseExcaliburTimeout(): void {
    const excaliburOwner = this.game.players.find((p) => p.features.excalibur);

    if (excaliburOwner && this.game.addons.excalibur) {
      this.game.addons.excalibur.useExcalibur(excaliburOwner.userID);
    }
  }

  /**
   * Handle assassinate timeout - select random good player
   */
  private handleAssassinateTimeout(): void {
    const assassin = this.game.players.find((p) => p.features.isAssassin);
    if (!assassin || !this.game.addons.assassin) return;

    const targets = this.game.addons.assassin.addonData.assassin?.assassinateTargets || [];

    if (targets.length > 0) {
      const primaryTarget = targets[0];
      const goodPlayers = this.game.players.filter((p) => p.role.loyalty === 'good');

      if (primaryTarget === 'merlin') {
        const randomGood = _.sample(goodPlayers);
        if (randomGood) {
          this.game.selectPlayer(assassin.userID, randomGood.userID);
          this.game.addons.assassin.assassinate(assassin.userID, primaryTarget as TAssassinateType);
        }
      } else if (primaryTarget === 'lovers') {
        const lovers = goodPlayers.filter((p) => p.role.role === 'tristan' || p.role.role === 'isolde');
        const selectedLovers = lovers.length >= 2 ? lovers : _.sampleSize(goodPlayers, 2);

        for (const lover of selectedLovers) {
          this.game.selectPlayer(assassin.userID, lover.userID);
        }
        this.game.addons.assassin.assassinate(assassin.userID, 'lovers');
      }
    }
  }

  /**
   * Handle loyalty check timeout - select random player
   */
  private handleLoyaltyCheckTimeout(): void {
    const activePlayer = this.game.players.find((p) => p.features.waitForAction);
    if (!activePlayer) return;

    const otherPlayers = this.game.players.filter((p) => p !== activePlayer);
    const randomPlayer = _.sample(otherPlayers);

    if (randomPlayer) {
      this.game.selectPlayer(activePlayer.userID, randomPlayer.userID);

      if (this.game.stage === 'checkLoyalty') {
        if (this.game.addons.ladyOfLake) {
          this.game.addons.ladyOfLake.checkLoyalty(activePlayer.userID);
        } else if (this.game.addons.ladyOfSea) {
          this.game.addons.ladyOfSea.checkLoyalty(activePlayer.userID);
        }
      } else if (this.game.stage === 'announceLoyalty' && this.game.addons.ladyOfLake) {
        const randomLoyalty = _.sample(['good', 'evil'])!;
        this.game.addons.ladyOfLake.announceLoyalty(activePlayer.userID, randomLoyalty as 'good' | 'evil');
      }
    }
  }
}
