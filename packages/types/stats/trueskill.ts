import { prop, modelOptions, Severity } from '@typegoose/typegoose';
import type { TRoles, TLoyalty } from '../game/roles';
import { DEFAULT_MU, DEFAULT_SIGMA, calculateConservativeRating } from './trueskill-constants';

/**
 * Mongoose model for PlayerTrueSkillRating
 */

@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class PlayerTrueSkillRating {
  @prop({ required: true, unique: true })
  userID!: string;

  @prop({ required: true, default: DEFAULT_MU })
  mu!: number; // Mean (skill)

  @prop({ required: true, default: DEFAULT_SIGMA })
  sigma!: number; // Standard deviation (uncertainty)

  @prop({ required: true, default: 0 })
  gamesCount!: number;

  @prop({ required: true, default: 0 })
  wins!: number;

  @prop({ required: true, default: 0 })
  losses!: number;

  @prop({ type: Date, default: Date.now })
  lastPlayedAt!: Date;

  @prop({ type: Date, default: Date.now })
  updatedAt!: Date;

  @prop({ type: Date })
  lastResetAt?: Date;

  /**
   * Conservative rating (mu - 3*sigma)
   * This gives a 99.7% confidence that the player's true skill is at least this value
   */
  @prop({
    required: true,
    default: function () {
      return calculateConservativeRating(DEFAULT_MU, DEFAULT_SIGMA);
    },
  })
  conservativeRating!: number;
}

/**
 * Mongoose model for TrueSkillRatingHistory
 */
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class TrueSkillRatingHistory {
  @prop({ required: true, type: Date })
  date!: Date;

  @prop({ type: () => [TrueSkillRatingSnapshot], _id: false })
  ratings!: TrueSkillRatingSnapshot[];
}

/**
 * Snapshot of player TrueSkill rating for history
 */
export class TrueSkillRatingSnapshot {
  @prop({ required: true })
  userID!: string;

  @prop({ required: true })
  mu!: number;

  @prop({ required: true })
  sigma!: number;

  @prop({ required: true })
  conservativeRating!: number; // mu - 3*sigma

  @prop({ required: true })
  rank!: number;
}

/**
 * Mongoose model for GameTrueSkillResult
 */
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class GameTrueSkillResult {
  @prop({ required: true })
  gameID!: string;

  @prop({ required: true, type: Date })
  playedAt!: Date;

  @prop({ type: () => [PlayerTrueSkillChange], _id: false })
  playerChanges!: PlayerTrueSkillChange[];
}

/**
 * Record of TrueSkill change for a player in a game
 */
export class PlayerTrueSkillChange {
  @prop({ required: true })
  userID!: string;

  @prop({ required: true })
  oldMu!: number;

  @prop({ required: true })
  oldSigma!: number;

  @prop({ required: true })
  newMu!: number;

  @prop({ required: true })
  newSigma!: number;

  @prop({ required: true })
  oldRating!: number; // Conservative rating (mu - 3*sigma) before

  @prop({ required: true })
  newRating!: number; // Conservative rating (mu - 3*sigma) after

  @prop({ required: true })
  change!: number; // Change in conservative rating

  @prop({ required: true })
  muChange!: number; // Change in mu

  @prop({ required: true })
  role!: TRoles;

  @prop({ required: true })
  team!: TLoyalty;

  @prop({ required: true })
  won!: boolean;
}
