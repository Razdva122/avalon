import mongoose from 'mongoose';

import type { IGameSettingsWithRoles, IMissionSettings } from '@avalon/types';

export const gameMissionsSettingsSchema = new mongoose.Schema<IMissionSettings>({
  players: { type: Number, required: true },
  failsRequired: { type: Number, required: true },
});

export const gameSettingsSchema = new mongoose.Schema<IGameSettingsWithRoles>({
  roles: {
    good: [String],
    evil: [String],
  },
  missions: [gameMissionsSettingsSchema],
  players: {
    evil: { type: Number, required: true },
    good: { type: Number, required: true },
  },
  total: { type: Number, required: true },
});
