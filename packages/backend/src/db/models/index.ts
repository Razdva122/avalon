import { getModelForClass } from '@typegoose/typegoose';
import { UserProfile, StartedRoomState, UserFeatures } from '@avalon/types';

export const userProfileModel = getModelForClass(UserProfile);
export const roomModel = getModelForClass(StartedRoomState);
export const userFeaturesModel = getModelForClass(UserFeatures);
