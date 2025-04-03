import { updateRatings } from './updateRatings';
import { roleRatingModel } from '../db/models';

/**
 * Scheduler for running the ratings update at 1 AM every day
 */
export class RatingScheduler {
  private timer: NodeJS.Timeout | null = null;

  /**
   * Start the scheduler
   */
  public async start(): Promise<void> {
    console.log('Starting rating scheduler...');

    // Check if ratings database exists and initialize if needed
    await this.initializeRatingsIfNeeded();

    // Calculate time until next 1 AM
    const nextRunTime = this.calculateNextRunTime();
    console.log(`Next rating update scheduled for: ${nextRunTime.toLocaleString()}`);

    // Set timeout to run at 1 AM
    this.timer = setTimeout(() => {
      this.runAndScheduleNext();
    }, nextRunTime.getTime() - Date.now());
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
      console.log('Rating scheduler stopped');
    }
  }

  /**
   * Run the ratings update and schedule the next run
   */
  /**
   * Check if ratings database exists and initialize if needed
   */
  private async initializeRatingsIfNeeded(): Promise<void> {
    try {
      // Check if any ratings exist
      const ratingsCount = await roleRatingModel.countDocuments();

      if (ratingsCount === 0) {
        console.log('No ratings found in database. Running initial ratings calculation...');
        await updateRatings();
        console.log('Initial ratings calculation completed.');
      } else {
        console.log(`Found ${ratingsCount} existing ratings in database.`);
      }
    } catch (error) {
      console.error('Error checking ratings database:', error);
    }
  }

  /**
   * Run the ratings update and schedule the next run
   */
  private async runAndScheduleNext(): Promise<void> {
    try {
      console.log('Running scheduled ratings update...');
      await updateRatings();
      console.log('Scheduled ratings update completed');
    } catch (error) {
      console.error('Error during scheduled ratings update:', error);
    }

    // Schedule next run
    const nextRunTime = this.calculateNextRunTime();
    console.log(`Next rating update scheduled for: ${nextRunTime.toLocaleString()}`);

    this.timer = setTimeout(() => {
      this.runAndScheduleNext();
    }, nextRunTime.getTime() - Date.now());
  }

  /**
   * Calculate the next 1 AM time
   */
  private calculateNextRunTime(): Date {
    const now = new Date();
    const nextRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      1, // 1 AM
      0, // 0 minutes
      0, // 0 seconds
      0, // 0 milliseconds
    );

    // If it's already past 1 AM, schedule for tomorrow
    if (now.getHours() >= 1) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }
}

// Create a singleton instance
export const ratingScheduler = new RatingScheduler();
