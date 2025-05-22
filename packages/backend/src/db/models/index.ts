import { getModelForClass } from '@typegoose/typegoose';
import { UserProfile, StartedRoomState, UserFeatures, RoleRankings, RoleRating } from '@avalon/types';
import { PlayerTrueSkillRating, TrueSkillRatingHistory, GameTrueSkillResult } from '@avalon/types/stats/trueskill';
import { Achievement, UserAchievement, AchievementStats } from '@avalon/types/stats/achievements';

export const userProfileModel = getModelForClass(UserProfile);
export const roomModel = getModelForClass(StartedRoomState);
export const userFeaturesModel = getModelForClass(UserFeatures);
export const roleRatingModel = getModelForClass(RoleRating);
export const roleRankingsModel = getModelForClass(RoleRankings);

// TrueSkill rating models
export const playerTrueSkillRatingModel = getModelForClass(PlayerTrueSkillRating);
export const trueSkillRatingHistoryModel = getModelForClass(TrueSkillRatingHistory);
export const gameTrueSkillResultModel = getModelForClass(GameTrueSkillResult);

// Achievement models
export const achievementModel = getModelForClass(Achievement);
export const userAchievementModel = getModelForClass(UserAchievement);
export const achievementStatsModel = getModelForClass(AchievementStats);
