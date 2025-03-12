import { getModelForClass } from '@typegoose/typegoose';
import { UserProfile, StartedRoomState } from '@avalon/types';

export const userProfileModel = getModelForClass(UserProfile);
export const roomModel = getModelForClass(StartedRoomState);
