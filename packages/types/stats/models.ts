import { prop, modelOptions, Severity } from '@typegoose/typegoose';
import type { TRoles } from '../game/roles';

/**
 * Mongoose model for RoleRating
 */
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class RoleRating {
  @prop({ required: true })
  userID!: string;

  @prop({ required: true })
  role!: TRoles;

  @prop({ required: true })
  winrate!: number;

  @prop({ required: true })
  gamesCount!: number;

  @prop({ required: true })
  rating!: number;

  @prop({ required: true })
  rank!: number;

  @prop({ type: Date })
  lastPlayedAt?: Date;

  @prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

/**
 * Mongoose model for RoleRankings
 */
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class RoleRankings {
  @prop({ required: true, type: Date })
  date!: Date;

  @prop({ type: () => [RoleRating], _id: false })
  ratings!: RoleRating[];
}
