import mongoose, { Document } from 'mongoose';

import { playerSchema } from '@/database/models/player';
import { gameSettingsSchema } from '@/database/models/game/settings';

import type { IVisualGameState } from '@avalon/types';

type TGameModel = Document & IVisualGameState;

export const addonsDataSchema = new mongoose.Schema<IVisualGameState['addonsData']>({
  assassin: {
    assassinateTargets: [String],
  },
});

export const gameFeaturesSchema = new mongoose.Schema<IVisualGameState['features']>({
  anonymousVoting: Boolean,
  hiddenHistory: Boolean,
  displayIndex: Boolean,
});

export const gameSchema = new mongoose.Schema<TGameModel>({
  uuid: { type: String, required: true },
  result: String,
  stage: { type: String, required: true },
  vote: { type: Number, required: true },
  mission: { type: Number, required: true },
  settings: gameSettingsSchema,
  history: [mongoose.Schema.Types.Mixed],
  players: [playerSchema],
  addonsData: addonsDataSchema,
  features: gameFeaturesSchema,
});

export const GameModel = mongoose.model('Game', gameSchema);
