import { getModelForClass } from '@typegoose/typegoose';
import { UserProfile, StartedRoomState, UserFeatures, RoleRankings, RoleRating } from '@avalon/types';

export const userProfileModel = getModelForClass(UserProfile);
export const roomModel = getModelForClass(StartedRoomState);
export const userFeaturesModel = getModelForClass(UserFeatures);
export const roleRatingModel = getModelForClass(RoleRating);
export const roleRankingsModel = getModelForClass(RoleRankings);
