import { updateRatings } from './updateRatings';
import { createTrueSkillRatingSnapshot } from './updateTrueSkillRatings';

/**
 * Scheduler for running ratings updates
 * Role-based ratings update at 1 AM every day
 * TrueSkill ratings snapshot at 2 AM every day
 */
export class RatingScheduler {
  // Timer for role-based ratings
  private roleTimer: NodeJS.Timeout | null = null;
  // Timer for TrueSkill ratings
  private trueSkillTimer: NodeJS.Timeout | null = null;

  /**
   * Start the scheduler
   */
  public async start(): Promise<void> {
    console.log('Starting rating schedulers...');

    // Schedule role-based ratings update at 1 AM
    const nextRoleRunTime = this.calculateNextRunTime(1); // 1 AM
    console.log(`Next role-based rating update scheduled for: ${nextRoleRunTime.toLocaleString()}`);

    // Set timeout to run at 1 AM
    this.roleTimer = setTimeout(() => {
      this.runRoleRatingsAndScheduleNext();
    }, nextRoleRunTime.getTime() - Date.now());

    // Schedule TrueSkill ratings snapshot at 2 AM
    const nextTrueSkillRunTime = this.calculateNextRunTime(2); // 2 AM
    console.log(`Next TrueSkill rating snapshot scheduled for: ${nextTrueSkillRunTime.toLocaleString()}`);

    // Set timeout to run at 2 AM
    this.trueSkillTimer = setTimeout(() => {
      this.runTrueSkillSnapshotAndScheduleNext();
    }, nextTrueSkillRunTime.getTime() - Date.now());
  }

  /**
   * Stop the schedulers
   */
  public stop(): void {
    if (this.roleTimer) {
      clearTimeout(this.roleTimer);
      this.roleTimer = null;
      console.log('Role-based rating scheduler stopped');
    }

    if (this.trueSkillTimer) {
      clearTimeout(this.trueSkillTimer);
      this.trueSkillTimer = null;
      console.log('TrueSkill rating scheduler stopped');
    }
  }

  /**
   * Run the role-based ratings update and schedule the next run
   */
  private async runRoleRatingsAndScheduleNext(): Promise<void> {
    try {
      console.log('Running scheduled role-based ratings update...');
      await updateRatings();
      console.log('Scheduled role-based ratings update completed');
    } catch (error) {
      console.error('Error during scheduled role-based ratings update:', error);
    }

    // Schedule next run
    const nextRunTime = this.calculateNextRunTime(1); // 1 AM
    console.log(`Next role-based rating update scheduled for: ${nextRunTime.toLocaleString()}`);

    this.roleTimer = setTimeout(() => {
      this.runRoleRatingsAndScheduleNext();
    }, nextRunTime.getTime() - Date.now());
  }

  /**
   * Run the TrueSkill ratings snapshot and schedule the next run
   */
  private async runTrueSkillSnapshotAndScheduleNext(): Promise<void> {
    try {
      console.log('Running scheduled TrueSkill ratings snapshot...');
      await createTrueSkillRatingSnapshot();
      console.log('Scheduled TrueSkill ratings snapshot completed');
    } catch (error) {
      console.error('Error during scheduled TrueSkill ratings snapshot:', error);
    }

    // Schedule next run
    const nextRunTime = this.calculateNextRunTime(2); // 2 AM
    console.log(`Next TrueSkill rating snapshot scheduled for: ${nextRunTime.toLocaleString()}`);

    this.trueSkillTimer = setTimeout(() => {
      this.runTrueSkillSnapshotAndScheduleNext();
    }, nextRunTime.getTime() - Date.now());
  }

  /**
   * Calculate the next run time
   * @param hour Hour (0-23)
   * @param minute Minute (0-59), defaults to 0
   */
  private calculateNextRunTime(hour: number, minute: number = 0): Date {
    const now = new Date();
    const nextRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      0, // 0 seconds
      0, // 0 milliseconds
    );

    // If it's already past the specified time, schedule for tomorrow
    if (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute)) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }
}

// Create a singleton instance
export const ratingScheduler = new RatingScheduler();
