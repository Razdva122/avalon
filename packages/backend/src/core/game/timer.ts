import type { Game } from '@/core/game';
import type { TTimerStage, TVoteOption, TMissionResult } from '@avalon/types';
import type { TimerDurations } from '@avalon/types';
import { STAGE_TIMER_DEFAULTS } from '@avalon/types/game/timer-defaults';
import _ from 'lodash';

export interface TimerState {
  startTime: number;
  endTime: number;
  duration: number;
  stage: TTimerStage;
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
   * Get stage-specific duration or fall back to default
   */
  private getStageSpecificDuration(stage: TTimerStage): number {
    // Check for stage-specific duration from user configuration
    const stageConfig = this.game.features.timerDurations?.[stage as keyof TimerDurations];

    // If stage-specific duration exists, use it
    if (stageConfig && stageConfig.duration !== undefined && stageConfig.duration > 0) {
      return stageConfig.duration;
    }

    // Otherwise, use the default for this stage
    return STAGE_TIMER_DEFAULTS[stage] || 60; // Fallback to 60 seconds if stage not found
  }

  /**
   * Check if timer is enabled for a specific stage
   */
  private isStageTimerEnabled(stage: TTimerStage): boolean {
    // Check for stage-specific enabled flag
    const stageConfig = this.game.features.timerDurations?.[stage as keyof TimerDurations];

    if (stageConfig?.enabled !== undefined) {
      return stageConfig.enabled;
    }

    return false;
  }

  /**
   * Start a timer for the current stage
   */
  startTimer(stage: TTimerStage): void {
    this.clearTimer();

    if (!this.isStageTimerEnabled(stage)) {
      return;
    }

    // Get stage-specific duration
    const duration = this.getStageSpecificDuration(stage);
    console.log(`[GameTimer] Starting timer for stage: ${stage}, duration: ${duration}s`);

    // Check if we need to add a history display delay
    const delay = this.pendingHistoryDelay ? 10000 : 0; // 10 seconds for history display
    this.pendingHistoryDelay = false;

    // If there's a delay, set the timer to start in the future
    const now = Date.now();
    const startTime = now + delay;
    this.currentTimer = {
      startTime: startTime,
      endTime: now + delay + duration * 1000,
      duration: duration * 1000,
      stage,
      expired: false,
    };

    if (delay > 0) {
      console.log(`[GameTimer] Timer for stage: ${stage} has ${delay / 1000}s delay before starting`);

      const visibilityTimeoutId = setTimeout(() => {
        // Notify clients that the timer is now visible
        this.game.stateObserver.gameStateChanged();
      }, delay);

      // Store this timeout so we can clear it if needed
      this.timers.set(`${stage}_visibility`, visibilityTimeoutId);
    }

    const timeoutId = setTimeout(
      () => {
        console.log(`[GameTimer] Timer callback triggered for stage: ${stage}`);
        try {
          this.handleTimerExpired(stage);
        } catch (error) {
          console.error(`[GameTimer] Critical error in timer callback for stage ${stage}:`, error);
          if (error instanceof Error) {
            console.error(`[GameTimer] Error stack:`, error.stack);
          }
        }
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
      console.log(`[GameTimer] Clearing timer for stage: ${this.currentTimer.stage}`);
      const timeoutId = this.timers.get(this.currentTimer.stage);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.timers.delete(this.currentTimer.stage);
      }

      // Also clear visibility timeout if it exists
      const visibilityTimeoutId = this.timers.get(`${this.currentTimer.stage}_visibility`);
      if (visibilityTimeoutId) {
        clearTimeout(visibilityTimeoutId);
        this.timers.delete(`${this.currentTimer.stage}_visibility`);
      }

      this.currentTimer = undefined;
    }

    // Clear all timers to be safe
    this.timers.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });

    this.timers.clear();

    console.log(`[GameTimer] Cleanup completed: Cleared ${this.timers.size} active timers`);
  }

  /**
   * Cleanup method to ensure all timers are cleared and references removed
   */
  cleanup(): void {
    this.clearTimer();
    this.currentTimer = undefined;
    this.pendingHistoryDelay = false;
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
  getTimerState(): { active: boolean; endTime?: number; stage?: TTimerStage } {
    if (!this.currentTimer || !this.isStageTimerEnabled(this.currentTimer.stage) || this.currentTimer.expired) {
      return { active: false };
    }

    const now = Date.now();

    // Check if we're still in the delay period (timer hasn't started yet)
    if (now < this.currentTimer.startTime) {
      return { active: false };
    }

    // Check if timer has already expired
    if (now >= this.currentTimer.endTime) {
      return { active: false };
    }

    // Calculate the visible endTime based on when the timer became visible
    // This ensures the frontend shows the full duration from when it appears
    const visibleEndTime = this.currentTimer.startTime + this.currentTimer.duration;

    return {
      active: true,
      endTime: visibleEndTime,
      stage: this.currentTimer.stage,
    };
  }

  /**
   * Handle timer expiration
   */
  private handleTimerExpired(stage: TTimerStage): void {
    if (this.currentTimer && this.currentTimer.stage === stage) {
      console.log(`[GameTimer] Timer expired for stage: ${stage}, current game stage: ${this.game.stage}`);
      this.currentTimer.expired = true;

      // Clear the timer from our map
      this.timers.delete(stage);

      switch (stage) {
        case 'selectTeam':
        case 'firstSelectTeam':
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
    } else {
      console.log(`[GameTimer] Timer expiration ignored - conditions not met. Stage: ${stage}`);
    }
  }

  /**
   * Handle select team timeout - select random valid players
   */
  private handleSelectTeamTimeout(): void {
    try {
      const requiredPlayers = this.game.currentMission.data.settings.players;
      const availablePlayers = this.game.players.filter((p) => !p.features.isSelected);
      console.log(
        `[GameTimer] SelectTeam timeout: Required players: ${requiredPlayers}, Available: ${availablePlayers.length}, Already selected: ${this.game.selectedPlayers.length}`,
      );

      while (this.game.selectedPlayers.length < requiredPlayers) {
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
      console.log(`[GameTimer] SelectTeam timeout completed: Sent ${this.game.selectedPlayers.length} players`);
    } catch (error) {
      console.error('[GameTimer] Error in handleSelectTeamTimeout:', error);
    }
  }

  /**
   * Handle give Excalibur timeout - give to random team member
   */
  private handleGiveExcaliburTimeout(): void {
    // Filter selected players to only those on mission
    const selectedOnMission = this.game.selectedPlayers.filter((p) => p.features.isSent && p !== this.game.leader);

    // If no valid players selected, we need to handle two cases:
    // 1. No players selected at all
    // 2. Players selected but none are valid (need to deselect them first)
    if (selectedOnMission.length === 0) {
      // First, deselect any invalid selections
      if (this.game.selectedPlayers.length > 0) {
        for (const player of this.game.selectedPlayers) {
          this.game.selectPlayer(this.game.leader.userID, player.userID);
        }
      }

      // Then select a random team member
      const teamMembers = this.game.players.filter((p) => p.features.isSent && p !== this.game.leader);
      const randomMember = _.sample(teamMembers);

      if (randomMember) {
        this.game.selectPlayer(this.game.leader.userID, randomMember.userID);
      }
    } else if (selectedOnMission.length > 1) {
      // Too many valid players selected, keep only the first one
      // First deselect all selected players
      for (const player of this.game.selectedPlayers) {
        if (player !== selectedOnMission[0]) {
          this.game.selectPlayer(this.game.leader.userID, player.userID);
        }
      }
    } else if (this.game.selectedPlayers.length > selectedOnMission.length) {
      // Some selected players are not on mission, deselect them
      for (const player of this.game.selectedPlayers) {
        if (!player.features.isSent || player === this.game.leader) {
          this.game.selectPlayer(this.game.leader.userID, player.userID);
        }
      }
    }

    if (this.game.addons.excalibur) {
      this.game.addons.excalibur.giveExcalibur(this.game.leader.userID);
    }
  }

  /**
   * Handle vote for team timeout - vote randomly
   */
  private handleVoteForTeamTimeout(): void {
    const unvotedPlayers = this.game.vote?.getUnvotedPlayers() || [];
    console.log(`[GameTimer] VoteForTeam timeout: ${unvotedPlayers.length} players haven't voted`);

    for (const player of unvotedPlayers) {
      try {
        const randomVote: TVoteOption = _.sample(['approve', 'reject'])!;
        this.game.voteForMission(player.userID, randomVote);
        console.log(`[GameTimer] Auto-voted ${randomVote} for player ${player.userID}`);
      } catch (error) {
        // Player might have voted while we were processing, skip them
        console.log(
          `[GameTimer] Could not auto-vote for player ${player.userID}:`,
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
    const unvotedActions = missionActions.filter((a) => a.value === 'unvoted');
    console.log(`[GameTimer] Mission timeout: ${unvotedActions.length} players haven't made action`);

    for (const missionAction of missionActions) {
      if (missionAction.value === 'unvoted') {
        try {
          const action: TMissionResult = _.sample(missionAction.player.role.validMissionResult)!;

          this.game.actionOnMission(missionAction.player.userID, action);
          console.log(
            `[GameTimer] Auto-action ${action} for player ${missionAction.player.userID} (${missionAction.player.role.loyalty})`,
          );
        } catch (error) {
          // Player might have acted while we were processing, skip them
          console.log(
            `[GameTimer] Could not auto-act for player ${missionAction.player.userID}:`,
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
    try {
      const assassin = this.game.players.find((p) => p.features.isAssassin);
      if (!assassin || !this.game.addons.assassin) {
        console.log(`[GameTimer] Assassinate timeout: No assassin found or addon not available`);
        return;
      }
      console.log(`[GameTimer] Assassinate timeout: Assassin ${assassin.userID} needs to make selection`);

      const progressData = this.game.addons.assassin.progressData;
      const availableTargets = this.game.addons.assassin.addonData.assassin?.assassinateTargets || [];
      const goodPlayers = this.game.players.filter((p) => p.role.loyalty === 'good');

      // If no target type has been chosen yet, choose the first available one
      if (!progressData && availableTargets.length > 0) {
        const targetType = availableTargets[0];

        // Select appropriate players based on target type
        if (targetType === 'merlin' || targetType === 'guinevere' || targetType === 'cleric') {
          // Need to select 1 player for merlin/guinevere/cleric
          const randomGood = _.sample(goodPlayers);
          if (randomGood) {
            this.game.selectPlayer(assassin.userID, randomGood.userID);
          }
        } else if (targetType === 'lovers') {
          const selectedLovers = _.sampleSize(goodPlayers, 2);
          for (const lover of selectedLovers) {
            this.game.selectPlayer(assassin.userID, lover.userID);
          }
        }

        // Execute the assassination
        this.game.addons.assassin.assassinate(assassin.userID, targetType);
        console.log(
          `[GameTimer] Assassinate timeout: Auto-selected ${this.game.selectedPlayers.map((p) => p.userID).join(', ')} for ${targetType}`,
        );
      } else if (progressData) {
        // If we're in a multi-stage assassination (custom role selection)
        // Filter out any evil players from selection
        const validSelections = this.game.selectedPlayers.filter((p) => p.role.loyalty === 'good');

        // If evil players were selected, deselect them
        if (this.game.selectedPlayers.length > validSelections.length) {
          for (const player of this.game.selectedPlayers) {
            if (player.role.loyalty === 'evil') {
              this.game.selectPlayer(assassin.userID, player.userID);
            }
          }
        }

        // Fill in missing selections with random good players
        const requiredSelections = 1; // Custom role selection requires 1 player
        const currentSelections = validSelections.length;

        if (currentSelections < requiredSelections) {
          // Select additional random good players to meet requirement
          const unselectedGood = goodPlayers.filter(
            (p) => !this.game.selectedPlayers.some((sp) => sp.userID === p.userID),
          );
          const toSelect = _.sampleSize(unselectedGood, requiredSelections - currentSelections);

          for (const player of toSelect) {
            this.game.selectPlayer(assassin.userID, player.userID);
          }
        } else if (currentSelections > requiredSelections) {
          // Too many selected, keep only the first one
          for (let i = 1; i < validSelections.length; i++) {
            this.game.selectPlayer(assassin.userID, validSelections[i].userID);
          }
        }

        // Execute the assassination with a random valid role
        if (progressData.possibleTargets && progressData.possibleTargets.length > 0) {
          const randomRole = _.sample(progressData.possibleTargets);
          this.game.addons.assassin.assassinate(assassin.userID, progressData.type, randomRole);
          console.log(`[GameTimer] Assassinate timeout: Auto-selected role ${randomRole} for custom assassination`);
        }
      }
    } catch (error) {
      console.error('[GameTimer] Error in handleAssassinateTimeout:', error);
      console.error(`[GameTimer] Assassin: ${this.game.players.find((p) => p.features.isAssassin)?.userID}`);
    }
  }

  /**
   * Handle loyalty check timeout - select random player
   */
  private handleLoyaltyCheckTimeout(): void {
    const activePlayer = this.game.players.find((p) => p.features.waitForAction);
    if (!activePlayer) {
      console.log(`[GameTimer] LoyaltyCheck timeout: No active player found`);
      return;
    }
    console.log(`[GameTimer] LoyaltyCheck timeout: Player ${activePlayer.userID} needs to check loyalty`);

    // Filter out invalid selections (can't check/reveal own loyalty)
    const validSelections = this.game.selectedPlayers.filter((p) => p !== activePlayer);

    // Ensure exactly one valid player is selected
    if (validSelections.length === 0) {
      const otherPlayers = this.game.players.filter((p) => p !== activePlayer);
      const randomPlayer = _.sample(otherPlayers);

      if (randomPlayer) {
        this.game.selectPlayer(activePlayer.userID, randomPlayer.userID);
      }
    } else if (validSelections.length > 1) {
      // Too many valid players selected, keep only the first one
      // Deselect all players except the first valid one
      for (const player of this.game.selectedPlayers) {
        if (player !== validSelections[0]) {
          this.game.selectPlayer(activePlayer.userID, player.userID);
        }
      }
    } else if (this.game.selectedPlayers.length > validSelections.length) {
      // Active player is selected, deselect them
      if (this.game.selectedPlayers.some((p) => p === activePlayer)) {
        this.game.selectPlayer(activePlayer.userID, activePlayer.userID);
      }
    }

    // Execute the action with the selected player
    if (this.game.selectedPlayers.length > 0) {
      if (this.game.stage === 'checkLoyalty') {
        if (this.game.addons.ladyOfLake) {
          this.game.addons.ladyOfLake.checkLoyalty(activePlayer.userID);
        } else if (this.game.addons.ladyOfSea) {
          this.game.addons.ladyOfSea.checkLoyalty(activePlayer.userID);
        }
      } else if (this.game.stage === 'announceLoyalty' && this.game.addons.ladyOfLake) {
        const randomLoyalty = _.sample(['good', 'evil'])!;
        this.game.addons.ladyOfLake.announceLoyalty(activePlayer.userID, randomLoyalty as 'good' | 'evil');
        console.log(`[GameTimer] LoyaltyCheck timeout: Auto-announced ${randomLoyalty} loyalty`);
      }
    }
  }
}
